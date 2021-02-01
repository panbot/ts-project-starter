import 'reflect-metadata';
import { AroundPointcut } from './aop';

export default function(
    timeToLiveInSeconds: number,
) {
    const cacheSymbol = Symbol('memoization advisor cache');

    const pointcut: AroundPointcut = async (execution, target, method, args) => {
        if (args.length) throw new Error(`memoization with args not supported`);

        type Cache = {
            value?: any,
            promise?: Promise<any>,
            createdAt?: Date,
        };

        if (Reflect.hasMetadata(cacheSymbol, target[method])) {
            let v: Cache = Reflect.getMetadata(cacheSymbol, target[method]);
            if (v.promise) return await v.promise;
            if (expired(v.createdAt)) return await renew();
            else return v.value;
        } else return await renew();

        async function renew() {
            let promise = execution();
            let cache: Cache = { promise };
            Reflect.defineMetadata(cacheSymbol, cache, target[method]);
            cache.value = await cache.promise;
            cache.createdAt = new Date();
            delete cache.promise;
            return cache.value
        };
    }

    return pointcut;

    function expired(d: Date | undefined) {
        if (!d) return true;
        return new Date().getTime() - d.getTime() > timeToLiveInSeconds * 1000
    }
}
