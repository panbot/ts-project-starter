import "reflect-metadata";
import { Constructor } from "./types";

export interface BeforeAdvisor {
    beforePointcut<T>(target: T, method: keyof T, args: any[]): void;
}

export interface AfterAdvisor {
    afterPointcut<T>(result: any, target: T, method: keyof T, args: any[]): any;
}

export interface AroundAdvisor {
    aroundPointcut<T>(
        execution: () => any,
        target: T,
        method: keyof T,
        args: any[]
    ): any;
}

const ProxySymbol = Symbol('aop metadata proxy');

export default (
    instantiate: <T>(type: Constructor<T>) => T,
    register: (s: any) => void,
) => {

    const Before = <T extends Object>(Advisor: Constructor<BeforeAdvisor>) =>
        (
            prototype: T,
            propertyName: keyof T,
        ) => advice(
            prototype,
            propertyName,
            (execution, target, args) => (
                instantiate(Advisor).beforePointcut(target, propertyName, args),
                execution()
            ),
        )
    ;

    const After = <T extends Object>(Advisor: Constructor<AfterAdvisor>) =>
        (
            prototype: T,
            propertyName: keyof T,
        ) => advice(
            prototype,
            propertyName,
            (execution, target, args) => instantiate(Advisor).afterPointcut(
                execution(),
                target, propertyName, args,
            ),
        )
    ;

    const Around = <T extends Object>(Advisor: Constructor<AroundAdvisor>) =>
        (
            prototype: T,
            propertyName: keyof T,
        ) => advice(
            prototype,
            propertyName,
            (execution, target, args) => instantiate(Advisor).aroundPointcut(
                execution,
                target, propertyName, args,
            ),
        )
    ;

    return { Before, After, Around }

    function advice<T extends Object>(
        prototype: T,
        propertyName: keyof T,
        advice: (execution: () => any, target: any, args: any[]) => any,
    ) {
        if ('function' != typeof prototype[propertyName])
            throw new Error(`${prototype.constructor.name}.${propertyName} is not a function`)
        ;

        let target: any;
        if (Reflect.hasMetadata(ProxySymbol, prototype)) {
            target = Reflect.getMetadata(ProxySymbol, prototype);
        } else {
            target = instantiate(prototype.constructor as Constructor<T>);
        }

        let proxy = Object.create(target);
        Object.defineProperty(proxy, propertyName, {
            value: (...args: any[]) => advice(
                () => (target[propertyName] as Function).apply(target, args),
                target,
                args
            ),
        });
        Reflect.defineMetadata(ProxySymbol, proxy, prototype)

        register(proxy);
    }
}
