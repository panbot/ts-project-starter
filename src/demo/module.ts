import { Module } from "../framework";
import {
    DemoApiArgAdvancedTypes,
    DemoApiArgBasicTypes,
    DemoApiArgBop,
    DemoApiArgParserValidator,
    DemoApiArgParserValidatorThisType,
    DemoApiArgValidatable } from "./api-arg.api";
import { DemoMemoize } from "./memoize.api";
import { DemoRunArg, DemoRunArgNonTransaction } from "./run-arg-producer.api";
import { WhoAmI } from "./who-am-i.api";

@Module({
    doc: 'demonstrate module dependencies',
    dependencies: () => [
        DemoModule,
    ],
})
export class SubDemoModule {
    async init() {
        console.log(`init ${this.constructor.name}`)
    }
}

@Module({
    doc: 'demo module',
    apis: [
        WhoAmI,
        DemoRunArg,
        DemoRunArgNonTransaction,
        DemoMemoize,
        DemoApiArgBasicTypes,
        DemoApiArgAdvancedTypes,
        DemoApiArgParserValidator,
        DemoApiArgParserValidatorThisType,
        DemoApiArgValidatable,
        DemoApiArgBop,
    ],
    controllers: [

    ],
    dependencies: () => [

    ],
})
export class DemoModule {
    async init() {
        console.log(`init ${this.constructor.name}`)
    }
}
