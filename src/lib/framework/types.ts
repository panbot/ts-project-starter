import { Constructor } from "../types";
import { Runnable } from "../runnable";
import { HTTPMethods } from "fastify";

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
