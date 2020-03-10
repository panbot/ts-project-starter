
const Empty = Symbol("age cache empty value");

export class AgeCache<T> {

    private promise: Promise<T> | undefined;

    private value: T | Symbol = Empty;

    public lastError: any;

    private timeout: NodeJS.Timeout;

    constructor(
        private refresher: () => Promise<T>,
        private interval: number,
    ) {
        this.start();
    }

    async getValue(): Promise<T> {
        if (this.promise !== undefined) return this.promise;

        if (this.value != Empty) return this.value as T;
        else throw this.lastError;
    }

    invalidate() {
        this.value = Empty;
        this.lastError = null;

        this.start();
    }

    start() {
        this.promise = (async () => {
            try {
                this.value = await this.refresher() as T;
                this.promise = undefined;
                return this.value;
            } catch (e) {
                this.lastError = e;
                throw e;
            }
        })();

        if (this.timeout) clearInterval(this.timeout);
        if (this.interval != null && isFinite(this.interval)) {
            this.timeout = setInterval(async () => {
                try {
                    this.value = await this.refresher();
                } catch (e) {
                    this.lastError = e;
                }
            }, this.interval);
            this.timeout.unref();
        }
    }
}
