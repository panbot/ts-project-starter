import 'reflect-metadata';
import { Constructor } from './types';
import mr from './metadata-registry';

export default function () {

    const MetadataKeys = {
        PropertyName: Symbol('property_name'),
        Injection: Symbol('injection'),
    }

    type ServiceKey = string | Token<any> | Constructor<any>;
    let services = new Map<ServiceKey, {
        instance?: any,
        factory?: (getter: typeof get) => any,
        ctor?: Constructor<any>,
        multiple?: ServiceKey[],
    }>();
    type Events = 'instantiated';
    let eventHandlers: Record<Events, Function[]> = {
        instantiated: [],
    };

    function Inject(): Function;
    function Inject(name: string): Function;
    function Inject(type: () => any): Function;
    function Inject(token: TokenType<any>): Function;
    function Inject() {
        const arg = arguments[0];

        return (
            target: Object,
            propertyKey: string | undefined,
            index?: number,
        ) => registerInjection(
            validateDecoratorParameters(
                target,
                propertyKey,
                index,
                arg
            ),
            target,
            propertyKey,
        );
    }

    function Service(name: string): Function;
    function Service(token: TokenType<any>): Function;
    function Service(factory: (getter: typeof get) => any): Function;
    function Service() {
        const arg = arguments[0];

        return (ctor: Constructor<any>) => {
            if (typeof arg == 'string') {
                services.set(arg, { ctor });
            } else if (arg instanceof Token) {
                if (arg.multiple) {
                    let def = services.get(arg);
                    if (def) {
                        def.multiple!.push(ctor);
                    } else {
                        services.set(arg, { multiple: [ ctor ] })
                    }
                } else {
                    services.set(arg, { ctor });
                }
           } else if (typeof arg == 'function') {
               services.set(ctor, {
                   factory: arg,
               })
           }
        }
    }

    function get(name: string): any;
    function get<T>(type: Constructor<T>): T;
    function get<T>(token: TokenType<T>): T;
    function get(arg: any) {
        let v = services.get(arg);
        if (!v) {
            if (typeof arg == 'function') { // a construstor
                return instantiate(arg);
            } else {
                throw new Error(`service "${arg}" not found`);
            }
        }

        if (v.instance) return v.instance;

        if (v.factory) {
            v.instance = v.factory(get);
        } else if (v.ctor) {
            v.instance = instantiate(v.ctor);
        } else if (v.multiple) {
            v.instance = v.multiple.map(get);
        } else {
            throw new Error(`unable to create service instance due to exhaustion of options`);
        }

        return v.instance
    }

    function set(name: string, instance: any): void;
    function set<T>(type: Constructor<T>, instance: any): void;
    function set<T>(token: TokenType<T>, instance: T): void;
    function set(arg: any, instance: any) {
        services.set(arg, { instance });
    }

    function instantiate<T extends Object>(ctor: Constructor<T>) {
        let instance = new ctor(
            ...mr<ParameterInjection>(MetadataKeys.Injection, ctor).get().reduce(
                (pv, cv) => (pv[cv.index] = develop(cv), pv),
                [] as any[],
            ));

        try {
            for (let handler of eventHandlers.instantiated) {
                instance = handler(instance);
            }

            // to prevent infinite loop
            services.set(ctor, { instance });

            for (let [ property, injection ] of getPropertyInjections(ctor.prototype)) {
                let value = develop(injection);
                Reflect.defineProperty(instance, property, { value });
            }

            return instance
        } catch (e) {
            services.delete(ctor);
            throw e;
        }
    }

    function on(event: 'instantiated', handler: <T>(i: T) => T): void;
    function on(event: string, handler: Function) {
        switch (event) {
            case 'instantiated':
            eventHandlers.instantiated.push(handler);
            break;

            default: throw new Error(`unknown event "${event}"`);
        }
    }

    return {
        Inject,
        Service,

        get,
        set,

        instantiate,
        createInject(factory: (getter: typeof get) => any) {
            return function (
                target: Object,
                propertyKey: string | undefined,
                index?: number,
            ) {
                let injection = validateDecoratorParameters(
                    target,
                    propertyKey,
                    index,
                );

                injection.factory = factory;

                registerInjection(injection, target, propertyKey);
            }
        },

        token: <T>(name: string, multiple: boolean = false): TokenType<T> => new Token<T>(name, multiple),

        on,
    }

    function develop<T>(injection: Injection<T>): T {
        if (injection.factory) {
            return injection.factory(get);
        } else if (injection.name) {
            return get(injection.name)
        } else if (injection.token) {
            return get(injection.token);
        } else if (injection.type) {
            return get(injection.type());
        } else if (injection.ctor) {
            return get(injection.ctor);
        } else {
            throw new Error([
                `cannot develop injection,`,
                `${JSON.stringify(injection, null, 4)},`,
                `insufficient information`,
            ].join(' '));
        }
    }

    interface Injection<T = any> {
        factory?: (getter: typeof get) => T,
        name?: string;
        type?: () => any;
        token?: Token<T>;
        ctor?: Constructor<T>;
        index?: number;
    }

    interface ParameterInjection extends Injection {
        index: number;
    }

    function validateDecoratorParameters(
        target: Object,
        propertyKey: string | undefined,
        index?: number,
        arg?: unknown,
    ) {
        if (index !== undefined && typeof index != 'number') {
            throw error(`index must be a number or undefined`);
        }

        let injection: Injection = { };

        if (
            typeof target == 'function' &&
            propertyKey === undefined &&
            index !== undefined
        ) { // constructor parameter injection
            injection.index = index;
            injection.ctor = Reflect.getMetadata('design:paramtypes', target)[index];
        } else if (
            propertyKey !== undefined &&
            index === undefined
        ) {
            injection.ctor = Reflect.getMetadata('design:type', target, propertyKey);
            if (typeof target == 'function') { // static property injection
                // throw error(`TODO: static property injection`);
            } else { // member property injection
                mr<string>(MetadataKeys.PropertyName, target).add(propertyKey);
            }
        } else {
            throw error(`unsupported decorator parameters`);
        }

        if (typeof arg == 'string') {
            injection.name = arg;
        } else if (typeof arg == 'function') {
            injection.type = arg as () => any;
        } else if (arg instanceof Token) {
            injection.token = arg;
        } else if (arg != null) {
            throw error(`unkonwn argument`);
        }

        return injection;

        function error(msg: string) {
            return new TypeError([
               msg,
               `target=${target}`,
               `propertyKey=${propertyKey}`,
               `index=${index}`,
               `arg=${arg}`,
            ].join(', '))
        }
    }

    function registerInjection(
        injection: Injection,
        target: Object,
        propertyKey?: string | undefined,
    ) {
        switch (injection.ctor) {
            case Object:
            case Number:
            case String:
            case Boolean:
                injection.ctor = undefined;
                if (!(injection.factory || injection.name || injection.token || injection.type)) {
                    throw new TypeError([
                        `injection signature required for generic types`,
                        `target=${target}`,
                        `propertyKey=${propertyKey}`,
                        `constructor=${injection.ctor}`
                     ].join(', '))
                }
        }

        if (typeof target == 'function' && propertyKey) { // static property injection
            let value: any;
            let developed = false;
            Object.defineProperty(target, propertyKey, {
                get() {
                    if (!developed) {
                        value = develop(injection);
                        developed = true;
                    }
                    return value;
                },
                set(v) {
                    developed = true;
                    return value = v;
                },
            })
        } else {
            mr(MetadataKeys.Injection, target, propertyKey).add(injection);
        }
    }

    function getPropertyInjections(target: any) {
        let ret = new Map<string, Injection>();

        const properties = mr<string>(MetadataKeys.PropertyName, target).getUpChain();
        for (let property of properties) {
            const injections = mr<Injection>(MetadataKeys.Injection, target, property).get();
            switch (injections.length) {
                case 1:
                ret.set(property, injections[0]);
                break;

                case 0: throw new Error(`no injections found for ${target}::${property}`);
                default: throw new Error(`more than one injection found for ${target}::${property}`);
            }
        }

        return ret;
    }

}

class Token<T> {
    constructor(
        public name: string,
        public multiple: boolean,
    ) {

    }

    toString() {
        return this.name;
    }
}
export type TokenType<T> = Token<T>;
