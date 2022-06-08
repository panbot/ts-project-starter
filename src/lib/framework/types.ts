import { Constructor } from "../types";
import { Runnable } from "../runnable";
import { Loggable } from "./log";

export type Module = { init?: () => Promise<void> };
export type ModuleConstructor = Constructor<Module>;

export type ApiConstructor = Constructor<Runnable>;

export type ApiArgParser = (
    v: unknown,
    context: {
        Type: Constructor<any>,
        userContext: UserContextBase,
    },
) => any;

export type ApiArgValidator = (
    v: unknown,
    context: {
        Type: Constructor<any>,
        userContext: UserContextBase,
    },
) => string | undefined | void | null;

export type ApiArgOptions = {
    doc: string,
    necessity: 'required' | 'optional' | 'overridden',
    inputype: string,
    Type: Constructor<any>,
    parser: ApiArgParser,
    validator: ApiArgValidator,
};

export type UserContextBase = {
    roles: number;
}

export type Controller = any;

export type ControllerConstructor = Constructor<Controller>;

export type RouteOptions = {
    httpMethod: string,
    roles?: number,
    path: string,
    aliases?: string[],
    contentType?:
        'application/json' |
        // 'application/jsonp' |
        'text/html' |
        'text/plain'
    ,
    createUserContext?: (
        headers: any,
        query: any,
        logger: Loggable,
    ) => UserContextBase,
};

export type RouteContext<Request = unknown, Reply = unknown> = {
    params: {
        [ key: string ]: any,
    },
    body: any,
    request: Request,
    reply: Reply,
    userContext: UserContextBase,
    logger: Loggable,
};

export interface RouteAdapter {
    addRoute (
        options: RouteOptions,
        runner: (rc: RouteContext) => Promise<any>,
    ): void;
}
