
export type Constructor<T> = new (...args: any[]) => T;
export type Instantiator = <T>(type: Constructor<T>) => T;
