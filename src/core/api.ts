import { Service } from "typedi";
import { Roles } from "./auth";
import { Runnable } from "../lib/runnable";
import { ArgumentError } from "./error";
import { URL } from "url";

export type ApiType = new (...args: any[]) => Runnable;

export type ApiOptions = {
    doc: string,
    name: string,
    roles: Roles,
    userContextProperty?: string,
}

export type ApiArgValidatableOptions = {
    inputype: string,
    parser: (v: unknown, api?: InstanceType<ApiType>) => any,
    validator: (v: unknown, api?: InstanceType<ApiType>) => boolean,
}

export type ApiArgOptions = {
    doc: string,
    optional: boolean,
} & ApiArgValidatableOptions;

export function Api(
    {
        doc, name, roles
    }: {
        doc: string,
        name?: string,
        roles?: Roles,
    },
) {
    return function (Api: ApiType) {
        ApiService.apis.set(Api, {
            doc,
            name: name || Api.name.replace(/Api$/i, ''),
            roles: roles || Roles.Anonymous,
        });
    }
}

export function ApiArg(optionsOrDoc: Partial<ApiArgOptions> | string, optional = false) {
    let options: Partial<ApiArgOptions>;
    if (typeof optionsOrDoc == 'string') {
        options = {
            doc: optionsOrDoc,
            optional,
        }
    } else {
        options = optionsOrDoc;
    }

    return function (proto: InstanceType<ApiType>, propertyName: string) {
        const { getOrInitArgMapFor, validatables } = ApiService;
        const Type = Reflect.getMetadata('design:type', proto, propertyName);

        if (!options.parser && !options.validator) {
            const validatable = validatables.get(Type);
            if (
                validatable === undefined
            ) throw new Error(`${Type.name} is not validatable`);

            Object.assign(options, validatable);
        }

        getOrInitArgMapFor(proto).set(propertyName, Object.assign({
            doc: '',
            optional: false,
            inputype: `${Type.name}`.toLowerCase(),
            validator: _ => true,
            parser: v => v,
        }, options));
    }
}

export function ApiArgInteger(options: {
    doc: string,
    optional?: boolean,
    range?: [ number, number ],
}) {

    let parser = v => {
        let n: number;
        switch (typeof v) {
            case 'string':
            case 'number': n = parseInt(`${v}`); break;
            default: throw new Error(`not a number`);
        }
        return n
    }

    let { doc, optional, range } = options;
    if (range) {
        let [ l, u ] = range;
        doc += ` [ ${l}, ${u} ]`;
        return ApiArg({
            doc,
            optional,
            parser: v => {
                let n = parser(v)
                if (n < l) throw new Error(`lower bound ${l}`);
                if (n > u) throw new Error(`upper bound ${u}`);
                return n
            }
        })
    } else {
        return ApiArg({
            doc,
            optional,
            parser,
        })
    }
}

export function ApiArgEnum<T>(options: {
    doc: string,
    optional?: boolean,
    defaultValue?: T,
    inputype?: string,
    enum: any,
}) {
    let set = new Set<any>();
    let { doc, optional, defaultValue, inputype } = options;
    let defaultName: string | undefined;

    for (let member in options.enum) {
        let value = options.enum[member];
        if (value === defaultValue) defaultName = member;
        doc += `, ${value}:${member}`;
        set.add(value);
        inputype = inputype || typeof value;
    }

    if (defaultName) doc += `, 默认 ${defaultName}`;

    return ApiArg({
        doc,
        optional: optional || defaultValue !== undefined,
        inputype,
        parser: v => v === undefined ? defaultValue : v,
        validator: v => set.has(v as any),
    })
}

export function ApiArgArrayOf(Type: any, options: {
    doc: string,
    optional?: boolean,
}) {
    return function (proto: InstanceType<ApiType>, propertyName: string) {
        const { getOrInitArgMapFor, validatables } = ApiService;

        const validatable = validatables.get(Type);
        if (
            validatable === undefined
        ) throw new Error(`${Type.name} is not validatable`);

        let parser: (v: unknown, api?: InstanceType<ApiType>) => any;
        if (validatable.parser) {
            parser = (v: unknown, api?: InstanceType<ApiType>) => {
                if (!(v instanceof Array)) throw new ArgumentError(`not an array`);
                let parsed: any[] = [];
                for (let item of v) parsed.push(validatable.parser!(item, api));
                return parsed;
            }
        } else {
            parser = v => v;
        }

        let validator: (v: unknown, api?: InstanceType<ApiType>) => boolean;
        if (validatable.validator) {
            validator = (v: unknown, api?: InstanceType<ApiType>) => {
                if (!(v instanceof Array)) return false;
                for (let item of v) {
                    if (! validatable.validator!(item, api)) return false;
                }
                return true;
            }
        } else {
            validator = _ => true;
        }

        getOrInitArgMapFor(proto).set(propertyName, {
            doc: options.doc,
            optional: options.optional || false,
            inputype: validatable.inputype + '[]',
            validator: _ => true,
            parser,
        });
    }
}

export function ApiUserContextArg() {
    return function (proto: InstanceType<ApiType>, propertyName: string) {
        setTimeout(
            () =>
                ApiService.apis.get(
                    proto.constructor as ApiType
                )!.userContextProperty = propertyName
            ,
            0
        )
    }
}

@Service()
export class ApiService {

    get(Api: ApiType) {
        let options = ApiService.apis.get(Api);
        if (options === undefined) throw new Error(
            `${Api.name} not found`
        );

        return {
            options,
            args: ApiService.args.get(Api),
        }
    }

    async validate(
        Api: ApiType,
        api: InstanceType<ApiType>,
        propertyName: string,
        value: unknown,
    ) {
        const { args } = ApiService;

        let map = args.get(Api);
        if (map === undefined) throw new Error(
            `no args registered for "${Api.name}", ` +
            `does it have any @ApiArg() decoration?`
        );

        const options = map.get(propertyName);
        if (options === undefined) throw new Error(
            `arg options not found for "${Api.name}.${propertyName}", ` +
            `is it missing the @ApiArg() decoration?`
        );

        await this.validateByOptions(api, propertyName, value, options);
    }

    validateAll(Api: ApiType, api: InstanceType<ApiType>, values: Object) {
        const { args } = ApiService;

        let map = args.get(Api);
        if (map === undefined) return {}

        let ret: any = {};

        for (let [ name, options ] of map) {
            let [ found, value ] = this.validateByOptions(
                api,
                name,
                values[name],
                options,
            );
            if (found) ret[name] = value;
        }

        return ret;
    }

    private validateByOptions(
        api: InstanceType<ApiType>,
        propertyName: string,
        value: unknown,
        options: ApiArgOptions,
    ) {
        if (value == null) {
            if (options.optional) return [ false, null ];
            throw new ArgumentError(`"${propertyName}" is required`);
        }

        let parsed: any;
        try {
            parsed = options.parser.apply(api, value);
        } catch (e) {
            throw new ArgumentError(
                `invalid value of "${propertyName}": ${e.message}`
            );
        }

        if (! options.validator.apply(api, parsed)) throw new ArgumentError(
            `invalid value of "${propertyName}"`
        );

        return [ true, parsed ];
    }

    static apis = new Map<ApiType, ApiOptions>();
    static args = new Map<ApiType, Map<string, ApiArgOptions>>();

    static getOrInitArgMapFor(proto: InstanceType<ApiType>) {
        const { args } = ApiService;
        const ApiType = proto.constructor as ApiType;
        let map = args.get(ApiType);
        if (map === undefined) {
            map = new Map<string, ApiArgOptions>();
            args.set(ApiType, map);
        }
        return map;
    }

    static validatables = new Map<any, Partial<ApiArgValidatableOptions>>();
}

export function ApiArgValidatable(options: Partial<ApiArgValidatableOptions>) {
    return function (Type: any) {
        ApiService.validatables.set(
            Type,
            options,
        )
    }
}

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

        if (v instanceof Date) return new Date(v);

        throw new Error(`invalid date`);
    },
    validator: (d: Date) => d.toString() != 'Invalid Date',
})(Date);

ApiArgValidatable({
    parser: v => {
        if (typeof v == 'string') return new URL(v);
        else throw new ArgumentError(`invalid url`);
    },
})(URL);
