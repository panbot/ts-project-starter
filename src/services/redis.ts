// import { RunArgFactory } from "../lib/runnable";
// import * as IORedis from 'ioredis';
// import { InjectParam } from "../parameter";

// export class RedisService implements RunArgFactory<IORedis.Redis> {

//     @InjectParam(p => p.redis)
//     private config: {
//         url: string,
//     };

//     connect() {
//         const config = this.config;
//         let redis = new IORedis(config.url, {
//             lazyConnect: true, // 如果未发送任何请求就关闭链接会报错
//             retryStrategy: times => times > 5 ? undefined : 400,
//             reconnectOnError: err => err.message.slice(0, 8) == 'READONLY',
//         });

//         return redis;
//     }

//     async run<T>(runner: (redis: IORedis.Redis) => Promise<T>) {
//         let redis: IORedis.Redis | undefined;
//         try {
//             return await runner(redis = this.connect());
//         } catch (e) {
//             throw e;
//         } finally {
//             if (redis) redis.disconnect();
//         }
//     }

//     private runArgs = new WeakMap<any, IORedis.Redis>();

//     produceRunArgFor(o: any) {
//         let redis = this.runArgs.get(o);
//         if (!redis) this.runArgs.set(o, redis = this.connect());
//         this.runArgs.set(o, redis);
//         return Promise.resolve(redis);
//     }

//     releaseRunArgFor(o: any) {
//         const redis = this.runArgs.get(o);
//         if (redis) redis.disconnect();
//         this.runArgs.delete(o);
//         return Promise.resolve();
//     }
// }