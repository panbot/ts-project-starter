import "reflect-metadata";
import { Constructor, Instantiator } from "./types";

const RunArgKeys: {
    [ key: string ]: Symbol,
} = {
    run: Symbol(),
}

export interface RunArgFactory<RunArg = any, ProducerOptions = never> {
    produceRunArgFor(r: Runnable, options?: ProducerOptions): Promise<RunArg>;
    releaseRunArgFor(r: Runnable): Promise<void>;
    aroundRun?<V>(run: () => Promise<V>, r: Runnable): Promise<V>;
}

type RunArgMetadata = {
    Factory: Constructor<RunArgFactory>,
    options: any,
};

export interface Runnable<RunResult = any> {
    run(...args: any[]): Promise<RunResult>;
}

export function RunArg<RunArg, ProducerOptions>(
    Factory: Constructor<RunArgFactory<RunArg, ProducerOptions>>,
    options?: ProducerOptions) {
    return (proto: Runnable, method: string, index: number) => {
        const key = RunArgKeys[method];
        if (!key) throw new Error(`${method} not supported`);

        if (!Reflect.hasMetadata(key, proto)) {
            Reflect.defineMetadata(key, [], proto);
        }

        let list = Reflect.getMetadata(key, proto) as any[];
        list[index] = { Factory, options } as RunArgMetadata;
    }
}

const wraps = {

    runnable: <T>(runnable: Runnable<T>, args: any[]) => () => runnable.run(...args),

    around: <T>(
        arounder: RunArgFactory,
        execution: () => Promise<T>,
        runnable: Runnable,
    ) => () => arounder.aroundRun!(execution, runnable),
}

export default (
    instantiate: Instantiator,
) => async <T>(
        runnable: Runnable<T>,
    ) =>
    {
        let metadata =
            Reflect.getMetadata(RunArgKeys.run, runnable) as
            RunArgMetadata[] | undefined
        ;

        if (metadata === undefined) return await runnable.run();

        for (let i = 0; i < metadata.length; ++i) {
            if (metadata[i] === undefined) throw new Error(
                `no RunArg found for arg #${i} of ${runnable.constructor.name}::run()`,
            );
        }

        let runArgs: any[] = [];

        let factories: RunArgFactory[] = [];
        let arounders: RunArgFactory[] = [];

        for (
            let { Factory, options }
            of
            metadata as RunArgMetadata[]
        ) {
            let factory = instantiate(Factory);
            factories.push(factory);
            if (factory.aroundRun) arounders.push(factory);
            runArgs.push(factory.produceRunArgFor(runnable, options));
        }
        runArgs = await Promise.all(runArgs);

        try {
            if (!arounders.length) return await runnable.run(...runArgs);

            let execution = wraps.runnable(runnable, runArgs);
            for (let arounder of arounders) {
                execution = wraps.around(arounder, execution, runnable);
            }

            return await execution();
        } catch (e) {
            throw e;
        } finally {
            for (let factory of factories) await factory.releaseRunArgFor(runnable);
        }
    }
;

