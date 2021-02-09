import 'reflect-metadata';
import { Around } from './aop';

export default (Around: Around) => (
    timeToLiveInSeconds: number,
    autoUpdate: boolean = false,
) => ((
    symbol: Symbol,
) => autoUpdate?
    Around(async (execute, target, methodName, args) => {
        if (args.length) throw new Error(`memoization with args not supported`);
        if (Reflect.hasMetadata(symbol, target[methodName])) {
            let v: Cache = Reflect.getMetadata(symbol, target[methodName]);
            if (v.promise) return await v.promise;
            else return v.value;
        } else {
            setInterval(renew, timeToLiveInSeconds * 1000).unref();

            Reflect.defineMetadata(symbol, {}, target[methodName]);
            return await renew();
        }

        async function renew() {
            let rewnewedAt = new Date();
            let cache: Cache = Reflect.getMetadata(symbol, target[methodName]);
            cache.rewnewedAt = rewnewedAt;
            cache.promise = execute();
            let value = await cache.promise;

            cache = Reflect.getMetadata(symbol, target[methodName]);
            if (cache.rewnewedAt?.getTime() != rewnewedAt.getTime()) return value;

            delete cache.promise;
            cache.value = value;
            cache.resolvedAt = new Date();
            return value;
        }
    })
    :
    Around(async (execute, target, methodName, args) => {
        if (args.length) throw new Error(`memoization with args not supported`);

        if (Reflect.hasMetadata(symbol, target[methodName])) {
            let cache: Cache = Reflect.getMetadata(symbol, target[methodName]);
            if (cache.promise) return await cache.promise;
            if (expired(cache.resolvedAt)) return await renew();
            else return cache.value;
        } else return await renew();

        async function renew() {
            let cache: Cache = { rewnewedAt: new Date(), promise: execute() };
            Reflect.defineMetadata(symbol, cache, target[methodName]);
            cache.value = await cache.promise;
            delete cache.promise;
            cache.resolvedAt = new Date();
            return cache.value
        };

        function expired(d: Date | undefined) {
            if (!d) return true;
            return new Date().getTime() - d.getTime() > timeToLiveInSeconds * 1000
        }
    })
)(getSymbol(Around))

type Cache = {
    value?: any,
    promise?: Promise<any>,
    rewnewedAt?: Date,
    resolvedAt?: Date,
};

let symbols = new Map<any, Symbol>();
function getSymbol(key: any) {
    let s = symbols.get(key);
    if (!s) {
        s = Symbol();
        symbols.set(key, s);
        return s;
    } else {
        return s;
    }
}
