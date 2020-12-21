import { ApiArgValidatable } from "./api-arg-validatable";
import { ApiArgOptions, ApiConstructor } from "./types";
import { Runnable as RunnableApi } from '../lib/runnable';
import { Api } from "./api";
import { ArgumentError } from "./error";

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

    return function (proto: RunnableApi, propertyName: string) {
        const Type = Reflect.getMetadata('design:type', proto, propertyName);

        if (!options.parser && !options.validator) {
            const validatable = ApiArgValidatable.get(Type);
            if (!validatable) throw new Error(`${Type.name} is not validatable`);

            Object.assign(options, validatable);
        }

        let defaultOptions: ApiArgOptions = {
            doc: '',
            optional: false,
            inputype: `${Type.name}`.toLowerCase(),
            validator: () => undefined,
            parser: v => v,
        };
        Api.goc(proto.constructor as ApiConstructor)
            .args.set(propertyName, Object.assign(defaultOptions, options))
        ;
    }
}

export function ApiArgUserContext() {
    return function (proto: RunnableApi, propertyName: string) {
        Api.set(proto.constructor as ApiConstructor, {
            userContextProperty: propertyName,
        });
    }
}

export function ApiArgInteger(options: {
    doc: string,
    optional?: boolean,
    range?: [ number, number ],
}) {
    let { doc, optional, range } = options;
    if (range) {
        let [ l, u ] = range;
        doc += ` [ ${l}, ${u} ]`;
        return ApiArg({
            doc,
            optional,
            parser: v => parseInt(v as any),
            validator: v => {
                if (isNaN(v as number)) return 'not a number';
                if (v as number < l) return `lower bound ${l}`;
                if (v as number > u) return `upper bound ${u}`;
            },
        })
    } else {
        return ApiArg({
            doc,
            optional,
            parser: v => parseInt(v as any),
            validator: v => {
                if (isNaN(v as number)) return 'not a number';
            },
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
        validator: v => set.has(v as any) ? undefined : `not in ` + Object.keys(options.enum),
    })
}

export function ApiArgArrayOf(Type: any, options: {
    doc: string,
    optional?: boolean,
}) {
    return function (proto: RunnableApi, propertyName: string) {
        const validatable = ApiArgValidatable.get(Type);
        if (validatable === undefined) throw new Error(`${Type.name} is not validatable`);

        let parser = (list: unknown, api: RunnableApi) => {
            if (!(list instanceof Array)) throw new ArgumentError(`not an array`);
            return list.map(item => validatable.parser(item, api));
        }

        let validator = (v: unknown, api: RunnableApi) => {
            let list = v as any[];
            for (let item of list) {
                let result = validatable.validator!(item, api);
                if (result) return result;
            }
        }

        Api.goc(proto.constructor as ApiConstructor).args.set(propertyName, Object.assign({
            doc: '',
            optional: false,
            inputype: validatable.inputype + '[]',
            parser,
            validator,
        }, options));
    }
}
