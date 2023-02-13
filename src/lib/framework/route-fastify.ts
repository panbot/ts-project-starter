import { FastifyRequest, FastifyReply, HTTPMethods } from "fastify";
import { defaultErrorHandler } from "./error";
import { Loggable, createLoggerProxy } from "./log";
import { Anonymous, assertRoles } from "./roles";
import { UserContextGeneric, RouteOptions, RouteAdapter, RouteContextGeneric } from "./types";
import { FastifyInstance } from "fastify";

export class FastifyHandlerFactory
implements RouteAdapter
{
    constructor(
        public fastify: FastifyInstance,
        public logger: Loggable,
    ) { }

    addRoute(
        options: RouteOptions,
        runner: (rc: RouteContextGeneric) => Promise<any>,
    ) {
        const createUserContext = this.userContextFactory(options);
        const { succeed, fail } = this.resultHandlerFactory(options);

        for (let url of [ options.path, ...options.aliases || [] ]) {
            this.fastify.route({
                method: options.httpMethod as HTTPMethods,
                url,
                handler: async (
                    request: FastifyRequest,
                    reply: FastifyReply,
                ) => {
                    const logger = this.wrapLogger(this.logger, request, reply);
                    try {
                        succeed(
                            await runner({
                                request,
                                reply,
                                userContext: createUserContext(request, logger),
                                params: request.params as any, // @FIXME
                                body: request.body,
                                logger,
                            }),
                            logger,
                            reply,
                            request,
                        );
                    } catch (e) {
                        fail(e, logger, reply, request);
                    }
                },
            });
        }
    }

    private userContextFactory(options: RouteOptions) {
        let factory: (
            request: FastifyRequest,
            logger: Loggable,
        ) => UserContextGeneric;

        if (options.createUserContext) {
            let create = options.createUserContext;
            factory = (request, logger) => create(request, logger);
        } else {
            factory = (request, logger) => ({ roles: Anonymous, logger });
        }

        if (options.roles) {
            let requiredRoles = options.roles;
            factory = after(
                factory,
                ctx => ( assertRoles(requiredRoles, ctx.roles), ctx ),
            )
        }

        return factory
    }

    private resultHandlerFactory(options: RouteOptions) {
        type OnResult = (
            resultOrError: any,
            loggable: Loggable,
            reply: FastifyReply,
            request: FastifyRequest) => any;
        let succeed: OnResult;
        let fail: OnResult;
        class Result {
            constructor(public result: any) { }
        }

        if (options.contentType) {
            let ct = options.contentType;
            let base: OnResult = (result, logger, reply) => {
                if (reply.sent) {
                    logger.warn('reply already sent');
                } else {
                    reply.type(ct + '; charset=utf-8');
                }
                return result;
            }

            const format = formatFactory(options.contentType);

            succeed = after(base, (_, result, logger, reply) => {
                reply.code(reply.statusCode || 200);
                reply.send(format.result(result));

                logger.debug(new Result(result));
            })

            fail = after(base, (_, error, logger, reply) => {
                const { statusCode, userFriendlyError } = defaultErrorHandler(error);

                reply.code(statusCode);
                reply.send(format.error(userFriendlyError));

                if (statusCode < 500) {
                    logger.debug(error);
                } else {
                    logger.crit(error);
                }
            })
        } else {
            fail = (error, logger, reply) => {
                if (error.httpCode < 500) {
                    logger.debug(error);
                } else {
                    logger.crit(error);
                }

                if (reply.sent) return;

                reply.code(error.httpCode || 500);
                reply.send(error.message);
            };

            succeed = (result, logger, reply) => {
                if (reply.sent) return;

                logger.crit('reply not sent', result);
                reply.code(500);
                reply.send('');
            }
        }

        return { succeed, fail }
    }

    private wrapLogger(
        logger: Loggable,
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        class Request { }
        class Response { }

        return createLoggerProxy(logger, data => [
            Object.assign(new Request(), {
                method: request.method,
                url: request.url,
                body: request.body,
                headers: request.headers,
            }),
            Object.assign(new Response(), {
                statusCode: reply.statusCode,
                headers: reply.getHeaders(),
            }),
            ...data,
        ])
    }

}

function formatFactory(ct: string): Record<'result' | 'error', (v: any) => any> {
    switch (ct) {
        case 'application/json': return {
            result: v => JSON.stringify(v !== undefined ? v : null),
            error: v => JSON.stringify({ message: v?.message, ...v }),
        }

        case 'application/jsonp': throw new Error(`unsupported content type "${ct}"`);

        default: return {
            result: v => v,
            error: v => [
                v?.message,
                JSON.stringify(v, undefined, 4),
            ].join('\n'),
        }
    }
}

const after = <F extends (...args: any) => any>(
    func: F,
    advice: (result: ReturnType<F>, ...args: Parameters<F>) => ReturnType<F>,
) => (...args: any) => advice(func(...args), ...args);
