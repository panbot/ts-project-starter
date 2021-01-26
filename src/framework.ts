import Container, { Token } from 'typedi';
import { Instantiator } from './lib/types';
import CreateRun from './lib/runnable';
import { ModuleConstructor } from './lib/framework/types';
import { Loggable } from './lib/framework/log';
import { JWT } from './lib/jwt';
import { ModuleApiLookup } from './lib/framework/lookup';
import { AppParameters } from './app';
import FrameworkFactory from './lib/framework';

const instantiator: Instantiator = t => Container.get(t);
export const run = CreateRun(instantiator);

const Framework = FrameworkFactory(instantiator);
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
