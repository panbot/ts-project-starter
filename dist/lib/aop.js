"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const metadataKeys = {
    proxy: Symbol('aop metadata proxy'),
};
exports.default = (instantiate, register) => {
    const Before = (Advisor) => (prototype, propertyName) => advice(prototype, propertyName, (execution, target, args) => (instantiate(Advisor).beforePointcut(target, propertyName, args),
        execution()));
    const After = (Advisor) => (prototype, propertyName) => advice(prototype, propertyName, (execution, target, args) => instantiate(Advisor).afterPointcut(execution(), target, propertyName, args));
    const Around = (Advisor) => (prototype, propertyName) => advice(prototype, propertyName, (execution, target, args) => instantiate(Advisor).aroundPointcut(execution, target, propertyName, args));
    return { Before, After, Around };
    function advice(prototype, propertyName, advice) {
        if ('function' != typeof prototype[propertyName])
            throw new Error(`${prototype.constructor.name}.${propertyName} is not a function`);
        let target;
        if (Reflect.hasMetadata(metadataKeys.proxy, prototype)) {
            target = Reflect.getMetadata(metadataKeys.proxy, prototype);
        }
        else {
            target = instantiate(prototype.constructor);
        }
        let proxy = Object.create(target);
        Object.defineProperty(proxy, propertyName, {
            value: (...args) => advice(() => target[propertyName].apply(target, args), target, args),
        });
        Reflect.defineMetadata(metadataKeys.proxy, proxy, prototype);
        register(proxy);
    }
};
//# sourceMappingURL=aop.js.map