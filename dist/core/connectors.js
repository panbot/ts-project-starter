"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const aop_1 = require("../lib/aop");
const jwt_1 = require("../lib/jwt");
const runnable_1 = require("../lib/runnable");
const typedi_1 = require("typedi");
const parameter_1 = require("./parameter");
const error_1 = require("./error");
const age_cache_1 = require("../lib/age-cache");
const instantiate = (t) => typedi_1.default.get(t);
_a = aop_1.default(instantiate, (s) => typedi_1.default.set(s.constructor, s)), exports.Before = _a.Before, exports.After = _a.After, exports.Around = _a.Around;
exports.run = runnable_1.default(instantiate);
function RunnerAgeCache(Runner, ttl) {
    return function (object, propertyName, index) {
        typedi_1.default.registerHandler({
            object,
            propertyName,
            index,
            value: container => new age_cache_1.AgeCache(() => exports.run(container.get(Runner)), ttl),
        });
    };
}
exports.RunnerAgeCache = RunnerAgeCache;
const parameters = typedi_1.default.get(parameter_1.ParameterToken);
exports.jwt = jwt_1.default(parameters.secret, error_1.AccessDeniedError);
//# sourceMappingURL=connectors.js.map