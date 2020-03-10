import { Module } from "../core/module";
import { Service, Inject } from "typedi";
import { Runnable, RunArg, RunArgFactory } from "../lib/runnable";
import { Api, ApiArg } from "../core/api";
import { MongoService } from "../core/mongo";
import { DemoEntity } from './mongo-entities/demo-entity';

type DemoArg = number;

@Service()
class DemoService implements RunArgFactory<DemoArg> {

    demoMethod() {
        console.log('inside demo method');
        return 'ret of demo method';
    }

    private runArgs = new WeakMap<any, DemoArg>();

    async produceRunArgFor(target: any) {
        let arg: DemoArg = Math.random();
        this.runArgs.set(target, arg);
        console.log(`produced ${this.runArgs.get(target)}`);
        return Promise.resolve(arg);
    }

    async releaseRunArgFor(target: any) {
        console.log(`released ${this.runArgs.get(target)}`);
        this.runArgs.delete(target);
    }
}

type AnotherDemoArg = string;

class AnotherDemoService implements RunArgFactory<AnotherDemoArg> {
    private runArgs = new WeakMap<any, AnotherDemoArg>();

    async produceRunArgFor(target: any, factoryArg: string) {
        let arg: AnotherDemoArg = 'produced from ' + factoryArg;
        this.runArgs.set(target, arg);
        console.log(`produced ${this.runArgs.get(target)}`);
        return Promise.resolve(arg);
    }

    async releaseRunArgFor(target: any) {
        console.log(`released ${this.runArgs.get(target)}`);
        this.runArgs.delete(target);
    }
}

@Api({
    doc: `demo api`,
})
@Service()
class DemoApi implements Runnable {

    @Inject(_ => DemoService)
    private service: DemoService;

    @ApiArg('demo arg')
    apiArg1: string;

    async run(
        @RunArg(DemoService)
        runArg1: DemoArg,

        @RunArg(AnotherDemoService, 'another demo service') runArg2: AnotherDemoArg,
    ) {
        console.log(`inside demo api run`);
        console.log('runArg1:', runArg1);
        console.log('runArg2:', runArg2);
        console.log('apiArg1:', this.apiArg1);
        console.log('ret of DemoService.demoMethod: ', this.service.demoMethod());
    }
}

@Module({
    doc: `demo module`,
    apis: [
        DemoApi,
    ],
})
export class DemoModule {

    async init() {
        // await MysqlService.createConnection(Object.assign({
        //     entities: [
        //         Account,
        //         Event,
        //         Inventory,
        //         MerchandiseInventory,
        //         Transaction,
        //     ],
        // }, this.connectionOptions));

        MongoService.registerEntities([
            DemoEntity,
        ]);
    }
}
