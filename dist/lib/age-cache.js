"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Empty = Symbol("age cache empty value");
class AgeCache {
    constructor(refresher, interval) {
        this.refresher = refresher;
        this.interval = interval;
        this.value = Empty;
        this.start();
    }
    async getValue() {
        if (this.promise !== undefined)
            return this.promise;
        if (this.value != Empty)
            return this.value;
        else
            throw this.lastError;
    }
    invalidate() {
        this.value = Empty;
        this.lastError = null;
        this.start();
    }
    start() {
        this.promise = (async () => {
            try {
                this.value = await this.refresher();
                this.promise = undefined;
                return this.value;
            }
            catch (e) {
                this.lastError = e;
                throw e;
            }
        })();
        if (this.timeout)
            clearInterval(this.timeout);
        if (this.interval != null && isFinite(this.interval)) {
            this.timeout = setInterval(async () => {
                try {
                    this.value = await this.refresher();
                }
                catch (e) {
                    this.lastError = e;
                }
            }, this.interval);
            this.timeout.unref();
        }
    }
}
exports.AgeCache = AgeCache;
//# sourceMappingURL=age-cache.js.map