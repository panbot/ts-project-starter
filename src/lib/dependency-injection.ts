import 'reflect-metadata';
import { Constructor } from './types';
import mr from './metadata-registry';

export default function () {

    const MetadataKeys = {
        PropertyName: Symbol('property_name'),
        Injection: Symbol('injection'),
    }

    let instances = new Map<any, any>();
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

    function get(name: string): any;
    function get<T>(type: Constructor<T>): T;
    function get<T>(token: TokenType<T>): T;
    function get(arg: any) {
        if (typeof arg == 'function') {
            return getOrInstantiate(arg);
        } else {
            let instance = instances.get(arg);
            if (!instance) throw new Error(`instance for ${arg} not found`);
            return instance;
        }
    }

    function set(name: string, instance: any): void;
    function set<T>(type: Constructor<T>, instance: any): void;
    function set<T>(token: TokenType<T>, instance: T): void;
    function set(arg: any, instance: any) {
        instances.set(arg, instance);
    }

    function getOrInstantiate<T extends Object>(ctor: Constructor<T>) {
        let instance = instances.get(ctor);
        if (instance) {
            return instance
        } else {
            let instance: T = new ctor(
                ...mr<ParameterInjection>(MetadataKeys.Injection, ctor).get().reduce(
                    (pv, cv) => (pv[cv.index] = develop(cv), pv),
                    [] as any[],
                ));
            // immediately set() to prevent infinite loop
            instances.set(ctor, instance);

            for (let [ property, injection ] of getPropertyInjections(ctor.prototype)) {
                let value = develop(injection);
                Reflect.defineProperty(instance, property, { value });
            }

            for (let handler of eventHandlers.instantiated) {
                instance = handler(instance);
            }

            return instance;
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
        get,
        set,
        instantiate: getOrInstantiate,
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

        token: <T>(name: string): TokenType<T> => new Token<T>(name),

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
            return getOrInstantiate(injection.type());
        } else if (injection.ctor) {
            return getOrInstantiate(injection.ctor);
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
        ) { // static / member property injection
            if (typeof target == 'function') {
                throw error(`TODO: static property injection`);
            }
            injection.ctor = Reflect.getMetadata('design:type', target, propertyKey);
            mr<string>(MetadataKeys.PropertyName, target).add(propertyKey);
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
        mr(MetadataKeys.Injection, target, propertyKey).add(injection);
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
    constructor(public name: string) {

    }

    toString() {
        return this.name;
    }
}
export type TokenType<T> = Token<T>;
