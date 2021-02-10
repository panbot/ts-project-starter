import { URL } from "url";
import { Api, ApiArg, ApiArgValidatable } from "../framework";
import { Runnable } from "../lib/runnable";

@Api({
    doc: `Demoing ApiArg() of basic types`,
})
export class DemoApiArgOfBasicTypes implements Runnable {

    @ApiArg(`a string argument`)
    aString: string;

    @ApiArg(`a number argument`)
    aNumber: number;

    @ApiArg(`a date argument`)
    aDate: Date;

    @ApiArg(`a boolean argument`)
    aBoolean: boolean;

    @ApiArg(`a url argument`)
    aURL: URL;

    @ApiArg(`a optional string`, true)
    anOptionalString: string;

    async run() {
        return {
            aString: dump(this.aString),
            aNumber: dump(this.aNumber),
            aDate: dump(this.aDate),
            aBoolean: dump(this.aBoolean),
            aURL: dump(this.aURL),
            anOptionalString: dump(this.anOptionalString),
        }
    }
}

@Api({
    doc: `Demoing ApiArg()'s parser and validator`,
})
export class DemoApiArgParserValidator implements Runnable {

    @ApiArg({
        doc: `a md5 in hex enconding, e.g. 0cc175b9c0f1b6a831c399e269772661`,
        validator: (v: string) => {
            if (v.length != 32) return `invalid length`;
            if (/[^0-9a-f]/.test(v)) return `containing invalid characters`;
        },
    })
    aMD5: string;

    @ApiArg({
        doc: `a MyType`,
        inputype: 'json',
        parser: (v: any) => Object.assign({}, JSON.parse(v)) as MyType,
    })
    aMyType: MyType;

    async run() {
        return {
            aString: dump(this.aMD5),
            aMyType: dump(this.aMyType),
        }
    }
}

type MyType = {}

@ApiArgValidatable({
    inputype: 'json',
    parser: (v: string) => new MyClass(JSON.parse(v)),
    validator: (v: MyClass) => Object.keys(v.options).length ? undefined : 'empty options',
})
class MyClass {
    constructor(public options: any) {

    }
}

@Api({
    doc: `Demoing ApiArgValidatable()`
})
export class DemoApiArgValidatable implements Runnable {

    @ApiArg('a MyClass')
    aMyClass: MyClass;

    async run() {
        return {
            aMyClass: dump(this.aMyClass),
        }
    }
}

function dump(value: any) {
    return {
        value,
        typeof: typeof value,
        constructor: value?.constructor?.name,
    }
}
