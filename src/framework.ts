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
import di from './lib/dependency-injection';

export const Container = di();
export const instantiate: Instantiator = Container.instantiate;
export const Inject = Container.Inject;
export const Service = Container.Service;

export const { Before, After, Around } = AOP.ProxitiveAop((proxifier) =>
    Container.on('instantiated', proxifier));

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
    Parameters: Container.token<AppParameters>('app_parameters'),
    Logger: Container.token<Loggable>('logger'),
    EnabledModules: Container.token<ModuleConstructor[]>('enabled_modules'),
    Jwt: Container.token<JWT>('auth_jwt'),
    ModuleApiLookup: Container.token<ModuleApiLookup>('module_api_lookup'),
    AuthSchemes: Container.token<{ [ k: string ]: (v: string) => any }>('auth_schemes'),
};

export const InjectParam = (
    retriever: (p: AppParameters) => any,
) => Container.createInject(
    (get) => retriever(get(Tokens.Parameters)),
);
