import 'reflect-metadata';
import Container, { Token } from 'typedi';
import { Instantiator } from './lib/types';
import CreateRun from './lib/runnable';
import { ModuleConstructor } from './lib/framework/types';
import { Loggable } from './lib/framework/log';
import { JWT } from './lib/jwt';
import { ModuleApiLookup } from './lib/framework/lookup';
import { AppParameters } from './app';
import FrameworkFactory from './lib/framework';
import * as AOP from './lib/aop';

export const instantiate: Instantiator = type => Container.get(type);

export const { Before, After, Around } = AOP.ProxifiedAopFactory(
    instantiate,
    (type, instance) => Container.set(type, instance),
);

export const run = CreateRun(instantiate);

const Framework = FrameworkFactory(instantiate);
export const {
    Module,
    Api,
    ApiArg,
    ApiArgValidatable,
    Route,
} = Framework;

export * from './lib/framework/error';

export const Tokens = {
    Parameters: new Token<AppParameters>('app parameters'),
    Logger: new Token<Loggable>('logger'),
    EnabledModules: new Token<ModuleConstructor[]>('enabled modules'),
    Jwt: new Token<JWT>('auth jwt'),
    ModuleApiLookup: new Token<ModuleApiLookup>('module api lookup'),
    AuthSchemes: new Token<{ [ k: string ]: (v: string) => any }>(),
};

export const InjectParam = (
    retrieve: (p: AppParameters) => any,
) => (
    object: any,
    propertyName: string,
    index?: number,
) => { Container.registerHandler({
    object,
    propertyName,
    index,
    value: container => retrieve(container.get(Tokens.Parameters))
}) }

export const InjectAop = () => (
    object: any,
    propertyName: string,
) => {
    const type = Reflect.getMetadata('design:type', object, propertyName);

    Container.registerHandler({
        object,
        propertyName,
        index: undefined,
        value: () => instantiate(type),
    })
}