import 'reflect-metadata';
import { Around } from './aop';

export default (Around: Around) => (
    timeToLiveInSeconds: number,
) => Around(
    async (execute, target, methodName, args) => {
        const symbol = Around;

        if (args.length) throw new Error(`memoization with args not supported`);

        type Cache = {
            value?: any,
            promise?: Promise<any>,
            createdAt?: Date,
        };

        if (Reflect.hasMetadata(symbol, target[methodName])) {
            let v: Cache = Reflect.getMetadata(symbol, target[methodName]);
            if (v.promise) return await v.promise;
            if (expired(v.createdAt, timeToLiveInSeconds)) return await renew();
            else return v.value;
        } else return await renew();

        async function renew() {
            let promise = execute();
            let cache: Cache = { promise };
            Reflect.defineMetadata(symbol, cache, target[methodName]);
            cache.value = await cache.promise;
            cache.createdAt = new Date();
            delete cache.promise;
            return cache.value
        };
    }
)

function expired(d: Date | undefined, ttl: number) {
    if (!d) return true;
    return new Date().getTime() - d.getTime() > ttl * 1000
}