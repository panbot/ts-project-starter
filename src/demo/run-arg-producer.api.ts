import { Api } from "../framework";
import { RunArg, RunArgFactory, Runnable } from "../lib/runnable";

export class MyRunArg {

}

export type MyRunArgProducerOptions = {
    option1: string,
}

export class MyRunArgProducer implements RunArgFactory<MyRunArg, MyRunArgProducerOptions> {

    private runArgs = new WeakMap<any, MyRunArg>();

    async produceRunArgFor(r: Runnable<any>, options?: MyRunArgProducerOptions): Promise<MyRunArg> {
        console.log('MyRunArg produced');
        let v = new MyRunArg();
        this.runArgs.set(r, v);
        return v;
    }
    async releaseRunArgFor(r: Runnable<any>): Promise<void> {
        this.runArgs.delete(r);
        console.log('MyRunArg released');
    }

}

@Api({
    doc: `RunArg Demo`,
})
export class RunArgDemo implements Runnable {
    async run(
        @RunArg(MyRunArgProducer, { option1: 'option1 value' }) arg1: MyRunArg,
    ) {
        return {
            arg1,
        }
    }
}
