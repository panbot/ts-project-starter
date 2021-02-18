import { URL } from "url";
import { Constructor } from "../types";
import { ArgumentError } from "./error";
import { ApiArgParser, ApiArgValidator } from "./types";

export default function () {

    type Options = {
        inputype?: string,
        parser: ApiArgParser,
        validator: ApiArgValidator,
    } | {
        inputype?: string,
        parser: ApiArgParser,
        validator?: ApiArgValidator,
    } | {
        inputype?: string,
        parser?: ApiArgParser,
        validator: ApiArgValidator,
    };

    const ApiArgValidatable = (
        options: Options,
    ) => (ctor: Function & { prototype: any }) => {
        Reflect.defineMetadata(ApiArgValidatable, {
            inputype: options.inputype || ctor.name.toLowerCase(),
            parser: options.parser,
            validator: options.validator,
        }, ctor)
    }

    function get(ctor: Constructor<any>): Options | undefined {
        return Reflect.getMetadata(ApiArgValidatable, ctor);
    }

    ApiArgValidatable({
        validator: v => typeof v == "string" ? undefined : 'not a string',
    })(String);

    ApiArgValidatable({
        validator: v => typeof v == "number" ? undefined : 'not a number',
    })(Number);

    ApiArgValidatable({
        validator: v => typeof v == "boolean" ? undefined : 'not a bool',
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
        validator: (d: Date) => d.toString() != 'Invalid Date' ? undefined : 'invalid date',
    })(Date);

    ApiArgValidatable({
        inputype: 'string',
        parser: v => {
            if (typeof v == 'string') return new URL(v);
            else throw new ArgumentError(`not a string`);
        },
    })(URL);

    return Object.assign(ApiArgValidatable, {
        get,
    });
}
