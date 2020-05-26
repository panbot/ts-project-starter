"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ModuleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const error_1 = require("./error");
const api_1 = require("./api");
function Module(options) {
    return function (Module) {
        ModuleService.register(Module, {
            doc: options.doc,
            name: Module.name.replace(/module$/i, ''),
            apis: options.apis || [],
            controllers: options.controllers || [],
        });
    };
}
exports.Module = Module;
let ModuleService = ModuleService_1 = class ModuleService {
    initModuleApis() {
        const { registry, apis } = ModuleService_1;
        for (let [Module, options] of registry) {
            let map = new Map();
            for (let Api of options.apis) {
                const apiOption = api_1.ApiService.apis.get(Api);
                if (apiOption === undefined)
                    throw new Error(`${Api.name} is not registered, is it missing the @Api() decoration?`);
                map.set(apiOption.name, Api);
            }
            apis.set(Module, map);
        }
    }
    getApi(module, api) {
        const { names, apis } = ModuleService_1;
        const Module = names.get(module);
        if (Module === undefined)
            throw new error_1.ArgumentError(`module "${module}" not found`);
        const moduleApis = apis.get(Module);
        if (moduleApis === undefined)
            throw new Error(`call ModuleService.initModuleApis() first`);
        const Api = moduleApis.get(api);
        if (Api === undefined)
            throw new error_1.ArgumentError(`api "${api}" not found in "${module}"`);
        return Api;
    }
    static register(Module, options) {
        const { names, registry } = ModuleService_1;
        registry.set(Module, options);
        const ExistingModule = names.get(options.name);
        if (ExistingModule !== undefined)
            throw new Error(`modules name "${options.name}" conflict between ` +
                `"${ExistingModule.name}" and "${Module.name}"`);
        names.set(options.name, Module);
    }
};
ModuleService.registry = new Map();
ModuleService.names = new Map();
ModuleService.apis = new Map();
ModuleService = ModuleService_1 = __decorate([
    typedi_1.Service()
], ModuleService);
exports.ModuleService = ModuleService;
//# sourceMappingURL=module.js.map