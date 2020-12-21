import * as fastify from "fastify";
import { Roles, UserContext } from "./security";
import { ArgumentError } from "./error";
import { ControllerConstructor, RouteContext, RouteOptions } from "./types";
import { jwt } from "./connectors";

export function Route(
    options: Omit<RouteOptions, 'Controller' | 'methodName'>
) {
    return function (proto: any, methodName: string) {
        let o = {
            Controller: proto.constructor as ControllerConstructor,
            methodName,
        };
        Route.routes.push(Object.assign(o, options));
    }
}

export namespace Route {
    export let routes: RouteOptions[] = [];

    export function createHandler(
        options: RouteOptions,
        runner: (rc: RouteContext) => Promise<any>,
    ) {
        let pipeline: Worker[] = [];

        pipeline.push(({ userContext }, req) => userContext.ip = getUserIp(req));

        if (!options.queryKeyForAuthentication) {
            pipeline.push(
                ({ userContext }, req) =>
                    Object.assign(userContext, parseAuthorization(req.headers['authorization']))
            );
        } else {
            let key = options.queryKeyForAuthentication;
            pipeline.push(
                ({ userContext }, req) =>
                    Object.assign(userContext, parseAuthorization((req.query as any)[key]))
            );
        }

        if (options.roles) {
            let requiredRoles = options.roles;
            pipeline.push(({ userContext }) => Roles.assertRoles(requiredRoles, userContext.roles));
        }

        pipeline.push(
            async (workpiece, request, reply) =>
                workpiece.result = await runner({
                    request,
                    reply,
                    userContext: workpiece.userContext,
                    params: request.params as any, // @FIXME
                    body: request.body,
                    // logger: null,
                })
        );

        let contentType = options.contentType;
        if (contentType) {
            //                         ↓ -------- DO NOT REMOVE THESE BRACES --------- ↓
            pipeline.push((...args) => { args[2].type(contentType + '; charset=utf-8') });
            //                         ↑ -------- DO NOT REMOVE THESE BRACES --------- ↑

            switch (contentType) {
                case 'application/json':
                    return assemble(pipeline, ({ result, error }) => error || result)

                case 'application/jsonp':
                    return assemble(
                        pipeline,
                        ({ result, error }, req) =>
                            `${(req.query as any).jsonp || '_'}(${JSON.stringify(error || result)})`,
                    )
            }
        }

        return assemble(
            pipeline,
            workpiece => workpiece.error ? stringifyError(workpiece.error) : workpiece.result,
        )
    }

    type Workpiece = { result: any, error: any, userContext: UserContext };
    type Worker = (
        workpiece: Workpiece,
        request: fastify.FastifyRequest,
        reply: fastify.FastifyReply,
    ) => any;

    const assemble = (
        pipeline: Worker[],
        terminator: Worker,
    ) => async (
        request: fastify.FastifyRequest,
        reply: fastify.FastifyReply,
    ) => {
        let workpiece: Workpiece = {
            result: null,
            error: null,
            userContext: new UserContext(),
        };
        for (let worker of pipeline) {
            try {
                await worker(workpiece, request, reply);
                reply.code(200);
            } catch (e) {
                if (e instanceof ArgumentError) {
                    reply.code(e.httpCode);
                    workpiece.error = e;
                } else {
                    reply.code(500);
                    console.error(e);
                    workpiece.error = {
                        message: 'server error',
                    };
                }
                break;
            }
        }

        return terminator(workpiece, request, reply);
    }

    function getUserIp(request: fastify.FastifyRequest) {
        let header = request.headers['x-forwarded-for'];
        if (header) {
            if (typeof header != 'string') header = header[header.length - 1];
            let list = header.split(',');
            let ip = list[list.length - 1];
            return ip.replace(/\s/g, '');
        }

        return request.socket.remoteAddress
    }

    function parseAuthorization(v: string | undefined) {
        if (v) {
            let [ scheme, payload ] = v.split(' ', 2);

            switch (scheme) {
                case 'Bearer':
                return jwt.decode(payload) as Partial<UserContext>;

                default: throw new ArgumentError(`unknown authorization scheme "${scheme}"`);
            }
        }
    }

    function stringifyError(error: any) {
        return [
            error.message,
            JSON.stringify(error, undefined, 4),
        ].join('\n')
    }

}
