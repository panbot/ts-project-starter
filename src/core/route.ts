import {
    FastifyRequest,
    FastifyReply,
    HTTPMethod,
} from "fastify";
import { Roles, UserContext, AuthService } from "./auth";
import { Service, Inject } from "typedi";
import { ServerResponse } from "http";
import { ArgumentError } from "./error";

type ApControllerType = new (...args: any[]) => any;

export function Route(
    httpMethod: HTTPMethod,
    routes: string | string[],
    roles: Roles,
    contentType: ApRouteOptions["contentType"] = "application/json",
) {
    return function (proto: InstanceType<ApControllerType>, methodName: string) {
        const Controller = proto.constructor as ApControllerType;

        let registered = ApRouteService.registry.get(Controller);
        if (registered === undefined) {
            registered = [];
            ApRouteService.registry.set(Controller, registered);
        }

        if (typeof routes == 'string') {
            routes = [ routes ];
        }

        for (let route of routes) {
            registered.push({
                Controller,
                methodName,
                httpMethod,
                route,
                roles,
                contentType,
            });
        }

    }
}

export type RouteContext = {
    params: {
        [ key: string ]: any,
    },
    body: any,
    request: FastifyRequest,
    reply: FastifyReply<ServerResponse>,
    userContext: UserContext,
    // logger: Loggable,
}

export type ApRouteOptions = {
    Controller: ApControllerType,
    methodName: string,
    httpMethod: HTTPMethod,
    roles: Roles,
    route: string,
    contentType:
        'application/json' |
        'application/jsonp' |
        'text/html' |
        'text/plain'
    ,
}

@Service()
export class ApRouteService {

    @Inject(_ => AuthService)
    private authService: AuthService;

    createHandler(
        options: ApRouteOptions,
        runner: (ctx: RouteContext) => Promise<any>,
    ): (
        request: FastifyRequest,
        reply: FastifyReply<ServerResponse>,
    ) => Promise<void>
    {
        const {
            roles,
            contentType,
        } = options;

        switch (contentType) {

            case 'application/json':
            return this.createContentTypeHandler(
                contentType + '; charset=utf-8',
                roles,
                runner,
                (result: any) => JSON.stringify(result),
            );

            case 'application/jsonp':
            let wrap = (result: any, request: FastifyRequest) => this.wrapJsonp(
                result,
                request.query.callback,
            );
            return this.createContentTypeHandler(
                 'application/javascript; charset=utf-8',
                roles,
                runner,
                wrap,
                wrap,
            );

            default:
            return this.createContentTypeHandler(
                contentType + '; charset=utf-8',
                roles,
                runner,
                undefined,
                e => e.message,
            )
        }
    }

    private createContentTypeHandler(
        contentType: string,
        roles: Roles,
        runner: (ctx: RouteContext) => Promise<any>,
        formatResult?: (result: any, request: FastifyRequest) => any,
        formatError?: (error: any, request: FastifyRequest) => any,
    ) {
        return async (
            request: FastifyRequest,
            reply: FastifyReply<ServerResponse>,
        ) => {
            reply.type(contentType);

            let code: number;
            let result: any;

            try {
                let userContext: UserContext = Object.assign(
                    {},
                    this.authService.extractUserContext(
                        request.headers['authorization']
                    ),
                    this.extractRequestContext(request),
                );
                this.authService.assertRoles(roles, userContext.roles);

                result = await runner({
                    request,
                    reply,
                    userContext,
                    params: request.params,
                    body: request.body,
                    // logger: null,
                });
                if (formatResult) result = formatResult(result, request);
                code = 200;
            } catch (e) {
                e = e || {
                    httpCode: 500,
                    message: 'undefined error',
                };

                result = e.client || { message: 'server error' };
                if (formatError) result = formatError(result, request);
                code = e.httpCode || 500;

                if (!e.httpCode || e.httpCode >= 500) {
                    console.error(e);
                }
            }

            if (!reply.sent) {
                reply.code(code);
                reply.send(result);
            }
        }
    }

    private extractRequestContext(request: FastifyRequest) {
        return {
        } as Partial<UserContext>;
    }

    private wrapJsonp(data: any, callback = '_') {
        return callback + '(' + JSON.stringify(data === undefined ? null : data) + ')';
    }

    static registry = new Map<ApControllerType, ApRouteOptions[]>();
}
