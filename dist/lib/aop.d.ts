import "reflect-metadata";
declare type TypeOf<T> = new (...args: any[]) => T;
declare type Instantiator = <T>(type: TypeOf<T>) => T;
declare type Register = (s: any) => void;
export interface BeforeAdvisor {
    beforePointcut(target: any, method: string, args: any[]): void;
}
export interface AfterAdvisor {
    afterPointcut(result: any, target: any, method: string, args: any[]): any;
}
export interface AroundAdvisor {
    aroundPointcut(execution: () => any, target: any, method: string, args: any[]): any;
}
declare const _default: (instantiate: Instantiator, register: Register) => {
    Before: (Advisor: TypeOf<BeforeAdvisor>) => (prototype: Object, propertyName: string) => void;
    After: (Advisor: TypeOf<AfterAdvisor>) => (prototype: Object, propertyName: string) => void;
    Around: (Advisor: TypeOf<AroundAdvisor>) => (prototype: Object, propertyName: string) => void;
};
export default _default;
