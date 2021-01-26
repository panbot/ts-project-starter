import { Constructor } from "../types";

export function createRegistryDecorator<
    Decoratee extends Constructor<any>,
    CompleteOptions,
    InitOptions,
>(
    initOptions: (ctor: Decoratee) => CompleteOptions,
) {
    let registry = new Map<Decoratee, CompleteOptions>();
    let inits = new Map<Decoratee, ((options: CompleteOptions) => any)[]>();

    const decorator =
        (options: InitOptions) =>
        (ctor: Decoratee) => {
            let completeOptions = Object.assign(initOptions(ctor), options);
            inits.get(ctor)?.forEach(cb => cb(completeOptions));
            inits.delete(ctor);
            registry.set(ctor, completeOptions);
        }
    ;

    const has = (ctor: Decoratee) => registry.has(ctor);
    const get = (ctor: Decoratee) => {
        let options = registry.get(ctor);
        if (!options) throw new Error(`options for ${ctor.name} not found`);
        return options;
    }

    const access = (ctor: Decoratee, cb: (options: CompleteOptions) => any) => {
        let options = registry.get(ctor);
        if (!options) inits.set(ctor, (inits.get(ctor) || []).concat(cb));
        else cb(options);
    }

    return Object.assign(decorator, { has, get, access, registry })
}
