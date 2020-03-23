import {
    FastifyRequest,
    FastifyReply,
    HTTPMethod,
} from "fastify";
import { Roles, UserContext, AuthService } from "./auth";
import { Service, Inject } from "typedi";
import { ServerResponse } from "http";

type ApControllerType = new (...args: any[]) => any;

export function Route(
    httpMethod: HTTPMethod,
    route: string,
    roles: Roles,
    contentType: ApRouteOptions["contentType"] = "application/json",
) {
    return function (proto: InstanceType<ApControllerType>, methodName: string) {
        const Controller = proto.constructor as ApControllerType;

        let routes = ApRouteService.registry.get(Controller);
        if (routes === undefined) {
            routes = [];
            ApRouteService.registry.set(Controller, routes);
        }

        routes.push({
            Controller,
            methodName,
            httpMethod,
            route,
            roles,
            contentType,
        });
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
    contentType: 'application/json' | 'text/html' | 'text/plain';
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
            return async (
                request: FastifyRequest,
                reply: FastifyReply<ServerResponse>,
            ) => {
                reply.type(contentType + '; charset=utf-8');

                try {
                    let userContext = this.authService.extractUserContext(request.headers['authorization']);
                    this.authService.assertRoles(roles, userContext.roles);

                    let json = await runner({
                        request,
                        reply,
                        userContext,
                        params: request.params,
                        body: request.body,
                        // logger: null,
                    });

                    if (!reply.sent) {
                        reply.code(200);
                        reply.send(json);
                    }
                } catch (e) {
                    if (!reply.sent) {
                        reply.code(e.httpCode || 500);
                        reply.send(e.clientJson || { message: 'server error' });
                    }

                    if (!(e.httpCode < 500)) {
                        console.error(e);
                    }
                }
            }

            default:
            return async (
                request: FastifyRequest,
                reply: FastifyReply<ServerResponse>,
            ) => {
                reply.type(contentType + '; charset=utf-8');

                try {
                    let userContext = this.authService.extractUserContext(request.headers['authorization']);
                    this.authService.assertRoles(roles, userContext.roles);

                    let text = await runner({
                        request,
                        reply,
                        userContext,
                        params: request.params,
                        body: request.body,
                        // logger: null,
                    });

                    if (!reply.sent) {
                        reply.code(200);
                        reply.send(text);
                    }
                } catch (e) {
                    console.error(e);
                    if (!reply.sent) {
                        reply.code(e.httpCode || 500);
                        reply.send(e.message || `server error`);
                    }

                    if (!(e.httpCode < 500)) {
                        console.error(e);
                    }
                }
            }
        }
    }

    static registry = new Map<ApControllerType, ApRouteOptions[]>();
}
