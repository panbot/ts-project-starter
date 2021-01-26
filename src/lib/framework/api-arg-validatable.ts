import { URL } from "url";
import { Constructor } from "../types";
import { createRegistryDecorator } from "./decorator";
import { ArgumentError } from "./error";
import { ApiArgParser, ApiArgValidatableOptions, ApiArgValidator } from "./types";

export default function () {

    const ApiArgValidatable = createRegistryDecorator<
        Constructor<any>,
        ApiArgValidatableOptions,
        { inputype: string, parser?: ApiArgParser, validator?: ApiArgValidator }>
    (
        (type: Function) => ({
            inputype: type.name,
            parser: v => v,
            validator: () => undefined,
        })
    );

    ApiArgValidatable({
        inputype: 'string',
        validator: v => typeof v == "string" ? undefined : 'not a string',
    })(String);

    ApiArgValidatable({
        inputype: 'number',
        validator: v => typeof v == "number" ? undefined : 'not a number',
    })(Number);

    ApiArgValidatable({
        inputype: 'boolean',
        validator: v => typeof v == "boolean" ? undefined : 'not a boolean value',
    })(Boolean);

    ApiArgValidatable({
        inputype: 'date',
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

    return ApiArgValidatable
}
