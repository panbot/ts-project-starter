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
const auth_1 = require("./auth");
const typedi_1 = require("typedi");
function Route(httpMethod, routes, roles, contentType = "application/json") {
    return function (proto, methodName) {
        const Controller = proto.constructor;
        let registered = ApRouteService.registry.get(Controller);
        if (registered === undefined) {
            registered = [];
            ApRouteService.registry.set(Controller, registered);
        }
        if (typeof routes == 'string') {
            routes = [routes];
        }
        for (let route of routes) {
            registered.push({
                Controller,
                methodName,
                httpMethod,
                route,
                roles,
                contentType,
            });
        }
    };
}
exports.Route = Route;
let ApRouteService = class ApRouteService {
    createHandler(options, runner) {
        const { roles, contentType, } = options;
        switch (contentType) {
            case 'application/json':
                return this.createContentTypeHandler(contentType + '; charset=utf-8', roles, runner, (result) => JSON.stringify(result));
            case 'application/jsonp':
                let wrap = (result, request) => this.wrapJsonp(result, request.query.callback);
                return this.createContentTypeHandler('application/javascript; charset=utf-8', roles, runner, wrap, wrap);
            default:
                return this.createContentTypeHandler(contentType + '; charset=utf-8', roles, runner, undefined, e => e.message);
        }
    }
    createContentTypeHandler(contentType, roles, runner, formatResult, formatError) {
        return async (request, reply) => {
            reply.type(contentType);
            let code;
            let result;
            try {
                let userContext = Object.assign({}, this.authService.extractUserContext(request.headers['authorization']), this.extractRequestContext(request));
                this.authService.assertRoles(roles, userContext.roles);
                result = await runner({
                    request,
                    reply,
                    userContext,
                    params: request.params,
                    body: request.body,
                });
                if (formatResult)
                    result = formatResult(result, request);
                code = 200;
            }
            catch (e) {
                e = e || {
                    httpCode: 500,
                    message: 'undefined error',
                };
                result = e.client || { message: 'server error' };
                if (formatError)
                    result = formatError(result, request);
                code = e.httpCode || 500;
                if (!e.httpCode || e.httpCode >= 500) {
                    console.error(e);
                }
            }
            if (!reply.sent) {
                reply.code(code);
                reply.send(result);
            }
        };
    }
    extractRequestContext(request) {
        return {};
    }
    wrapJsonp(data, callback = '_') {
        return callback + '(' + JSON.stringify(data === undefined ? null : data) + ')';
    }
};
ApRouteService.registry = new Map();
__decorate([
    typedi_1.Inject(_ => auth_1.AuthService),
    __metadata("design:type", auth_1.AuthService)
], ApRouteService.prototype, "authService", void 0);
ApRouteService = __decorate([
    typedi_1.Service()
], ApRouteService);
exports.ApRouteService = ApRouteService;
//# sourceMappingURL=route.js.map