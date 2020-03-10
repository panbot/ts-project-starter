import "reflect-metadata";

type TypeOf<T> = new (...args: any[]) => T;
type Instantiator = <T>(type: TypeOf<T>) => T;
type Register = (s: any) => void;

export interface BeforeAdvisor {
    beforePointcut(target: any, method: string, args: any[]): void;
}

export interface AfterAdvisor {
    afterPointcut(result: any, target: any, method: string, args: any[]): any;
}

export interface AroundAdvisor {
    aroundPointcut(
        execution: () => any,
        target: any,
        method: string,
        args: any[]
    ): any;
}

const metadataKeys = {
    proxy: Symbol('aop metadata proxy'),
}

export default (
    instantiate: Instantiator,
    register: Register,
) => {

    const Before = (Advisor: TypeOf<BeforeAdvisor>) =>
        (
            prototype: Object,
            propertyName: string,
        ) => advice(
            prototype,
            propertyName,
            (execution, target, args) => (
                instantiate(Advisor).beforePointcut(target, propertyName, args),
                execution()
            ),
        )
    ;

    const After = (Advisor: TypeOf<AfterAdvisor>) =>
        (
            prototype: Object,
            propertyName: string,
        ) => advice(
            prototype,
            propertyName,
            (execution, target, args) => instantiate(Advisor).afterPointcut(
                execution(),
                target, propertyName, args,
            ),
        )
    ;

    const Around = (Advisor: TypeOf<AroundAdvisor>) =>
        (
            prototype: Object,
            propertyName: string,
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
        propertyName: string,
        advice: (execution: () => any, target, args: any[]) => any,
    ) {
        if ('function' != typeof prototype[propertyName])
            throw new Error(`${prototype.constructor.name}.${propertyName} is not a function`)
        ;

        let target;
        if (Reflect.hasMetadata(metadataKeys.proxy, prototype)) {
            target = Reflect.getMetadata(metadataKeys.proxy, prototype);
        } else {
            target = instantiate(prototype.constructor as TypeOf<T>);
        }

        let proxy = Object.create(target);
        Object.defineProperty(proxy, propertyName, {
            value: (...args: any[]) => advice(
                () => (target[propertyName] as Function).apply(target, args),
                target,
                args
            ),
        });
        Reflect.defineMetadata(metadataKeys.proxy, proxy, prototype)

        register(proxy);
    }
}
