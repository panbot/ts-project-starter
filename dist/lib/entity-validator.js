"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const symbol = Symbol('entity validators');
function reg(entity, propertyName, validator) {
    let map = Reflect.getMetadata(symbol, entity);
    if (!map) {
        map = new Map();
        Reflect.defineMetadata(symbol, map, entity);
    }
    let validators = map.get(propertyName);
    if (validators === undefined) {
        validators = [];
        map.set(propertyName, validators);
    }
    validators.push(validator);
}
exports.default = {
    NotBlank(msg = '不能为空') {
        return function (entity, propertyName) {
            reg(entity, propertyName, {
                validate: v => v != null && v != 0 && v != '' ? null : msg,
            });
        };
    },
    RexExp(regex, msg = '格式不合法') {
        return function (entity, propertyName) {
            reg(entity, propertyName, {
                validate: v => regex.test(v) ? null : msg,
            });
        };
    },
    LessThan(threshold, msg = (threshold, v) => `必须小于${threshold}`) {
        return function (entity, propertyName) {
            reg(entity, propertyName, {
                validate: v => v < threshold ? null : msg(threshold, v),
            });
        };
    },
    GreaterThan(threshold, msg = (threshold, v) => `必须大于${threshold}`) {
        return function (entity, propertyName) {
            reg(entity, propertyName, {
                validate: v => v > threshold ? null : msg(threshold, v),
            });
        };
    },
    NoLessThan(threshold, msg = (threshold, v) => `不能小于${threshold}`) {
        return function (entity, propertyName) {
            reg(entity, propertyName, {
                validate: v => v >= threshold ? null : msg(threshold, v),
            });
        };
    },
    NoGreaterThan(threshold, msg = (threshold, v) => `不能大于${threshold}`) {
        return function (entity, propertyName) {
            reg(entity, propertyName, {
                validate: v => v >= threshold ? null : msg(threshold, v),
            });
        };
    },
    validate(entity) {
        let valid = true;
        let errors = {};
        let map = Reflect.getMetadata(symbol, entity);
        for (let [propertyName, validators] of map) {
            let v = entity[propertyName];
            let errs = [];
            for (let validator of validators) {
                let err = validator.validate(v);
                if (err != null)
                    errs.push(err);
            }
            if (errs.length) {
                valid = false;
                errors[propertyName] = errs;
            }
        }
        return [valid, errors];
    }
};
//# sourceMappingURL=entity-validator.js.map