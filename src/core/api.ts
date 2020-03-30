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

export type ApiArgOptions = {
    doc: string,
    optional: boolean,
    parser: (v: unknown) => any,
    validator: (v: unknown) => boolean,
}

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

export function CmsApi(doc: string) {
    return Api({ doc, roles: Roles.CMS })
}

export function AuthenticatedApi(doc: string) {
    return Api({ doc, roles: Roles.Authenticated })
}

export function ApiArg(options: {
    doc: string,
    optional?: boolean,
    parser?: (v: unknown) => any,
    validator?: (v: unknown) => boolean,
} | string, optional = false) {

    let doc: string;
    let parser: ((v: unknown) => any) | undefined;
    let validator: ((v: unknown) => boolean) | undefined;

    if (typeof options == 'string') {
        doc = options;
    } else {
        doc = options.doc;
        optional = !!options.optional;
        parser = options.parser;
        validator = options.validator;
    }

    return function (proto: InstanceType<ApiType>, propertyName: string) {
        const { getOrInitArgMapFor, validatables } = ApiService;

        if (!parser && !validator) {
            const Type = Reflect.getMetadata('design:type', proto, propertyName);

            const validatable = validatables.get(Type);
            if (
                validatable === undefined
            ) throw new Error(`${Type.name} is not validatable`);

            parser = validatable.parser;
            validator = validatable.validator;
        }

        getOrInitArgMapFor(proto).set(propertyName, {
            doc,
            optional,
            parser: parser || ((v: any) => v),
            validator: validator || ((v: any) => true),
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

    validate(Api: ApiType, propertyName: string, value: unknown) {
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

        this.validateByOptions(propertyName, value, options);
    }

    validateAll(Api: ApiType, values: Object) {
        const { args } = ApiService;

        let map = args.get(Api);
        if (map === undefined) return {}

        let ret: any = {};

        for (let [ name, options ] of map) {
            let [ found, value ] = this.validateByOptions(name, values[name], options);
            if (found) ret[name] = value;
        }

        return ret;
    }

    private validateByOptions(
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
            parsed = options.parser(value);
        } catch (e) {
            throw new ArgumentError(
                `invalid value of "${propertyName}": ${e.message}`
            );
        }

        if (!options.validator(parsed)) throw new ArgumentError(
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

    static validatables = (() => {
        let map = new Map<any, {
            parser: (v: unknown) => any,
            validator: (v: unknown) => boolean,
        }>();

        map.set(String, {
            parser: v => v,
            validator: v => typeof v == "string",
        });
        map.set(Number, {
            parser: v => v,
            validator: v => typeof v == "number",
        });
        map.set(Boolean, {
            parser: v => v,
            validator: v => typeof v == "boolean",
        });
        map.set(Date, {
            parser: v => {
                switch (typeof v) {
                    case "number":
                    case "string": return new Date(v);
                }

                if (v instanceof Date) return new Date(v);

                throw new Error(`invalid date`);
            },
            validator: (d: Date) => d.toString() != 'Invalid Date',
        });
        map.set(URL, {
            parser: v => {
                if (typeof v == 'string') return new URL(v);
                else throw new ArgumentError(`invalid url`);
            },
            validator: _ => true,
        });

        return map;
    })();
}
