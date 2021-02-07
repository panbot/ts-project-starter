import { FastifyRequest, FastifyReply, HTTPMethods } from "fastify";
import { HttpCodedError } from "./error";
import { Loggable, createLoggerProxy } from "./log";
import { assertRoles } from "./roles";
import { UserContextBase, RouteContext, RouteOptions, RouteAdapter } from "./types";
import { FastifyInstance } from "fastify";

export class FastifyHandlerFactory
implements RouteAdapter
{

    constructor(
        public fastify: FastifyInstance,
        public instantiateUserContext: (data: any) => UserContextBase,
        public authSchemes: Record<string, (payload: string) => any>,
        public logger: Loggable,
    ) { }

    addRoute(
        options: RouteOptions,
        runner: (rc: RouteContext) => Promise<any>,
    ) {
        const getUserContext = this.getUserContextFactory(options);
        const { succeed, fail } = this.resultHandlerFactory(options);

        for (let url of (options.aliases || []).concat(options.path)) {
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
                                userContext: getUserContext(request, logger),
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

    private getUserContextFactory(options: RouteOptions) {
        let getUserContext = (req: FastifyRequest, logger: Loggable): UserContextBase =>
            this.extractUserContext(req.headers['authorization'], logger) ||
            this.instantiateUserContext(null);

        if (options.queryKeyForAuthentication) {
            let key = options.queryKeyForAuthentication;
            getUserContext = after(
                getUserContext,
                (userContext, req, logger) => this.extractUserContext((req.query as any)[key], logger) || userContext,
            );
        }

        if (options.roles) {
            let requiredRoles = options.roles;
            getUserContext = after(
                getUserContext,
                userContext => ( assertRoles(requiredRoles, userContext.roles), userContext ),
            );
        }

        return getUserContext;
    }

    private extractUserContext(v: string | undefined, logger: Loggable) {
        try {
            return this.instantiateUserContext(this.parseAuthToken(v));
        } catch (error) {
            logger.debug(error);
        }
    }

    private parseAuthToken(v: string | undefined) {
        if (v) {
            let [ scheme, payload ] = v.split(' ', 2);

            let parse = this.authSchemes[scheme];
            if (!parse) throw new Error(`unknown authorization scheme "${scheme}"`);

            try {
                return parse(payload)
            } catch (e) {
                throw new Error(`failed to parse authorization token: ${e.message}`)
            }
        }
    }

    private resultHandlerFactory(options: RouteOptions) {
        type OnResult = (
            resultOrError: any,
            loggable: Loggable,
            reply: FastifyReply,
            request: FastifyRequest) => any;
        let succeed: OnResult;
        let fail: OnResult;
        class Result { }

        if (options.contentType) {
            let ct = options.contentType;
            let base: OnResult = (result, _, reply) => ( reply.type(ct + '; charset=utf-8'), result );

            const format = formatFactory(options.contentType);

            succeed = after(base, (_, result, logger, reply) => {
                logger.debug(Object.assign(new Result, result));
                reply.code(200);
                reply.send(format.result(result));
            })

            fail = after(base, (_, error, logger, reply) => {
                const { statusCode, userFriendlyError } = defaultErrorHandler(error, logger);
                reply.code(statusCode);
                reply.send(format.error(userFriendlyError));
            })
        } else {
            fail = succeed = (result, logger, reply) => {
                if (!reply.sent) {
                    logger.crit('reply not sent', result);
                    reply.code(500);
                    reply.send('something went wrong');
                }
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
            Object.assign(new Request, {
                method: request.method,
                url: request.url,
                body: request.body,
                headers: request.headers,
            }),
            Object.assign(new Response, {
                statusCode: reply.statusCode,
                headers: reply.getHeaders(),
            }),
            ...data])
    }

}

function formatFactory(ct: string): Record<'result' | 'error', (v: any) => any> {
    switch (ct) {
        case 'application/json': return {
            result: v => JSON.stringify(v),
            error: v => JSON.stringify(Object.assign({
                message: v?.message,
            }, v)),
        }

        case 'application/jsonp': throw new Error(`TODO: ${ct}`);

        default: return {
            result: v => v,
            error: v => [
                v?.message,
                JSON.stringify(v, undefined, 4),
            ].join('\n'),
        }
    }
}

function defaultErrorHandler(error: any, logger?: Loggable) {
    let statusCode: number;
    let userFriendlyError: any;

    if (error instanceof HttpCodedError) {
        statusCode = error.httpCode;
        if (statusCode < 500) userFriendlyError = error;
        else userFriendlyError = new Error(error.userFriendlyMessage);
    } else {
        statusCode = 500;
        userFriendlyError = new Error('something went wrong');
    }

    if (statusCode < 500) {
        logger?.debug(error)
    } else {
        logger?.crit(error);
    }

    return {
        statusCode,
        userFriendlyError,
    }
}

const after = <F extends (...args: any) => any>(
    func: F,
    advice: (result: ReturnType<F>, ...args: Parameters<F>) => ReturnType<F>,
) => (...args: any) => advice(func(...args), ...args);
