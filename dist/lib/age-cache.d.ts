export declare class AgeCache<T> {
    private refresher;
    private interval;
    private promise;
    private value;
    lastError: any;
    private timeout;
    constructor(refresher: () => Promise<T>, interval: number);
    getValue(): Promise<T>;
    invalidate(): void;
    start(): void;
}
