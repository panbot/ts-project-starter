import 'reflect-metadata';
import { Around as AroundType } from './aop';

export default (
    Around: AroundType,
) => (
    secondsToLive: number,
    autoUpdate: boolean = false,
) => Around((execute, target, methodName, args) => {
    if (args.length) throw new Error(`memoization with args not supported`);

    let symbol = getSymbol(Around);
    let cache: Cache;

    if (Reflect.hasMetadata(symbol, target[methodName])) {
        cache = Reflect.getMetadata(symbol, target[methodName]);

        if (
            cache.success &&
            cache.success.age() < secondsToLive * 1000
        ) return cache.success.value;
    } else {
        cache = new Cache();
        Reflect.defineMetadata(symbol, cache, target[methodName]);

        if (autoUpdate) setInterval(
            () => cache.renew(execute).catch(e => console.error(e)),
            secondsToLive * 1000,
        );
    }

    return cache.renew(execute);
})

export class Cache {

    success?: {
        at: Date,
        value: any,
        age: () => number,
    };

    error: any;

    private promise?: Promise<any>;

    async renew(retrieve: () => Promise<any>) {
        if (this.promise) return this.promise;

        this.promise = retrieve();
        try {
            let value = await this.promise;
            this.success = {
                at: new Date,
                value,
                age() { return new Date().getTime() - this.at.getTime() }
            };
            this.error = undefined;
            return value;
        } catch (e) {
            this.error = e;
            throw e;
        } finally {
            this.promise = undefined;
        }
    }
}

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
