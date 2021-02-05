import "reflect-metadata";
import mr from './metadata-registry';

export function AopFactory(
    advice: (
        pointcut: AdvicePointcut,
        prototype: any,
        propertyName: string,
        descriptor: PropertyDescriptor,
    ) => void,
) {
    const Before = (
        beforePointcut: (target: any, method: string, args: any[]) => void,
    ) => (
        prototype: any,
        propertyName: string,
        descriptor: PropertyDescriptor,
    ) => void advice(
        (execute, target, args) => ( beforePointcut(target, propertyName, args), execute() ),
        prototype,
        propertyName,
        descriptor,
    );

    const After = (
        afterPointcut: (result: any, target: any, method: string, args: any[]) => any,
    ) => (
        prototype: any,
        propertyName: string,
        descriptor: PropertyDescriptor,
    ) => void advice(
        (execute, target, args) => afterPointcut(
            execute(),
            target, propertyName, args,
        ),
        prototype,
        propertyName,
        descriptor,
    );

    const Around = (
        aroundPointcut: (execute: () => any, target: any, method: string, args: any[]) => any,
    ) => (
        prototype: any,
        propertyName: string,
        descriptor: PropertyDescriptor,
    ) => void advice(
        (execute, target, args) => aroundPointcut(
            execute,
            target, propertyName, args,
        ),
        prototype,
        propertyName,
        descriptor,
    );

    return { Before, After, Around }
}

export type Before = ReturnType<typeof AopFactory>["Before"];
export type After = ReturnType<typeof AopFactory>["After"];
export type Around = ReturnType<typeof AopFactory>["Around"];

type AdvicePointcut = (execute: () => any, target: any, args: any[]) => any;

export const DestructiveAop = () => AopFactory((
    pointcut: AdvicePointcut,
    prototype: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
) => {
    checkIsFunction(prototype, propertyName);
    descriptor.value = wrap(descriptor.value, pointcut);
});

export const InjectiveAopFactory = (
    inject: (prototype: Object, propertyName: string, factory: () => any) => any,
) => AopFactory((
    pointcut: AdvicePointcut,
    prototype: any,
    propertyName: string,
) => {
    const original = checkIsFunction(prototype, propertyName);
    let pointcuts = mr<AdvicePointcut>(InjectiveAopFactory, original);
    pointcuts.add(pointcut);

    inject(
        prototype,
        propertyName as string,
        () => function (this: any, ...args: any[] ) {
            return pointcuts.getOwn()
                .reduce((pv, cv) => wrap(pv, cv), original)
                .apply(this, args)
        },
    );
});

export const ProxitiveAop = (
    use: (proxifier: (object: any) => any) => any,
) => {
    const symbol = InjectiveAopFactory;

    use((target: any) => {
        let propertyNames = mr<string>(symbol, target).getUpChain();
        if (!propertyNames.length) return target;

        let proxy = Object.create(target);

        let bag: {
            [ propertyName: string ]: AdvicePointcut[],
        } = {};
        for (let propertyName of new Set(propertyNames)) {
            bag[propertyName] = mr<AdvicePointcut>(symbol, target[propertyName]).getOwn();
        }

        for (let propertyName of Object.keys(bag)) {
            const original = target[propertyName];
            Object.defineProperty(proxy, propertyName, {
                value: function (this: any, ...args: any[] ) {
                    return bag[propertyName]
                        .reduce((pv, cv) => wrap(pv, cv), original)
                        .apply(this, args)
                },
            })
        }

        return proxy;
    });

    return AopFactory((
        pointcut: AdvicePointcut,
        prototype: any,
        propertyName: string,
    ) => {
        const original = checkIsFunction(prototype, propertyName);

        mr<AdvicePointcut>(symbol, original).add(pointcut);
        mr<string>(symbol, prototype).add(propertyName);
    })
}

function checkIsFunction(o: any, k: any): (...args: any[]) => any {
    if ('function' != typeof o[k]) {
        throw new Error(`${o.constructor.name}.${k} is not a function`)
    }

    return o[k];
}

const wrap = (
    inner: (...args: any[]) => any,
    wrapper: AdvicePointcut,
) => function (this: any, ...args: any[]) {
    return wrapper(() => inner.apply(this, args), this, args)
};
