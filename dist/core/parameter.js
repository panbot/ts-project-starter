"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
exports.ParameterToken = new typedi_1.Token('Parameters');
function InjectParam(retrieve) {
    return function (object, propertyName, index) {
        typedi_1.default.registerHandler({
            object,
            propertyName,
            index,
            value: container => retrieve(container.get(exports.ParameterToken))
        });
    };
}
exports.InjectParam = InjectParam;
//# sourceMappingURL=parameter.js.map