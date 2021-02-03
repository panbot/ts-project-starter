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
import memoize from './lib/memoize';

export const instantiate: Instantiator = type => Container.get(type);

export const { Before, After, Around } = AOP.InjectiveAopFactory(
    (object, propertyName, value) => {
        while (true) {
            let index = Container.handlers.findIndex(
                v => v.object == object && v.propertyName == propertyName,
            );
            if (index >= 0) Container.handlers.splice(index, 1);
            else break;
        }

        Container.registerHandler({
            object,
            propertyName,
            value,
        });
    }
);

// export const { Before, After, Around } = AOP.DestructiveAop();

export const Memoize = memoize(Around);

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
