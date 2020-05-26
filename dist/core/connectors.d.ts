import { Runnable } from '../lib/runnable';
import { ObjectType } from "typedi";
export declare const Before: (Advisor: new (...args: any[]) => import("../lib/aop").BeforeAdvisor) => (prototype: Object, propertyName: string) => void, After: (Advisor: new (...args: any[]) => import("../lib/aop").AfterAdvisor) => (prototype: Object, propertyName: string) => void, Around: (Advisor: new (...args: any[]) => import("../lib/aop").AroundAdvisor) => (prototype: Object, propertyName: string) => void;
export declare const run: <T>(runnable: Runnable<T>) => Promise<T>;
export declare function RunnerAgeCache(Runner: ObjectType<Runnable>, ttl: number): (object: any, propertyName: string, index?: number | undefined) => void;
export declare const jwt: {
    encode: (jsonable: Object) => string;
    decode: (jwt: unknown) => any;
};
