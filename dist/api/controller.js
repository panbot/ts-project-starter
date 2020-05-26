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
const route_1 = require("../core/route");
const app_1 = require("../core/app");
const typedi_1 = require("typedi");
const auth_1 = require("../core/auth");
exports.API_ENTRY_ROUTE = '/api/:module/:api';
let ApiController = class ApiController {
    api({ params: { module, api }, body, userContext, }) {
        return this.app.run(module, api, userContext, body);
    }
};
__decorate([
    typedi_1.Inject(_ => app_1.App),
    __metadata("design:type", app_1.App)
], ApiController.prototype, "app", void 0);
__decorate([
    route_1.Route('POST', exports.API_ENTRY_ROUTE, auth_1.Roles.Anonymous, 'application/json'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "api", null);
ApiController = __decorate([
    typedi_1.Service()
], ApiController);
exports.ApiController = ApiController;
//# sourceMappingURL=controller.js.map