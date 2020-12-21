import { createRegistryDecorator } from "./decorator";
import { ApiConstructor, ControllerConstructor, ModuleConstructor } from "./types";

export class ModuleOptions {
    doc: string = '';
    apis: ApiConstructor[] = [];
    controllers: ControllerConstructor[] = [];
    dependencies: () => ModuleConstructor[] = () => [];
}

export const Module = Object.assign(
    createRegistryDecorator<ModuleConstructor, ModuleOptions>(
        () => new ModuleOptions(),
    ),
    {
        resolveDependencies(ctor?: ModuleConstructor) {
            let visited = new Set<ModuleConstructor>();
            let ret: ModuleConstructor[] = [];

            if (!ctor) {
                for (let ctor of Module.registry.keys()) visit(ctor, new Set<ModuleConstructor>());
            } else {
                visit(ctor, new Set<ModuleConstructor>());
            }

            return ret;

            function visit(ctor: ModuleConstructor, path: Set<ModuleConstructor>) {
                if (visited.has(ctor)) return;

                if (path.has(ctor)) throw new Error(
                    `circular dependency found, ` + [ ...path, ctor ].map(v => v.name).join(' -> ')
                );
                path.add(ctor);

                if (!Module.has(ctor)) throw new Error(`module "${ctor.name}" not found`);
                for (let dep of Module.get(ctor)!.dependencies()) visit(dep, new Set<ModuleConstructor>([ ...path ]));

                ret.push(ctor);
                visited.add(ctor);
            }
        }
    }
);

// import { Constructor } from "../lib/types";
// import { Runnable as RunnableApi } from "../lib/runnable";
// import { Roles } from "./security";

// export type ModuleConstructor = Constructor<{ init?: () => Promise<void> }>;

// export type ApiConstructor = Constructor<RunnableApi>;

// export class ModuleOptions {
//     doc: string = '';
//     apis: ApiConstructor[] = [];
//     controllers: Constructor<{}>[] = [];
//     dependencies: ModuleConstructor[] = [];
// }

// let modules = new DecoratorRegistry<ModuleConstructor, ModuleOptions>(
//     () => new ModuleOptions(),
// );

// export const Module = modules.decorator();

// export type ApiValidatableArgOptions = {
//     inputype: string,
//     parser: (v: unknown, api: RunnableApi) => any,
//     validator: (v: unknown, api: RunnableApi) => string | undefined,
// }

// export type ApiArgOptions = {
//     doc: string,
//     optional: boolean,
// } & ApiValidatableArgOptions;

// export class ApiOptions {
//     doc: string = '';
//     // name: string;
//     roles: Roles = Roles.Anonymous;
//     userContextProperty?: string;
//     args = new Map<string, ApiArgOptions>();
// }

// let apis = new DecoratorRegistry<ApiConstructor, ApiOptions>(
//     () => new ApiOptions(),
// );

// export const Api = apis.decorator();

// export function ApiArg(options: Partial<ApiArgOptions>) {
//     return function (proto: RunnableApi, propertyName: string) {
//         const Type = Reflect.getMetadata('design:type', proto, propertyName);

//         // if (!options.parser && !options.validator) {
//         //     const validatable = ApiService.validatables.get(Type);
//         //     if (
//         //         validatable === undefined
//         //     ) throw new Error(`${Type.name} is not validatable`);

//         //     Object.assign(options, validatable);
//         // }

//         apis.getOptions(proto.constructor as ApiConstructor).args.set(propertyName, Object.assign({
//             doc: '',
//             optional: false,
//             inputype: `${Type.name}`.toLowerCase(),
//             validator: _ => true,
//             parser: v => v,
//         }, options));
//     }
// }

// // export type ModuleType = new (...args: any[]) => {
// //     init?: () => Promise<void>,
// // }

// // export type ModuleOptions = {
// //     doc: string,
// //     name: string,
// //     apis: ApiType[],
// //     controllers: any[],
// // }

// // export function Module(options: {
// //     doc: string,
// //     name?: string,
// //     apis?: ApiType[],
// //     controllers?: any,
// // }) {
// //     return function (Module: ModuleType) {
// //         ModuleService.register(Module, {
// //             doc: options.doc,
// //             name: Module.name.replace(/module$/i, ''),
// //             apis: options.apis || [],
// //             controllers: options.controllers || [],
// //         });
// //     }
// // }

// // @Service()
// // export class ModuleService {

// //     initModuleApis() {
// //         const { registry, apis } = ModuleService;
// //         for (let [ Module, options ] of registry) {
// //             let map = new Map<string, ApiType>();
// //             for (let Api of options.apis) {
// //                 const apiOption = ApiService.apis.get(Api);
// //                 if (apiOption === undefined) throw new Error(
// //                     `${Api.name} is not registered, is it missing the @Api() decoration?`
// //                 );

// //                 map.set(apiOption.name, Api);
// //             }
// //             apis.set(Module, map)
// //         }
// //     }

// //     getApi(module: string, api: string) {
// //         const { names, apis } = ModuleService;

// //         const Module = names.get(module);
// //         if (Module === undefined) throw new ArgumentError(`module "${module}" not found`);

// //         const moduleApis = apis.get(Module);
// //         if (moduleApis === undefined) throw new Error(`call ModuleService.initModuleApis() first`);

// //         const Api = moduleApis.get(api);
// //         if (Api === undefined) throw new ArgumentError(`api "${api}" not found in module "${module}"`);

// //         return Api;
// //     }

// //     static registry = new Map<ModuleType, ModuleOptions>();
// //     static names = new Map<string, ModuleType>();
// //     static apis = new Map<ModuleType, Map<string, ApiType>>();

// //     static register(Module: ModuleType, options: ModuleOptions) {
// //         this.registry.set(Module, options);

// //         const ExistingModule = this.names.get(options.name);
// //         if (ExistingModule !== undefined) throw new Error(
// //             `modules name "${options.name}" conflict between ` +
// //             `"${ExistingModule.name}" and "${Module.name}"`
// //         );
// //         this.names.set(options.name, Module);
// //     }

// // }
