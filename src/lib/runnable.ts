import "reflect-metadata";

type TypeOf<T> = new (...args: any[]) => T;
type Instantiator = <T>(type: TypeOf<T>) => T;

const RunArgKeys = {
    run: Symbol(),
}

export interface RunArgFactory<T> {
    produceRunArgFor(r: Runnable, ...args: any[]): Promise<T>;
    releaseRunArgFor(r: Runnable): Promise<void>;
    aroundRun?<T>(run: () => Promise<T>, r: Runnable): Promise<T>;
}

type RunArgMetadata<T> = {
    Factory: TypeOf<RunArgFactory<T>>,
    factoryArgs: any[],
};

export interface Runnable<RunResult = any> {
    run(...args: any[]): Promise<RunResult>;
}

export function RunArg<Arg>(Factory: TypeOf<RunArgFactory<Arg>>, ...factoryArgs: any[]) {
    return (proto: Runnable, method: string, index: number) => {
        const key = RunArgKeys[method];
        if (!key) throw new Error(`${method} not supported`);

        if (!Reflect.hasMetadata(key, proto)) {
            Reflect.defineMetadata(key, [], proto);
        }

        let list = Reflect.getMetadata(key, proto) as any[];
        list[index] = { Factory, factoryArgs } as RunArgMetadata<Arg>;
    }
}

const wraps = {

    runnable: <T>(runnable: Runnable<T>, args: any[]) => () => runnable.run(...args),

    around: <T>(
        arounder: RunArgFactory<any>,
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
            RunArgMetadata<any>[] | undefined
        ;

        if (metadata === undefined) return await runnable.run();

        for (let i = 0; i < metadata.length; ++i) {
            if (metadata[i] === undefined) throw new Error(
                `no RunArg found for arg #${i} of ${runnable.constructor.name}::run()`,
            );
        }

        let runArgs: any[] = [];

        let factories: RunArgFactory<any>[] = [];
        let arounders: RunArgFactory<any>[] = [];

        for (
            let { Factory, factoryArgs }
            of
            metadata as RunArgMetadata<any>[]
        ) {
            let factory = instantiate(Factory);
            factories.push(factory);
            if (factory.aroundRun) arounders.push(factory);
            runArgs.push(factory.produceRunArgFor(runnable, ...factoryArgs));
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

