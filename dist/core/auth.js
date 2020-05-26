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
const error_1 = require("./error");
const parameter_1 = require("./parameter");
const connectors_1 = require("./connectors");
var Roles;
(function (Roles) {
    Roles[Roles["Anonymous"] = 0] = "Anonymous";
    Roles[Roles["Authenticated"] = 1] = "Authenticated";
    Roles[Roles["Game"] = 2] = "Game";
    Roles[Roles["CMS"] = 4] = "CMS";
    Roles[Roles["Super"] = 1023] = "Super";
})(Roles = exports.Roles || (exports.Roles = {}));
class AuthService {
    assertRoles(required, provided) {
        if (required && !(required & provided))
            throw new error_1.AccessDeniedError(`insufficient permissions`);
    }
    extractUserContext(str) {
        if (str == null)
            return {
                roles: Roles.Anonymous,
            };
        let [scheme, payload] = str.split(' ', 2);
        switch (scheme) {
            case 'Bearer':
                return this.extractBearer(payload);
            case 'dev':
                if (!this.dev)
                    throw new error_1.ArgumentError(`unknown scheme "dev"`);
                const ctx = this.dev[payload];
                if (!ctx)
                    throw new error_1.ArgumentError(`dev auth "${payload}" not found`);
                return this.dev[payload];
            case 'uid':
                if (!this.dev)
                    throw new error_1.ArgumentError(`unknown scheme "uid"`);
                return {
                    uid: payload,
                    roles: Roles.Authenticated | Roles.Game,
                };
            default: throw new error_1.ArgumentError(`unknown scheme "${scheme}"`);
        }
    }
    extractBearer(payload) {
        let o = connectors_1.jwt.decode(payload);
        if (o.uid && o.roles)
            return o;
        if (o.user_id)
            return {
                uid: o.user_id,
                roles: Roles.Authenticated & Roles.Game,
            };
        throw new error_1.ArgumentError(`unknown bearer payload`);
    }
}
__decorate([
    parameter_1.InjectParam(p => p.auth.dev),
    __metadata("design:type", Object)
], AuthService.prototype, "dev", void 0);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.js.map