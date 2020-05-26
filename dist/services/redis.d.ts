import { RunArgFactory } from "../lib/runnable";
import * as IORedis from 'ioredis';
export declare class RedisService implements RunArgFactory<IORedis.Redis> {
    private config;
    connect(): IORedis.Redis;
    run<T>(runner: (redis: IORedis.Redis) => Promise<T>): Promise<T>;
    private runArgs;
    produceRunArgFor(o: any): Promise<IORedis.Redis>;
    releaseRunArgFor(o: any): Promise<void>;
}
