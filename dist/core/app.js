"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const Fastify = require("fastify");
const parameter_1 = require("./parameter");
const crypto_1 = require("crypto");
const typedi_1 = require("typedi");
const module_1 = require("./module");
const connectors_1 = require("./connectors");
const auth_1 = require("./auth");
const api_1 = require("./api");
const route_1 = require("./route");
class App {
    async loadModules(Modules) {
        this.Modules = Modules;
        this.moduleService.initModuleApis();
        for (let Module of this.Modules) {
            if (!Module.prototype.init)
                continue;
            let module = typedi_1.default.get(Module);
            await module.init();
        }
    }
    async run(module, api, userContext, args) {
        const Api = this.moduleService.getApi(module, api);
        return this.runApi(Api, userContext, args);
    }
    async runApi(Api, userContext, args) {
        const { roles, userContextProperty } = this.apiService.get(Api).options;
        this.authService.assertRoles(roles, userContext.roles);
        let runnable = Object.create(typedi_1.default.get(Api));
        Object.assign(runnable, await this.apiService.validateAll(Api, runnable, args));
        if (userContextProperty !== undefined) {
            runnable[userContextProperty] = userContext;
        }
        return connectors_1.run(runnable);
    }
    startFastify() {
        let fastify = Fastify({
            genReqId: () => crypto_1.randomBytes(16).toString('hex'),
        });
        fastify.listen(this.fastifyOptions, (err, address) => {
            if (err)
                throw err;
            console.log(`fastify listening on ${address}`);
        });
        fastify.register(require('fastify-cors'), {
            maxAge: 3600,
        });
        for (let Module of this.Modules) {
            let moduleOptions = module_1.ModuleService.registry.get(Module);
            if (moduleOptions === undefined)
                throw new Error(`"${Module.name}" is loaded but not registered, ` +
                    `is it missing the @Module() decoration?`);
            for (let Controller of moduleOptions.controllers) {
                let routes = route_1.ApRouteService.registry.get(Controller);
                if (routes === undefined)
                    throw new Error(`no routes found for "${Controller.name}", ` +
                        `is it missing the @Route() decoration?`);
                for (let options of routes) {
                    const { Controller, methodName, httpMethod: method, route: url, } = options;
                    fastify.route({
                        method,
                        url,
                        handler: this.routeService.createHandler(options, ctx => typedi_1.default.get(Controller)[methodName](ctx)),
                    });
                }
            }
        }
    }
}
__decorate([
    parameter_1.InjectParam(p => p.fastify.listen),
    __metadata("design:type", Object)
], App.prototype, "fastifyOptions", void 0);
__decorate([
    typedi_1.Inject(_ => module_1.ModuleService),
    __metadata("design:type", module_1.ModuleService)
], App.prototype, "moduleService", void 0);
__decorate([
    typedi_1.Inject(_ => api_1.ApiService),
    __metadata("design:type", api_1.ApiService)
], App.prototype, "apiService", void 0);
__decorate([
    typedi_1.Inject(_ => route_1.ApRouteService),
    __metadata("design:type", route_1.ApRouteService)
], App.prototype, "routeService", void 0);
__decorate([
    typedi_1.Inject(_ => auth_1.AuthService),
    __metadata("design:type", auth_1.AuthService)
], App.prototype, "authService", void 0);
exports.App = App;
//# sourceMappingURL=app.js.map