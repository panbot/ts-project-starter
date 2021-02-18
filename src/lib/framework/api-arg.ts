import ApiArgValidatableFactory from "./api-arg-validatable";
import { ApiArgOptions, ApiArgValidator, ApiConstructor } from "./types";
import { Runnable as RunnableApi } from '../runnable';
import ApiFactory from "./api";
import { Constructor } from "../types";

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

            const validatable = ApiArgValidatable.get(Type);
            if (validatable) {
                validator = daisychain(validatable.validator, validator);
                parser = parser || validatable.parser;
                inputype = inputype || validatable.inputype;
            }

            if (!parser && !validator) throw new Error(`${Type.name} is not validatable`);

            Api.access(proto.constructor as ApiConstructor, ({ args }) => args.set(propertyName, {
                doc: doc || '',
                necessity: necessity || 'required',
                inputype: inputype || Type.name,
                Type,
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
            UserContext: () => ApiArg({
                necessity: "overridden",
                parser: (_, ctx) => ctx.userContext,
            }),

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

            Object: (options: {
                doc: string,
                necessity?: ApiArgOptions['necessity'],
                deserializer?: (v: string, Type: Constructor<any>) => any,
            }) => ApiArg({
                doc: options.doc,
                necessity: options.necessity,
                inputype: options.deserializer ? 'string' : 'json',
                parser: (v, ctx) => {
                    if (typeof v != 'string') throw new Error(`not a string`);

                    const deserializer = options.deserializer || (
                        v => Object.assign(new ctx.Type(), JSON.parse(v)) );
                    return deserializer(v, ctx.Type);
                },
            }),
        }
    )
}
