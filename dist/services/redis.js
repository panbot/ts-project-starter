"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const IORedis = require("ioredis");
const parameter_1 = require("../core/parameter");
class RedisService {
    constructor() {
        this.runArgs = new WeakMap();
    }
    connect() {
        const config = this.config;
        let redis = new IORedis(config.url, {
            lazyConnect: true,
            retryStrategy: times => times > 5 ? undefined : 400,
            reconnectOnError: err => err.message.slice(0, 8) == 'READONLY',
        });
        return redis;
    }
    async run(runner) {
        let redis;
        try {
            return await runner(redis = this.connect());
        }
        catch (e) {
            throw e;
        }
        finally {
            if (redis)
                redis.disconnect();
        }
    }
    produceRunArgFor(o) {
        let redis = this.runArgs.get(o);
        if (!redis)
            this.runArgs.set(o, redis = this.connect());
        this.runArgs.set(o, redis);
        return Promise.resolve(redis);
    }
    releaseRunArgFor(o) {
        const redis = this.runArgs.get(o);
        if (redis)
            redis.disconnect();
        this.runArgs.delete(o);
        return Promise.resolve();
    }
}
__decorate([
    parameter_1.InjectParam(p => p.redis),
    __metadata("design:type", Object)
], RedisService.prototype, "config", void 0);
exports.RedisService = RedisService;
//# sourceMappingURL=redis.js.map