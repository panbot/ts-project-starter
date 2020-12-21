import "reflect-metadata";

import Container from "typedi";
import { useContainer } from 'typeorm';
useContainer(Container);

import shutdown from './lib/shutdown';
shutdown.listen();

import { AppParameters, ParameterToken } from "./parameter";
let parameters: AppParameters = require('../parameters.json');
Container.set(ParameterToken, parameters);
