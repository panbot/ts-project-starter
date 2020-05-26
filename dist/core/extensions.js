"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("./api");
const auth_1 = require("./auth");
function AuthenticatedApi(doc) {
    return api_1.Api({ doc, roles: auth_1.Roles.Authenticated });
}
exports.AuthenticatedApi = AuthenticatedApi;
function CmsApi(doc) {
    return api_1.Api({ doc, roles: auth_1.Roles.CMS });
}
exports.CmsApi = CmsApi;
//# sourceMappingURL=extensions.js.map