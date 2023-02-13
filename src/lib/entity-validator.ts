import "reflect-metadata";

const EntityValidators = Symbol('entity validators');

interface Validatable {
    name: string,
    value: any,
    nullable: boolean,
    validate(v: unknown): string | undefined | null | void;
}

function reg(
    entityOrClass: Function | Object,
    propertyName: string,
    validatable: Validatable,
) {
    let entityClass: Function;
    if (typeof entityOrClass == 'function') {
        entityClass = entityOrClass;
    } else {
        entityClass = entityOrClass.constructor;
    }

    let map: Map<string, Validatable[]>;
    if (!Reflect.hasMetadata(EntityValidators, entityClass)) {
        map = new Map<string, Validatable[]>();
        Reflect.defineMetadata(EntityValidators, map, entityClass);
    } else {
        map = Reflect.getMetadata(EntityValidators, entityClass);
    }

    let validatables = map.get(propertyName);
    if (validatables === undefined) {
        validatables = [];
        map.set(propertyName, validatables);
    }

    validatables.push(validatable);
}

export default {

    NotBlank: (
        msg = '不能为空',
    ) => (entity: any, propertyName: string) => reg(
        entity,
        propertyName,
        {
            name: 'NotBlank',
            value: true,
            nullable: false,
            validate: v => v != null && v != '' ? null : msg,
        }
    ),

    MinLength: (
        limit: number,
        msg = (limit: number) => `不能少于${limit}个字符`,
    ) => (entity: any, propertyName: string) => reg(
        entity,
        propertyName,
        {
            name: 'MinLength',
            value: limit,
            nullable: true,
            validate: v => typeof v != 'string' || v.length >= limit ? null : msg(limit),
        }
    ),

    MaxLength: (
        limit: number,
        msg = (limit: number) => `不能超过${limit}个字符`,
    ) => (entity: any, propertyName: string) => reg(
        entity,
        propertyName,
        {
            name: 'MaxLength',
            value: limit,
            nullable: true,
            validate: v => typeof v != 'string' || v.length <= limit ? null : msg(limit),
        }
    ),

    RexExp: (
        regex: RegExp,
        msg = '格式不合法',
    ) => (entity: any, propertyName: string) => reg(
        entity,
        propertyName,
        {
            name: 'RexExp',
            value: regex,
            nullable: true,
            validate: v => regex.test(`${v}`) ? null : msg,
        }
    ),

    LessThan: (
        threshold: number,
        msg = (threshold: number) => `必须小于${threshold}`,
    ) => (entity: any, propertyName: string) => reg(
        entity,
        propertyName,
        {
            name: 'LessThan',
            value: threshold,
            nullable: true,
            validate: v => parseFloat(v as any) < threshold ? null : msg(threshold),
        }
    ),

    GreaterThan: (
        threshold: number,
        msg = (threshold: number) => `必须大于${threshold}`,
    ) => (entity: any, propertyName: string) => reg(
        entity,
        propertyName,
        {
            name: 'GreaterThan',
            value: threshold,
            nullable: true,
            validate: v => parseFloat(v as any) > threshold ? null : msg(threshold),
        }
    ),

    NoLessThan: (
        threshold: number,
        msg = (threshold: number) => `不能小于${threshold}`,
    ) => (entity: any, propertyName: string) => reg(
        entity,
        propertyName,
        {
            name: 'NoLessThan',
            value: threshold,
            nullable: true,
            validate: v => parseFloat(v as any) >= threshold ? null : msg(threshold),
        }
    ),

    NoGreaterThan: (
        threshold: number,
        msg = (threshold: number) => `不能大于${threshold}`,
    ) => (entity: any, propertyName: string) => reg(
        entity,
        propertyName,
        {
            name: 'NoGreaterThan',
            value: threshold,
            nullable: true,
            validate: v => parseFloat(v as any) >= threshold ? null : msg(threshold),
        }
    ),

    ChooseOne: (
        options: any[],
        msg = (options: any[]) => `值只能是 ${options.join(', ')} 中的一个`,
    ) => (entity: any, propertyName: string) => reg(
        entity,
        propertyName,
        {
            name: 'ChooseOne',
            value: options,
            nullable: true,
            validate: v => options.indexOf(v) >= 0 ? null : msg(options),
        }
    ),

    Custom: (
        name: string,
        value: any,
        nullable: boolean,
        validate: (v: unknown) => string | undefined
    ) => (entity: any, propertyName: string) => reg(
        entity,
        propertyName,
        {
            name,
            value,
            nullable,
            validate,
        }
    ),

    validate(entity: any, fields?: string[]) {
        let ret: {
            invalid: boolean,
            errors: { [ key: string ]: string[] },
        } = {
            invalid: false,
            errors: {},
        };

        let map = Reflect.getMetadata(
            EntityValidators,
            entity.constructor,
        ) as Map<any, Validatable[]> | undefined;

        if (!map) return ret;

        for (let k of fields || map.keys()) {
            for (let validatable of map.get(k) || []) {
                let v = entity[k];
                if (v == null && validatable.nullable) continue;
                let err = validatable.validate(v);
                if (err) {
                    ret.errors[k] = (ret.errors[k] || []).concat(err);
                    ret.invalid = true;
                }
            }
        }

        return ret
    },

    getValidators(entityOrClass: Function | Object) {
        return Reflect.getMetadata(
            EntityValidators,
            typeof entityOrClass == 'function' ? entityOrClass : entityOrClass.constructor,
        ) as Map<any, Validatable[]> | undefined;
    },
}
