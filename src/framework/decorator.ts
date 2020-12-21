

export function createRegistryDecorator<Constructor, Options>(
    createDefaultOptions: (ctor: Constructor) => Options,
) {
    let registry = new Map<Constructor, Options>();

    const decorator = (options: Partial<Options>) => (ctor: Constructor) => { set(ctor, options) };

    const has = (ctor: Constructor) => registry.has(ctor);
    const get = (ctor: Constructor) => registry.get(ctor);
    const goc = (ctor: Constructor) => registry.get(ctor) || createDefaultOptions(ctor);
    const set = (ctor: Constructor, options: Partial<Options>) => registry.set(ctor, Object.assign(goc(ctor), options));

    return Object.assign(decorator, { has, get, goc, set, registry })
}
