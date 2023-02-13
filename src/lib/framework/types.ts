import { Constructor } from "../types";
import { Runnable } from "../runnable";
import { Loggable } from "./log";
import { Socket } from "net";

export type Module = { init?: () => Promise<void> };
export type ModuleConstructor = Constructor<Module>;

export type ApiConstructor = Constructor<Runnable>;

export type ApiArgParser = (
    v: unknown,
    context: {
        Type: Constructor<any>,
        userContext: UserContextGeneric,
    },
) => any;

export type ApiArgValidator = (
    v: unknown,
    context: {
        Type: Constructor<any>,
        userContext: UserContextGeneric,
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

export type UserContextGeneric = {
    roles: number;
    logger?: Loggable;
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
        request: {
            headers: Record<string, any> | undefined,
            socket: Socket,
            query: any,
        },
        logger: Loggable,
    ) => UserContextGeneric,
};

export type RouteContextGeneric<
    Request = unknown,
    Reply = unknown,
    UserContext extends UserContextGeneric = UserContextGeneric,
> = {
    params: {
        [ key: string ]: any,
    },
    body: any,
    request: Request,
    reply: Reply,
    userContext: UserContext,
    logger: Loggable,
};

export interface RouteAdapter {
    addRoute (
        options: RouteOptions,
        runner: (rc: RouteContextGeneric) => Promise<any>,
    ): void;
}
