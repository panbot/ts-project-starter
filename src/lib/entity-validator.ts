import "reflect-metadata";

const symbol = Symbol('entity validators');

interface Validatable {
    validate(v: unknown): null | string;
}

function reg(entity: any, propertyName: string, validator: any) {
    let map: Map<string, Validatable[]> | undefined = Reflect.getMetadata(symbol, entity);
    if (!map) {
        map = new Map<string, Validatable[]>();
        Reflect.defineMetadata(symbol, map, entity);
    }

    let validators = map.get(propertyName);
    if (validators === undefined) {
        validators = [];
        map.set(propertyName, validators);
    }

    validators.push(validator);
}

export default {

    NotBlank(msg = '不能为空') {
        return function (entity: any, propertyName: string) {
            reg(entity, propertyName, {
                validate: v => v != null && v != 0 && v != '' ? null : msg,
            })
        }
    },

    RexExp(regex: RegExp, msg = '格式不合法') {
        return function (entity: any, propertyName: string) {
            reg(entity, propertyName, {
                validate: v => regex.test(v) ? null : msg,
            })
        }
    },

    LessThan(threshold: number, msg = (threshold, v) => `必须小于${threshold}`) {
        return function (entity: any, propertyName: string) {
            reg(entity, propertyName, {
                validate: v => v < threshold ? null : msg(threshold, v),
            })
        }
    },

    GreaterThan(threshold: number, msg = (threshold, v) => `必须大于${threshold}`) {
        return function (entity: any, propertyName: string) {
            reg(entity, propertyName, {
                validate: v => v > threshold ? null : msg(threshold, v),
            })
        }
    },

    NoLessThan(threshold: number, msg = (threshold, v) => `不能小于${threshold}`) {
        return function (entity: any, propertyName: string) {
            reg(entity, propertyName, {
                validate: v => v >= threshold ? null : msg(threshold, v),
            })
        }
    },

    NoGreaterThan(threshold: number, msg = (threshold, v) => `不能大于${threshold}`) {
        return function (entity: any, propertyName: string) {
            reg(entity, propertyName, {
                validate: v => v >= threshold ? null : msg(threshold, v),
            })
        }
    },


    validate(entity: any) {
        let valid = true;
        let errors: {
            [ key: string ]: string[],
        } = {}
        let map = Reflect.getMetadata(symbol, entity) as Map<any, Validatable[]>;
        for (let [ propertyName, validators ] of map) {
            let v = entity[propertyName];
            let errs: string[] = [];
            for (let validator of validators) {
                let err = validator.validate(v);
                if (err != null) errs.push(err)
            }

            if (errs.length) {
                valid = false;
                errors[propertyName] = errs;
            }
        }

        return [ valid, errors ];
    }
}
