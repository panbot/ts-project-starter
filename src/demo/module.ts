import { Module } from "../framework";
import { RunArgDemo } from "./run-arg-producer.api";
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
        RunArgDemo,
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
