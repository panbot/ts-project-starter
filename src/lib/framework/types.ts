import { Constructor } from "../types";
import { Runnable } from "../runnable";
import { Loggable } from "./log";

export type Module = { init?: () => Promise<void> };
export type ModuleConstructor = Constructor<Module>;

export type ApiConstructor = Constructor<Runnable>;

export type ApiArgParser = (
    v: unknown,
    context: {
        Api: ApiConstructor,
        userContext: UserContextBase,
    },
) => any;

export type ApiArgValidator = (
    v: unknown,
    context: {
        Api: ApiConstructor,
        userContext: UserContextBase,
    },
) => string | undefined | void | null;

export type ApiArgValidatableOptions = {
    inputype: string,
    parser: ApiArgParser,
    validator: ApiArgValidator,
} | {
    inputype: string,
    parser: ApiArgParser,
    validator?: ApiArgValidator,
} | {
    inputype: string,
    parser?: ApiArgParser,
    validator: ApiArgValidator,
};

export type ApiArgOptions = {
    doc: string,
    necessity: 'required' | 'optional' | 'overridden',
    inputype: string,
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
    queryKeyForAuthentication?: string,
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
