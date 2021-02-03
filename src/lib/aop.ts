import "reflect-metadata";

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
    ) => { advice(
        (execute, target, args) => ( beforePointcut(target, propertyName, args), execute() ),
        prototype,
        propertyName,
        descriptor,
    ) };

    const After = (
        afterPointcut: (result: any, target: any, method: string, args: any[]) => any,
    ) => (
        prototype: any,
        propertyName: string,
        descriptor: PropertyDescriptor,
    ) => { advice(
        (execute, target, args) => afterPointcut(
            execute(),
            target, propertyName, args,
        ),
        prototype,
        propertyName,
        descriptor,
    ) };

    const Around = (
        aroundPointcut: (execute: () => any, target: any, method: string, args: any[]) => any,
    ) => (
        prototype: any,
        propertyName: string,
        descriptor: PropertyDescriptor,
    ) => { advice(
        (execute, target, args) => aroundPointcut(
            execute,
            target, propertyName, args,
        ),
        prototype,
        propertyName,
        descriptor,
    ) };

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
    let pointcuts = getMetadataRegistry<AdvicePointcut>(InjectiveAopFactory, original);
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
        let propertyNames = getMetadataRegistry<string>(symbol, target).getUpChain();
        if (!propertyNames.length) return target;

        let proxy = Object.create(target);

        let bag: {
            [ propertyName: string ]: AdvicePointcut[],
        } = {};
        for (let propertyName of propertyNames) {
            bag[propertyName] = getMetadataRegistry<AdvicePointcut>(symbol, target[propertyName]).getOwn();
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

        getMetadataRegistry<AdvicePointcut>(symbol, original).add(pointcut);
        getMetadataRegistry<string>(symbol, prototype).add(propertyName);
    })
}

function checkIsFunction(o: any, k: any): (...args: any[]) => any {
    if ('function' != typeof o[k]) {
        throw new Error(`${o.constructor.name}.${k} is not a function`)
    }

    return o[k];
}

function getMetadataRegistry<T>(
    key: any,
    target: Object,
    property?: string | symbol,
) {
    let args = [ target, property ];
    return {
        add(metadata: T) {
            let list: T[] = Reflect.getOwnMetadata.call(Reflect, key, ...args) || [];
            list.push(metadata);
            Reflect.defineMetadata.call(Reflect, key, list, ...args);
        },
        get(): T[] {
            return Reflect.getMetadata.call(Reflect, key, ...args) || []
        },
        getOwn(): T[] {
            return Reflect.getOwnMetadata.call(Reflect, key, ...args) || []
        },
        getUpChain(): T[] {
            let ret: T[] = [];

            let o = target;
            while (o) {
                let args = [ o, property ];
                ret = ret.concat(Reflect.getOwnMetadata.call(Reflect, key, ...args) || []);
                o = Reflect.getPrototypeOf(o);
            }

            return ret;
        }
    }
}

const wrap = (
    inner: (...args: any[]) => any,
    wrapper: AdvicePointcut,
) => function (this: any, ...args: any[]) {
    return wrapper(() => inner.apply(this, args), this, args)
};
