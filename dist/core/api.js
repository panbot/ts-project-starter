"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const auth_1 = require("./auth");
const error_1 = require("./error");
const url_1 = require("url");
function Api({ doc, name, roles }) {
    return function (Api) {
        ApiService.apis.set(Api, {
            doc,
            name: name || Api.name.replace(/Api$/i, ''),
            roles: roles || auth_1.Roles.Anonymous,
        });
    };
}
exports.Api = Api;
function ApiArg(optionsOrDoc, optional = false) {
    let options;
    if (typeof optionsOrDoc == 'string') {
        options = {
            doc: optionsOrDoc,
            optional,
        };
    }
    else {
        options = optionsOrDoc;
    }
    return function (proto, propertyName) {
        const { getOrInitArgMapFor, validatables } = ApiService;
        const Type = Reflect.getMetadata('design:type', proto, propertyName);
        if (!options.parser && !options.validator) {
            const validatable = validatables.get(Type);
            if (validatable === undefined)
                throw new Error(`${Type.name} is not validatable`);
            Object.assign(options, validatable);
        }
        getOrInitArgMapFor(proto).set(propertyName, Object.assign({
            doc: '',
            optional: false,
            inputype: `${Type.name}`.toLowerCase(),
            validator: _ => true,
            parser: v => v,
        }, options));
    };
}
exports.ApiArg = ApiArg;
function ApiArgInteger(options) {
    return ApiArg({
        doc: options.doc,
        optional: options.optional,
        parser: v => {
            let n;
            switch (typeof v) {
                case 'string':
                case 'number':
                    n = parseInt(`${v}`);
                    break;
                default: throw new Error(`not a number`);
            }
            if (options.range) {
                let [l, u] = options.range;
                if (n < l)
                    throw new Error(`lower bound ${l}`);
                if (n > u)
                    throw new Error(`upper bound ${u}`);
            }
            return n;
        }
    });
}
exports.ApiArgInteger = ApiArgInteger;
function ApiArgArrayOf(Type, options) {
    return function (proto, propertyName) {
        const { getOrInitArgMapFor, validatables } = ApiService;
        const validatable = validatables.get(Type);
        if (validatable === undefined)
            throw new Error(`${Type.name} is not validatable`);
        let parser;
        if (validatable.parser) {
            parser = async (v, api) => {
                if (!(v instanceof Array))
                    throw new error_1.ArgumentError(`not an array`);
                let parsed = [];
                for (let item of v)
                    parsed.push(await validatable.parser(item, api));
                return parsed;
            };
        }
        else {
            parser = v => v;
        }
        let validator;
        if (validatable.validator) {
            validator = async (v, api) => {
                if (!(v instanceof Array))
                    return false;
                for (let item of v) {
                    if (!await validatable.validator(item, api))
                        return false;
                }
                return true;
            };
        }
        else {
            validator = _ => true;
        }
        getOrInitArgMapFor(proto).set(propertyName, {
            doc: options.doc,
            optional: options.optional || false,
            inputype: validatable.inputype + '[]',
            validator: _ => true,
            parser,
        });
    };
}
exports.ApiArgArrayOf = ApiArgArrayOf;
function ApiUserContextArg() {
    return function (proto, propertyName) {
        setTimeout(() => ApiService.apis.get(proto.constructor).userContextProperty = propertyName, 0);
    };
}
exports.ApiUserContextArg = ApiUserContextArg;
let ApiService = ApiService_1 = class ApiService {
    get(Api) {
        let options = ApiService_1.apis.get(Api);
        if (options === undefined)
            throw new Error(`${Api.name} not found`);
        return {
            options,
            args: ApiService_1.args.get(Api),
        };
    }
    async validate(Api, api, propertyName, value) {
        const { args } = ApiService_1;
        let map = args.get(Api);
        if (map === undefined)
            throw new Error(`no args registered for "${Api.name}", ` +
                `does it have any @ApiArg() decoration?`);
        const options = map.get(propertyName);
        if (options === undefined)
            throw new Error(`arg options not found for "${Api.name}.${propertyName}", ` +
                `is it missing the @ApiArg() decoration?`);
        await this.validateByOptions(api, propertyName, value, options);
    }
    async validateAll(Api, api, values) {
        const { args } = ApiService_1;
        let map = args.get(Api);
        if (map === undefined)
            return {};
        let ret = {};
        for (let [name, options] of map) {
            let [found, value] = await this.validateByOptions(api, name, values[name], options);
            if (found)
                ret[name] = value;
        }
        return ret;
    }
    async validateByOptions(api, propertyName, value, options) {
        if (value == null) {
            if (options.optional)
                return [false, null];
            throw new error_1.ArgumentError(`"${propertyName}" is required`);
        }
        let parsed;
        try {
            parsed = await options.parser(value, api);
        }
        catch (e) {
            throw new error_1.ArgumentError(`invalid value of "${propertyName}": ${e.message}`);
        }
        if (!await options.validator(parsed, api))
            throw new error_1.ArgumentError(`invalid value of "${propertyName}"`);
        return [true, parsed];
    }
    static getOrInitArgMapFor(proto) {
        const { args } = ApiService_1;
        const ApiType = proto.constructor;
        let map = args.get(ApiType);
        if (map === undefined) {
            map = new Map();
            args.set(ApiType, map);
        }
        return map;
    }
};
ApiService.apis = new Map();
ApiService.args = new Map();
ApiService.validatables = new Map();
ApiService = ApiService_1 = __decorate([
    typedi_1.Service()
], ApiService);
exports.ApiService = ApiService;
function ApiArgValidatable(options) {
    return function (Type) {
        ApiService.validatables.set(Type, options);
    };
}
exports.ApiArgValidatable = ApiArgValidatable;
ApiArgValidatable({
    validator: v => typeof v == "string",
})(String);
ApiArgValidatable({
    validator: v => typeof v == "number",
})(Number);
ApiArgValidatable({
    validator: v => typeof v == "boolean",
})(Boolean);
ApiArgValidatable({
    parser: v => {
        switch (typeof v) {
            case "number":
            case "string": return new Date(v);
        }
        if (v instanceof Date)
            return new Date(v);
        throw new Error(`invalid date`);
    },
    validator: (d) => d.toString() != 'Invalid Date',
})(Date);
ApiArgValidatable({
    parser: v => {
        if (typeof v == 'string')
            return new url_1.URL(v);
        else
            throw new error_1.ArgumentError(`invalid url`);
    },
})(url_1.URL);
//# sourceMappingURL=api.js.map