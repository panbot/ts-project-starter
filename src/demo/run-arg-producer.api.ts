import { Api, ApiArg } from "../framework";
import { ArgumentError } from "../lib/framework/error";
import { RunArg, RunArgFactory, Runnable } from "../lib/runnable";

export class MyRunArg {

    logs: string[] = [];

    constructor(public options?: MyRunArgProducerOptions) {
        this.log('MyRunArg produced')
    }

    destroy() {
        this.log('MyRunArg released');
    }

    beginTransaction() {
        this.log('begin transaction');
    }

    commitTransaction() {
        this.log('commit transaction');
    }

    rollbackTransaction() {
        this.log('rollback transaction');
    }

    private log(msg: string) {
        console.log(msg);
        this.logs.push(msg);
    }
}

export type MyRunArgProducerOptions = {
    transactional: boolean,
}

export class MyRunArgProducer implements RunArgFactory {

    private runArgs = new WeakMap<any, MyRunArg>();

    async produceRunArgFor(r: Runnable<any>, options?: MyRunArgProducerOptions): Promise<MyRunArg> {
        let v = new MyRunArg(options);
        this.runArgs.set(r, v);
        return v;
    }
    async releaseRunArgFor(r: Runnable<any>): Promise<void> {
        this.runArgs.get(r)?.destroy();
        this.runArgs.delete(r);
    }

    async aroundRun<V>(run: () => Promise<V>, r: Runnable) {
        let runArg = this.runArgs.get(r)!;
        if (runArg.options?.transactional) {
            runArg.beginTransaction();
            try {
                let result = await run();
                runArg.commitTransaction();
                return result;
            } catch (e) {
                runArg.rollbackTransaction();
                throw e;
            }
        } else {
            return run()
        }
    }

}

@Api({
    doc: `Demoing RunArgs, RunArg Producer Options and RunArg with transaction like features`,
})
export class DemoRunArg implements Runnable {

    @ApiArg('trigger an artifical error', true)
    error: boolean = false;

    async run(
        @RunArg(MyRunArgProducer, { transactional: true }) arg1: MyRunArg,
    ) {
        if (this.error) throw new ArgumentError('an artificial error', 400, { arg1 });
        return {
            arg1,
        }
    }
}

@Api({
    doc: `Counterpart to RunArgDemo with transaction disabled`,
})
export class DemoRunArgNonTransaction implements Runnable {

    @ApiArg('trigger an artifical error', true)
    error: boolean = false;

    async run(
        @RunArg(MyRunArgProducer, { transactional: false }) arg1: MyRunArg,
    ) {
        if (this.error) throw new ArgumentError('an artificial error', 400, { arg1 });
        return {
            arg1,
        }
    }
}
