"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typedi_1 = require("typedi");
const typeorm_1 = require("typeorm");
typeorm_1.useContainer(typedi_1.default);
const parameter_1 = require("./core/parameter");
let parameters = require('../parameters.json');
typedi_1.default.set(parameter_1.ParameterToken, parameters);
const app_1 = require("./core/app");
const module_1 = require("./api/module");
// import { GoldRushModule } from "./gold-rush/module";
// import { MongoCmsModule } from "./mongo-cms/module";
// import { AlipayModule } from "./alipay/module";
// import { CompassModule } from "./compass/module";
let modules = [
    // modules goes in here
    module_1.ApiModule,
];
if (parameters.dev) {
    modules.push(require('./demo/module').DemoModule);
}
async function default_1() {
    const app = typedi_1.default.get(app_1.App);
    await app.loadModules(modules);
    return app;
}
exports.default = default_1;
//# sourceMappingURL=bootstrap.js.map