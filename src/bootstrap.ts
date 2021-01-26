import "reflect-metadata";

import Container from "typedi";
import { useContainer } from 'typeorm';
useContainer(Container);

import {
    Api,
    ArgumentError,
    Module,
    Tokens,
} from "./framework";
import LoggerFactory, { ConsoleLogger } from './lib/framework/log';
import createJWT from "./lib/jwt";
import modules from './enabled-modules';
import { ModuleApiLookup } from "./lib/framework/lookup";
import { AppParameters } from "./app";

let parameters: AppParameters = require('../parameters.json');
Container.set(Tokens.Parameters, parameters);

Container.set(Tokens.Logger, LoggerFactory(
    parameters.logLevel,
    [
        new ConsoleLogger(),
    ]
));

Container.set(Tokens.EnabledModules, modules);

Container.set(Tokens.ModuleApiLookup, new ModuleApiLookup(Module, Api));

const jwt = createJWT(parameters.secret, ArgumentError);
Container.set(Tokens.Jwt, jwt);
