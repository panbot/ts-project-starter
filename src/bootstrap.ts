import "reflect-metadata";

import Container from "typedi";
import { useContainer } from 'typeorm';
useContainer(Container);

import { ParameterToken, Parameters } from "./core/parameter";

let parameters: Parameters = require('../parameters.json');
Container.set(ParameterToken, parameters);

import { App } from "./core/app";
import { ModuleType } from "./core/module";

import { ApiEntryModule } from "./api-entry/module";
// import { GoldRushModule } from "./gold-rush/module";
// import { MongoCmsModule } from "./mongo-cms/module";
// import { AlipayModule } from "./alipay/module";
// import { CompassModule } from "./compass/module";

let modules: ModuleType[] = [
    // modules goes in here
    ApiEntryModule,
];

if (parameters.dev) {
    modules.push(require('./demo/module').DemoModule);
}

export default async function() {

    const app = Container.get(App);
    await app.loadModules(modules);

    return app;
}
