
export type Constructor<T> = new (...args: any[]) => T;
export type Instantiator = <T>(type: Constructor<T>) => T;
export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
