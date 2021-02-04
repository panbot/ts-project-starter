
export function createMetadataRegistry<T>(
    key: any,
    target: Object,
    property: string | undefined = undefined,
) {
    let args = [ target, property ];
    return {
        add(metadata: T) {
            let list: T[] = Reflect.getOwnMetadata.call(Reflect, key, ...args) || [];
            list.push(metadata);
            Reflect.defineMetadata.call(Reflect, key, list, ...args);
            return list;
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
        },
    }
}