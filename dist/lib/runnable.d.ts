import "reflect-metadata";
declare type TypeOf<T> = new (...args: any[]) => T;
declare type Instantiator = <T>(type: TypeOf<T>) => T;
export interface RunArgFactory<T> {
    produceRunArgFor(r: Runnable, ...args: any[]): Promise<T>;
    releaseRunArgFor(r: Runnable): Promise<void>;
    aroundRun?<T>(run: () => Promise<T>, r: Runnable): Promise<T>;
}
export interface Runnable<RunResult = any> {
    run(...args: any[]): Promise<RunResult>;
}
export declare function RunArg<Arg>(Factory: TypeOf<RunArgFactory<Arg>>, ...factoryArgs: any[]): (proto: Runnable<any>, method: string, index: number) => void;
declare const _default: (instantiate: Instantiator) => <T>(runnable: Runnable<T>) => Promise<T>;
export default _default;
