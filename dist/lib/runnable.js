"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const RunArgKeys = {
    run: Symbol(),
};
function RunArg(Factory, ...factoryArgs) {
    return (proto, method, index) => {
        const key = RunArgKeys[method];
        if (!key)
            throw new Error(`${method} not supported`);
        if (!Reflect.hasMetadata(key, proto)) {
            Reflect.defineMetadata(key, [], proto);
        }
        let list = Reflect.getMetadata(key, proto);
        list[index] = { Factory, factoryArgs };
    };
}
exports.RunArg = RunArg;
const wraps = {
    runnable: (runnable, args) => () => runnable.run(...args),
    around: (arounder, execution, runnable) => () => arounder.aroundRun(execution, runnable),
};
exports.default = (instantiate) => async (runnable) => {
    let metadata = Reflect.getMetadata(RunArgKeys.run, runnable);
    if (metadata === undefined)
        return await runnable.run();
    for (let i = 0; i < metadata.length; ++i) {
        if (metadata[i] === undefined)
            throw new Error(`no RunArg found for arg #${i} of ${runnable.constructor.name}::run()`);
    }
    let runArgs = [];
    let factories = [];
    let arounders = [];
    for (let { Factory, factoryArgs } of metadata) {
        let factory = instantiate(Factory);
        factories.push(factory);
        if (factory.aroundRun)
            arounders.push(factory);
        runArgs.push(factory.produceRunArgFor(runnable, ...factoryArgs));
    }
    runArgs = await Promise.all(runArgs);
    try {
        if (!arounders.length)
            return await runnable.run(...runArgs);
        let execution = wraps.runnable(runnable, runArgs);
        for (let arounder of arounders) {
            execution = wraps.around(arounder, execution, runnable);
        }
        return await execution();
    }
    catch (e) {
        throw e;
    }
    finally {
        for (let factory of factories)
            await factory.releaseRunArgFor(runnable);
    }
};
//# sourceMappingURL=runnable.js.map