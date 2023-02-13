import {
    Api,
    ArgumentError,
    Container,
    Module,
    Tokens,
} from "./framework";
import LoggerFactory, { ConsoleLogger } from './lib/framework/log';
import createJWT from "./lib/jwt";
import { ModuleApiLookup } from "./lib/framework/lookup";

let parameters: AppParameters = require('../parameters.json');
Container.set(Tokens.Parameters, parameters);

Container.set(Tokens.Logger, LoggerFactory(
    parameters.logLevel,
    [
        new ConsoleLogger(),
    ]
));

const jwt = createJWT(parameters.secret, ArgumentError);
Container.set(Tokens.Jwt, jwt);

Container.set(Tokens.AuthSchemes, {
    Bearer: jwt.decode,
});

import modules from './enabled-modules';
import { AppParameters } from "./app/parameter";
Container.set(Tokens.EnabledModules, modules);

if (parameters.dev) require('./dev');

Container.set(Tokens.ModuleApiLookup, new ModuleApiLookup(Module, Api));
