import "reflect-metadata";
import { Constructor, Instantiator } from "./types";

export function AopFactory(
    advice: <T extends Object>(
        porintcut: (execution: () => any, target: any, args: any[]) => any,
        prototype: T,
        propertyName: keyof T,
        descriptor: PropertyDescriptor,
    ) => void,
) {
    const Before = <T = any>(
        beforePointcut: <T>(target: T, method: keyof T, args: any[]) => void,
    ) => (
        prototype: T,
        propertyName: keyof T,
        descriptor: PropertyDescriptor,
    ) => advice(
        (execution, target, args) => (
            beforePointcut(target, propertyName, args),
            execution()
        ),
        prototype,
        propertyName,
        descriptor,
    );

    const After = <T = any>(
        afterPointcut: <T>(result: any, target: T, method: keyof T, args: any[]) => any,
    ) => (
        prototype: T,
        propertyName: keyof T,
        descriptor: PropertyDescriptor,
    ) => advice(
        (execution, target, args) => afterPointcut(
            execution(),
            target, propertyName, args,
        ),
        prototype,
        propertyName,
        descriptor,
    );

    const Around = <T = any>(
        aroundPointcut: <T>(execution: () => any, target: T, method: keyof T, args: any[]) => any,
    ) => (
        prototype: T,
        propertyName: keyof T,
        descriptor: PropertyDescriptor,
    ) => advice(
        (execution, target, args) => aroundPointcut(
            execution,
            target, propertyName, args,
        ),
        prototype,
        propertyName,
        descriptor,

    );

    return { Before, After, Around }
}

export type BeforePointcut = Parameters<ReturnType<typeof AopFactory>["Before"]>[0];
export type AfterPointcut = Parameters<ReturnType<typeof AopFactory>["After"]>[0];
export type AroundPointcut = Parameters<ReturnType<typeof AopFactory>["Around"]>[0];

export const ProxifiedAopFactory = (
    instantiate: Instantiator,
    register: (type: any, instance: any) => void,
) => AopFactory(
    <T extends Object>(
        porintcut: (execution: () => any, target: any, args: any[]) => any,
        prototype: T,
        propertyName: keyof T,
    ) => {
        const proxySymbol = Symbol('aop metadata proxy');

        const func = checkIsFunction(prototype, propertyName);

        let target: any;
        if (Reflect.hasMetadata(proxySymbol, prototype)) {
            target = Reflect.getMetadata(proxySymbol, prototype);
        } else {
            target = instantiate(prototype.constructor as Constructor<T>);
        }

        let proxy = Object.create(target);
        Object.defineProperty(proxy, propertyName, {
            value: (...args: any[]) => porintcut(
                () => func.apply(target, args),
                target,
                args
            ),
        });
        Reflect.defineMetadata(proxySymbol, proxy, prototype)

        register(prototype.constructor, proxy);
    },
);

export const DestructiveAop = () => AopFactory(
    <T extends Object>(
        advice: (execution: () => any, target: any, args: any[]) => any,
        prototype: T,
        propertyName: keyof T,
        descriptor: PropertyDescriptor,
    ) => {
        const func = checkIsFunction(prototype, propertyName);
        descriptor.value = (...args: any[]) => advice(
            () => func.apply(prototype, args),
            prototype,
            args
        );
    },
);

function checkIsFunction(o: any, k: any): Function {
    if ('function' != typeof o[k]) {
        throw new Error(`${o.constructor.name}.${k} is not a function`)
    }

    return o[k];
}
