import { createCipheriv, createDecipheriv, createHash } from "crypto";
import { URL } from "url";
import { UserContext } from "../app";
import { Api, ApiArg, ApiArgValidatable, Container, Tokens } from "../framework";
import { Runnable } from "../lib/runnable";

@Api({
    doc: `Demoing ApiArg() on basic types`,
})
export class DemoApiArgBasicTypes implements Runnable {

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
    doc: `Demoing ApiArg() on advanced types`,
})
export class DemoApiArgAdvancedTypes implements Runnable {

    @ApiArg.Integer({
        doc: `an integer`,
        range: [ 0, 100 ],
    })
    anInteger: number;

    @ApiArg.Object({
        doc: `an object in JSON`,
    })
    aJsonObject: Object;

    async run() {
        return {
            anInteger: dump(this.anInteger),
            anObject: dump(this.aJsonObject),
        }
    }
}

type MyType = {}

@Api({
    doc: `Demoing the parser and the validator in ApiArgOptions`,
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

@Api({
    doc: `Demoing "this" in the parser and the validator in ApiArgOptions`,
})
export class DemoApiArgParserValidatorThisType implements Runnable {

    @ApiArg({
        doc: `a number`
    })
    numberA: number;

    @ApiArg({
        doc: `a number`
    })
    numberB: number;

    @ApiArg<DemoApiArgParserValidatorThisType>({
        doc: `the validity is determined by the relationship between "numberA", "numberB" and the input value`,
        validator(v: boolean) {
            if (this.numberA > this.numberB) {
                if (!v) return 'numberA is indeed greater than numberB';
            } else {
                if (v) return 'numberA is not greater than numberB';
            }
        }
    })
    aIsGreater: boolean;

    async run() {
        return {
        }
    }
}

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

// notice that the @ApiArgValidatable() decorator is only required on the base class
@ApiArgValidatable({
    inputype: 'string',
    parser: (v, ctx) => Bop.deserialize(
        v,
        ctx.Type,
        (ctx.userContext as UserContext).uid || ''),
})
abstract class Bop {

    static key = createHash('sha256').update(Container.get(Tokens.Parameters).secret).digest();

    serialize(salt: string = '') {
        return Bop.serialize(this, salt);
    }

    static serialize(bop: Bop, salt: string = '') {
        let cipher = createCipheriv(
            'aes-256-cbc',
            this.key,
            salt.padStart(16, '0'),
        );
        let encrypted = cipher.update(JSON.stringify(bop), 'utf-8', 'hex')
        encrypted += cipher.final('hex');
        return encrypted
    }

    static deserialize(v: unknown, Type: any, salt: string = '') {
        if (typeof v != 'string') throw new Error('string expected');

        let decipher = createDecipheriv(
            'aes-256-cbc',
            this.key,
            salt.padStart(16, '0'),
        );

        let decrypted = decipher.update(v, 'hex', 'utf-8');
        decrypted += decipher.final('utf-8');

        return Object.assign(new Type(), JSON.parse(decrypted));
    }

}

class MyBop extends Bop {
}

@Api({
    doc: `Demoing bag-o-parameters. ` +
        `This is useful for two or more Apis that follow the command pattern, ` +
        `where one Api produces a series of options for other Apis to execute.`,
})
export class DemoApiArgBop implements Runnable {

    @ApiArg({
        doc: 'a bag-o-parameters that serializes into different strings for different users',
        necessity: 'optional',
    })
    bop: MyBop;

    @ApiArg.Object({
        doc: `properties for bop`,
        necessity: 'optional',
    })
    values: any;

    @ApiArg.UserContext()
    uc: UserContext;

    async run() {
        let anotherBop = new MyBop();
        Object.assign(anotherBop, this.values);

        return {
            bop: dump(this.bop),
            anotherBop: dump(anotherBop),
            anotherBopSerialized: anotherBop.serialize(this.uc.uid),
        }
    }
}
