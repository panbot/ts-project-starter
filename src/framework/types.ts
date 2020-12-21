import { Constructor } from "../lib/types";
import { Runnable } from "../lib/runnable";
import { FastifyRequest, FastifyReply, HTTPMethods } from "fastify";
import { Roles } from ".";
import { UserContext } from "./security";

export type ModuleConstructor = Constructor<{ init?: () => Promise<any> | any }>;

export type ApiConstructor = Constructor<Runnable>;

export type ApiValidatableArgOptions = {
    inputype: string,
    parser: (v: unknown, api: Runnable) => any,
    validator: (v: unknown, api: Runnable) => string | undefined | void,
};

export type ApiArgOptions = {
    doc: string,
    optional: boolean,
} & ApiValidatableArgOptions;

export type RouteContext = {
    params: {
        [ key: string ]: any,
    },
    body: any,
    request: FastifyRequest,
    reply: FastifyReply,
    userContext: UserContext,
    // logger: Loggable,
};

// export type Controller = {
//     [ key: string ]: (ctx: RouteContext) => any,
// };

export type Controller = any;

export type ControllerConstructor = Constructor<Controller>;

export type RouteOptions = {
    Controller: ControllerConstructor,
    methodName: keyof Controller,
    httpMethod: HTTPMethods,
    roles?: Roles,
    route: string,
    contentType?:
        'application/json' |
        'application/jsonp' |
        'text/html' |
        'text/plain'
    ,
    queryKeyForAuthentication?: string,
};
