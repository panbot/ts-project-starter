/// <reference types="node" />
import { FastifyRequest, FastifyReply, HTTPMethod } from "fastify";
import { Roles, UserContext } from "./auth";
import { ServerResponse } from "http";
declare type ApControllerType = new (...args: any[]) => any;
export declare function Route(httpMethod: HTTPMethod, routes: string | string[], roles: Roles, contentType?: ApRouteOptions["contentType"]): (proto: any, methodName: string) => void;
export declare type RouteContext = {
    params: {
        [key: string]: any;
    };
    body: any;
    request: FastifyRequest;
    reply: FastifyReply<ServerResponse>;
    userContext: UserContext;
};
export declare type ApRouteOptions = {
    Controller: ApControllerType;
    methodName: string;
    httpMethod: HTTPMethod;
    roles: Roles;
    route: string;
    contentType: 'application/json' | 'application/jsonp' | 'text/html' | 'text/plain';
};
export declare class ApRouteService {
    private authService;
    createHandler(options: ApRouteOptions, runner: (ctx: RouteContext) => Promise<any>): (request: FastifyRequest, reply: FastifyReply<ServerResponse>) => Promise<void>;
    private createContentTypeHandler;
    private extractRequestContext;
    private wrapJsonp;
    static registry: Map<ApControllerType, ApRouteOptions[]>;
}
export {};
