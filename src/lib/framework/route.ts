import { ArgumentError } from "./error";
import { Loggable } from "./log";
import { assertRoles } from "./roles";
import { ControllerConstructor, UserContextBase } from "./types";
import { HTTPMethods, FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { Instantiator } from "../types";

export type RouteOptions = {
    httpMethod: HTTPMethods,
    roles?: number,
    path: string,
    contentType?:
        'application/json' |
        'application/jsonp' |
        'text/html' |
        'text/plain'
    ,
    queryKeyForAuthentication?: string,
};

export type RouteContext = {
    params: {
        [ key: string ]: any,
    },
    body: any,
    request: FastifyRequest,
    reply: FastifyReply,
    userContext: UserContextBase,
    logger: Loggable,
};

type Workpiece = { result: any, error: any, userContext: UserContextBase };
type Worker = (
    workpiece: Workpiece,
    request: FastifyRequest,
    reply: FastifyReply,
    logger: Loggable,
) => any;

export default function (
    instantiator: Instantiator,
) {
    let routes = new Map<ControllerConstructor, Map<string, RouteOptions>>();

    const Route = (
        options: RouteOptions,
    ) => (
        proto: any, methodName: string
    ) => {
        let ctor = proto.constructor as ControllerConstructor;
        let methods = routes.get(ctor);
        if (!methods) {
            methods = new Map<string, RouteOptions>();
            routes.set(ctor, methods);
        }
        methods.set(methodName, options);
    }

    function addRoutes(
        controllers: ControllerConstructor[],
        fastify: FastifyInstance,
        instantiateUserContext: (data: any) => UserContextBase,
        authSchemes: Record<string, (payload: string) => any>,
        logger: Loggable,
    ) {
        for (let ctor of controllers) {
            const methods = routes.get(ctor);
            if (!methods) throw new Error(`routes for controller "${ctor.name}" not found`);

            const controller = instantiator(ctor);

            for (let [ methodName, options ] of methods) {
                fastify.route({
                    method: options.httpMethod,
                    url: options.path,
                    handler: createHandler(
                        options,
                        ctx => controller[methodName](ctx),
                    ),
                });
            }
        }

        function createHandler(
            options: RouteOptions,
            runner: (rc: RouteContext) => Promise<any>,
        ) {
            let pipeline: Worker[] = [];

            let contentType = options.contentType;
            if (options.contentType) {
                //                         ↓ -------- DO NOT REMOVE THESE BRACES --------- ↓
                pipeline.push((...args) => { args[2].type(contentType + '; charset=utf-8') });
                //                         ↑ -------- DO NOT REMOVE THESE BRACES --------- ↑
            }

            pipeline.push(extractUserContext(req => req.headers['authorization']));

            if (options.queryKeyForAuthentication) {
                let key = options.queryKeyForAuthentication;
                pipeline.push(extractUserContext(req => (req.query as any)[key]));
            }

            if (options.roles) {
                let requiredRoles = options.roles;
                pipeline.push(({ userContext }) => assertRoles(requiredRoles, userContext.roles));
            }

            pipeline.push(
                async (workpiece, request, reply) =>
                    workpiece.result = await runner({
                        request,
                        reply,
                        userContext: workpiece.userContext,
                        params: request.params as any, // @FIXME
                        body: request.body,
                        logger,
                    })
            );

            switch (contentType) {
                case 'application/json':
                return assemble(
                    pipeline,
                    ({ result, error }, req, reply) => reply.send(JSON.stringify(error || result)),
                )

                case 'application/jsonp':
                return assemble(
                    pipeline,
                    ({ result, error }, req, reply) => reply.send(
                        `${(req.query as any).jsonp || '_'}(${JSON.stringify(error || result)})`,
                    ),
                )

                default:
                return assemble(
                    pipeline,
                    (workpiece, req, reply) => reply.send(
                        workpiece.error ? stringifyError(workpiece.error) : workpiece.result,
                    ),
                )
            }
        }

        function assemble(
            pipeline: Worker[],
            terminator: Worker,
        ) { return async (
                request: FastifyRequest,
                reply: FastifyReply,
            ) => {
                let workpiece: Workpiece = {
                    result: null,
                    error: null,
                    userContext: instantiateUserContext(null),
                };
                for (let worker of pipeline) {
                    try {
                        await worker(workpiece, request, reply, logger);

                        reply.code(200);
                    } catch (error) {
                        if (error instanceof ArgumentError) {
                            reply.code(error.httpCode);
                            workpiece.error = error;
                            logger.debug({
                                error,
                                request: logReq(request),
                            });
                        } else {
                            reply.code(500);
                            workpiece.error = {
                                message: 'server error',
                            };
                            logger.crit({
                                error,
                                request: logReq(request),
                            });
                        }
                        break;
                    }
                }

                terminator(workpiece, request, reply, logger);
            }
        }

        function parseAuthToken(
            v: string | undefined,
        ) {
            if (v) {
                let [ scheme, payload ] = v.split(' ', 2);

                let parse = authSchemes[scheme];
                if (!parse) throw new ArgumentError(`unknown authorization scheme "${scheme}"`);

                try {
                    return parse(payload)
                } catch (e) {
                    throw new ArgumentError(`failed to parse authorization token: ${e.message}`)
                }
            }
        }

        function extractUserContext(
            extractor: (req: FastifyRequest) => string | undefined,
        ): Worker {
            return (workpiece, req, reply, logger) => { try {
                workpiece.userContext =
                    instantiateUserContext(
                        parseAuthToken(extractor(req)));
            } catch (error) {
                logger.debug({
                    error,
                    request: logReq(req),
                });
            } }
        }

    }

    return Object.assign(Route, {
        addRoutes,
    })
}

function stringifyError(error: any) {
    return [
        error.message,
        JSON.stringify(error, undefined, 4),
    ].join('\n')
}

function logReq(req: FastifyRequest) {
    return {
        method: req.method,
        url: req.url,
        body: req.body,
        headers: req.headers,
    }
}