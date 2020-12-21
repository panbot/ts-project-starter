import { URL } from "url";
import { createRegistryDecorator } from "./decorator";
import { ArgumentError } from "./error";
import { ApiValidatableArgOptions } from "./types";

export const ApiArgValidatable = createRegistryDecorator<Function, ApiValidatableArgOptions>(
    (type: Function) => ({
        inputype: type.name.toLowerCase(),
        parser: v => v,
        validator: () => undefined,
})
);

ApiArgValidatable({
    validator: v => typeof v == "string" ? undefined : 'not a string',
})(String);

ApiArgValidatable({
    validator: v => typeof v == "number" ? undefined : 'not a number',
})(Number);

ApiArgValidatable({
    validator: v => typeof v == "boolean" ? undefined : 'not a boolean value',
})(Boolean);

ApiArgValidatable({
    inputype: 'Date',
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
    parser: v => {
        if (typeof v == 'string') return new URL(v);
        else throw new ArgumentError(`invalid url`);
    },
})(URL);