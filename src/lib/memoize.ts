import 'reflect-metadata';
import { AroundPointcut } from './aop';

export default function(
    timeToLiveInSeconds: number,
) {
    const cacheSymbol = Symbol('memoization advisor cache');

    const pointcut: AroundPointcut = async (execution, target, method, args) => {
        if (args.length) throw new Error(`memoization with args not supported`);

        type Cache = {
            value: any,
            createdAt: Date,
        };

        if (Reflect.hasMetadata(cacheSymbol, target[method])) {
            let v: Cache = Reflect.getMetadata(cacheSymbol, target[method]);
            if (expired(v.createdAt)) return await renew();
            else return v.value;
        } else return await renew();

        async function renew() {
            let value = await execution();
            let cache: Cache = { value, createdAt: new Date() };
            Reflect.defineMetadata(cacheSymbol, cache, target[method]);
            return value
        };
    }

    return pointcut;

    function expired(d: Date) {
        return new Date().getTime() - d.getTime() > timeToLiveInSeconds * 1000
    }
}
