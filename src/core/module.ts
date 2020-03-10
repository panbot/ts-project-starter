import { Service } from "typedi";
import { ArgumentError } from "./error";
import { ApiType, ApiService } from "./api";

export type ModuleType = new (...args: any[]) => {
    init?: () => Promise<void>,
}

export type ModuleOptions = {
    doc: string,
    name: string,
    apis: ApiType[],
    controllers: any[],
}

export function Module(options: {
    doc: string,
    name?: string,
    apis?: ApiType[],
    controllers?: any,
}) {
    return function (Module: ModuleType) {
        ModuleService.register(Module, {
            doc: options.doc,
            name: Module.name.replace(/module$/i, ''),
            apis: options.apis || [],
            controllers: options.controllers || [],
        });
    }
}

@Service()
export class ModuleService {

    initModuleApis() {
        const { registry, apis } = ModuleService;
        for (let [ Module, options ] of registry) {
            let map = new Map<string, ApiType>();
            for (let Api of options.apis) {
                const apiOption = ApiService.registry.get(Api);
                if (apiOption === undefined) throw new Error(
                    `${Api.name} is not registered, is it missing the @ApApi() decoration?`
                );

                map.set(apiOption.name, Api);
            }
            apis.set(Module, map)
        }
    }

    getApi(module: string, api: string) {
        const { names, apis } = ModuleService;

        const Module = names.get(module);
        if (Module === undefined) throw new ArgumentError(`module "${module}" not found`);

        const moduleApis = apis.get(Module);
        if (moduleApis === undefined) throw new Error(`call ModuleService.initModuleApis() first`);

        const Api = moduleApis.get(api);
        if (Api === undefined) throw new ArgumentError(`api "${api}" not found in "${module}"`);

        return Api;
    }

    static registry = new Map<ModuleType, ModuleOptions>();
    static names = new Map<string, ModuleType>();
    static apis = new Map<ModuleType, Map<string, ApiType>>()

    static register(Module: ModuleType, options: ModuleOptions) {
        const { names, registry } = ModuleService;

        registry.set(Module, options);

        const ExistingModule = names.get(options.name);
        if (ExistingModule !== undefined) throw new Error(
            `modules name "${options.name}" conflict between ` +
            `"${ExistingModule.name}" and "${Module.name}"`
        );
        names.set(options.name, Module);
    }

}
