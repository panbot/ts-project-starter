import { Roles } from "./security";
import { ApiArgOptions, ApiConstructor } from "./types";
import { createRegistryDecorator } from "./decorator";
import { Runnable as RunnableApi } from '../lib/runnable';
import { ArgumentError } from "./error";

export class ApiOptions {
    doc: string = '';
    // name: string;
    roles: Roles = Roles.Anonymous;
    userContextProperty?: string;
    args = new Map<string, ApiArgOptions>();

    validate(
        api: RunnableApi,
        propertyName: string,
        value: unknown,
    ) {
        const options = this.args.get(propertyName);
        if (!options) throw new Error(
            `arg options not found for "${api.constructor.name}.${propertyName}", ` +
            `is it missing the @ApiArg() decoration?`
        );

        this.validateByOptions(api, propertyName, value, options);
    }

    validateAll(
        api: RunnableApi,
        values: any,
    ) {
        let ret: any = {};

        for (let [ name, options ] of this.args) {
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
        api: RunnableApi,
        propertyName: string,
        value: unknown,
        options: ApiArgOptions,
    ) {
        if (value == null) {
            if (options.optional) return [ false, null ];
            throw new ArgumentError(`"${propertyName}" is required`);
        }

        try {
            let parsed = options.parser(value, api);

            let msg = options.validator(parsed, api);
            if (typeof msg == 'string') throw new Error(msg);

            return [ true, parsed ];
        } catch (e) {
            throw new ArgumentError(
                `invalid value of "${propertyName}": ${e.message}`,
                e.httpCode,
                e.extra,
            );
        }
    }
}

export const Api = createRegistryDecorator<ApiConstructor, ApiOptions>(
    () => new ApiOptions(),
);

export const Cli = (options: Partial<ApiOptions>) =>
    Api(Object.assign(options, { roles: (options.roles || Roles.Anonymous) | Roles.Cli }))
;

// import { Service } from "typedi";
// import { Roles, UserContext } from "./security";
// import { Runnable } from "../lib/runnable";
// import { ArgumentError } from "./error";
// import { URL } from "url";

// export type ApiType = new (...args: any[]) => Runnable;

// export type ApiOptions = {
//     doc: string,
//     name: string,
//     roles: Roles,
//     cochin?: string,
//     userContextProperty?: string,
// }

// export type ApiArgValidatableOptions = {
//     inputype: string,
//     parser: (v: unknown, api: InstanceType<ApiType>) => any,
//     validator: (v: unknown, api: InstanceType<ApiType>) => boolean,
// }

// export type ApiArgOptions = {
//     doc: string,
//     optional: boolean,
// } & ApiArgValidatableOptions;

// export function Api(options: Partial<ApiOptions>) {
//     return function (Api: ApiType) {
//         options.name = Api.name.replace(/Api$/i, '');
//         ApiService.setApiOptions(Api, options);
//     }
// }

// export function Cli(options: Partial<ApiOptions>) {
//     options.roles = options.roles || Roles.Cli;
//     return function (Api: ApiType) {
//         ApiService.setApiOptions(Api, options);
//     }
// }

// export function ApiArg(optionsOrDoc: Partial<ApiArgOptions> | string, optional = false) {
//     let options: Partial<ApiArgOptions>;
//     if (typeof optionsOrDoc == 'string') {
//         options = {
//             doc: optionsOrDoc,
//             optional,
//         }
//     } else {
//         options = optionsOrDoc;
//     }

//     return function (proto: InstanceType<ApiType>, propertyName: string) {
//         const Type = Reflect.getMetadata('design:type', proto, propertyName);

//         if (!options.parser && !options.validator) {
//             const validatable = ApiService.validatables.get(Type);
//             if (
//                 validatable === undefined
//             ) throw new Error(`${Type.name} is not validatable`);

//             Object.assign(options, validatable);
//         }

//         ApiService.getOrInitArgMapFor(proto).set(propertyName, Object.assign({
//             doc: '',
//             optional: false,
//             inputype: `${Type.name}`.toLowerCase(),
//             validator: _ => true,
//             parser: v => v,
//         }, options));
//     }
// }


// @Service()
// export class ApiService {

//     static get(Api: ApiType) {
//         let options = this.apis.get(Api);
//         if (options === undefined) throw new Error(
//             `api "${Api.name}" not found`
//         );

//         return {
//             options,
//             args: ApiService.args.get(Api),
//         }
//     }

//     static async validate(
//         Api: ApiType,
//         api: InstanceType<ApiType>,
//         propertyName: string,
//         value: unknown,
//     ) {
//         const { args } = this;

//         let map = args.get(Api);
//         if (map === undefined) throw new Error(
//             `no args registered for "${Api.name}", ` +
//             `does it have any @ApiArg() decoration?`
//         );

//         const options = map.get(propertyName);
//         if (options === undefined) throw new Error(
//             `arg options not found for "${Api.name}.${propertyName}", ` +
//             `is it missing the @ApiArg() decoration?`
//         );

//         await this.validateByOptions(api, propertyName, value, options);
//     }

//     static validateAll(Api: ApiType, api: InstanceType<ApiType>, values: Object) {
//         const { args } = this;

//         let map = args.get(Api);
//         if (map === undefined) return {}

//         let ret: any = {};

//         for (let [ name, options ] of map) {
//             let [ found, value ] = this.validateByOptions(
//                 api,
//                 name,
//                 values[name],
//                 options,
//             );
//             if (found) ret[name] = value;
//         }

//         return ret;
//     }

//     private static validateByOptions(
//         api: InstanceType<ApiType>,
//         propertyName: string,
//         value: unknown,
//         options: ApiArgOptions,
//     ) {
//         if (value == null) {
//             if (options.optional) return [ false, null ];
//             throw new ArgumentError(`"${propertyName}" is required`);
//         }

//         let parsed: any;
//         try {
//             parsed = options.parser(value, api);
//         } catch (e) {
//             throw new ArgumentError(
//                 `invalid value of "${propertyName}": ${e.message}`,
//                 e.httpCode,
//                 e.extra,
//             );
//         }

//         if (! options.validator(parsed, api)) throw new ArgumentError(
//             `invalid value of "${propertyName}"`
//         );

//         return [ true, parsed ];
//     }

//     static getUserContext(api: InstanceType<ApiType>) {
//         const { options } = this.get(api.constructor as any);

//         if (options.userContextProperty) {
//             let uc: unknown = api[options.userContextProperty];
//             if (uc instanceof UserContext) return uc;
//             else throw new Error(
//                 `${api.constructor.name}.${options.userContextProperty} is not an instance of UserContext`
//             );
//         } else {
//             throw new Error(`userContextProperty not defined for ${api.constructor.name}`)
//         }
//     }

//     static apis = new Map<ApiType, ApiOptions>();
//     static args = new Map<ApiType, Map<string, ApiArgOptions>>();

//     static setApiOptions(Api: ApiType, opt: Partial<ApiOptions>) {
//         this.apis.set(
//             Api,
//             Object.assign(
//                 this.apis.get(Api) || {
//                     doc: '',
//                     name: Api.name,
//                     roles: Roles.Anonymous,
//                 },
//                 opt,
//             ),
//         )
//     }

//     static getOrInitArgMapFor(proto: InstanceType<ApiType>) {
//         const ApiType = proto.constructor as ApiType;
//         let map = this.args.get(ApiType);
//         if (map === undefined) {
//             map = new Map<string, ApiArgOptions>();
//             this.args.set(ApiType, map);
//         }
//         return map;
//     }

//     static validatables = new Map<any, Partial<ApiArgValidatableOptions>>();
// }

// export function ApiArgValidatable(options: Partial<ApiArgValidatableOptions>) {
//     return function (Type: any) {
//         ApiService.validatables.set(
//             Type,
//             Object.assign({
//                 inputype: `${Type.name}`.toLowerCase(),
//             }, options),
//         )
//     }
// }

// ApiArgValidatable({
//     validator: v => typeof v == "string",
// })(String);

// ApiArgValidatable({
//     validator: v => typeof v == "number",
// })(Number);

// ApiArgValidatable({
//     validator: v => typeof v == "boolean",
// })(Boolean);

// ApiArgValidatable({
//     inputype: 'Date',
//     parser: v => {
//         switch (typeof v) {
//             case "number":
//             case "string": return new Date(v);
//         }

//         if (v instanceof Date) return new Date(v);

//         throw new Error(`invalid date`);
//     },
//     validator: (d: Date) => d.toString() != 'Invalid Date',
// })(Date);

// ApiArgValidatable({
//     parser: v => {
//         if (typeof v == 'string') return new URL(v);
//         else throw new ArgumentError(`invalid url`);
//     },
// })(URL);
