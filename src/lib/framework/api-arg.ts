import ApiArgValidatableFactory from "./api-arg-validatable";
import { ApiArgOptions, ApiArgValidator, ApiConstructor } from "./types";
import { Runnable as RunnableApi } from '../runnable';
import ApiFactory from "./api";

export type ApiArgDecorator = (proto: RunnableApi, propertyName: string) => void;

export default function (
    Api: ReturnType<typeof ApiFactory>,
    ApiArgValidatable: ReturnType<typeof ApiArgValidatableFactory>,
) {

    function ApiArg(options: Partial<ApiArgOptions>): ApiArgDecorator;
    function ApiArg(doc: string, necessity?: ApiArgOptions['necessity']): ApiArgDecorator;
    function ApiArg(doc: string, optional?: boolean): ApiArgDecorator;
    function ApiArg(...args: any[]) {
        let options: Partial<ApiArgOptions>;
        if (typeof args[0] == 'string') {
            let doc: string = args[0];
            let necessity: ApiArgOptions['necessity'] | undefined;
            if (args[1] == null) {
                necessity = 'required';
            } else if (typeof args[1] == 'string') {
                necessity = args[1] as ApiArgOptions['necessity'];
            } else if (args[1]) {
                necessity = 'optional';
            }
            options = {
                doc,
                necessity,
            }
        } else {
            options = args[0];
        }

        return function (proto: RunnableApi, propertyName: string) {
            const Type = Reflect.getMetadata('design:type', proto, propertyName);

            let { doc, necessity, validator, parser, inputype } = options;

            if (ApiArgValidatable.has(Type)) {
                const validatable = ApiArgValidatable.get(Type);
                validator = daisychain(validatable.validator, validator);
                parser = parser || validatable.parser;
                inputype = inputype || validatable.inputype;
            }

            if (!parser && !validator) throw new Error(`${Type.name} is not validatable`);

            Api.access(proto.constructor as ApiConstructor, ({ args }) =>
                args.set(propertyName, {
                    doc: doc || '',
                    necessity: necessity || 'required',
                    inputype: inputype || Type.name,
                    validator: validator || (() => undefined),
                    parser: parser || (v => v),
                }));
        }

        function daisychain(...validators: (ApiArgValidator | undefined)[]) {
            return (...args: Parameters<ApiArgValidator>) => {
                for (let validator of validators) {
                    if (!validator) continue;

                    let result = validator(...args);
                    if (typeof result == 'string') return result;
                }
            }
        }
    }

    return Object.assign(
        ApiArg,
        {
            UserContext: () => (proto: RunnableApi, propertyName: string) => {
                let type = Reflect.getMetadata('design:type', proto, propertyName);
                ApiArg({
                    necessity: "overridden",
                    parser: (...args) => args[1].userContext,
                    validator: v => v instanceof type ? undefined :
                        `invalid userContext type: ` +
                        `"${type.name}" required, ` +
                        `"${(v as any)?.constructor?.name}" provided.`,
                })(proto, propertyName);
            },

            Integer: (options: {
                doc: string,
                necessity?: ApiArgOptions['necessity'],
                range?: [ number, number ],
            }) => ApiArg({
                doc: options.doc + (options.range ? ` [ ${options.range[0]}, ${options.range[1]} ]` : ''),
                necessity: options.necessity,
                parser: v => parseInt(v as any),
                validator: options.range ?
                    v => {
                        if (isNaN(v as number)) return 'not a number';
                        if (v as number < options.range![0]) return `lower bound ${options.range![0]}`;
                        if (v as number > options.range![1]) return `upper bound ${options.range![1]}`;
                    } :
                    v => isNaN(v as number) ? 'not a number' : null,
            }),

            Object: (doc: string, optional: boolean = false) => ApiArg({
                doc,
                necessity: optional ? 'optional' : 'required',
                inputype: 'json',
                parser: v => typeof v == 'string' ? JSON.parse(v) : v,
                validator: v => v != null && typeof v == 'object' ? undefined : 'not an object',
            }),

            Enum: <T>(options: {
                doc: string,
                necessity?: ApiArgOptions['necessity'],
                defaultValue?: T,
                inputype?: string,
                enum: any,
            }) => {
                let set = new Set<any>();
                let { doc, necessity, defaultValue, inputype } = options;
                let defaultName: string | undefined;

                for (let key of Object.keys(options.enum)) {
                    let value = options.enum[key];
                    if (value === defaultValue) defaultName = key;
                    doc += `, ${value}:${key}`;
                    set.add(value);
                    inputype = inputype || typeof value;
                }

                if (defaultName) doc += `, 默认 ${defaultName}`;

                return ApiArg({
                    doc,
                    necessity,
                    inputype,
                    validator: v => set.has(v as any) ?
                        undefined
                        :
                        `not one of [ ${Object.keys(options.enum).join(', ')} ]`
                    ,
                })
            },

        }
    )
}

// export function ApiArgArrayOf(Type: any, options: {
//     doc: string,
//     necessity: ApiArgOptions['necessity'],
// }) {
//     return function (proto: RunnableApi, propertyName: string) {
//         const validatable = ApiArgValidatable.get(Type);
//         if (validatable === undefined) throw new Error(`${Type.name} is not validatable`);

//         let parser = (list: unknown, api: RunnableApi) => {
//             if (!(list instanceof Array)) throw new ArgumentError(`not an array`);
//             return list.map(item => validatable.parser(item, api));
//         }

//         let validator = (v: unknown, api: RunnableApi) => {
//             let list = v as any[];
//             for (let item of list) {
//                 let result = validatable.validator!(item, api);
//                 if (result) return result;
//             }
//         }

//         Api.goc(proto.constructor as ApiConstructor).args.set(propertyName, Object.assign({
//             doc: '',
//             optional: false,
//             inputype: validatable.inputype + '[]',
//             parser,
//             validator,
//         }, options));
//     }
// }
