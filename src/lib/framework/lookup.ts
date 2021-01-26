import { ApiOptions } from "./api";
import { ArgumentError } from "./error";
import { ModuleOptions } from "./module";
import { ModuleConstructor, ApiConstructor } from "./types"
import ModuleFactory from './module';
import ApiFactory from './api';

export class ModuleApiLookup {

    private lookup = new Map<string, {
        module: ModuleConstructor,
        options: ModuleOptions,
        apis: Map<string, {
            api: ApiConstructor,
            options: ApiOptions,
        }>,
    }>();

    constructor(
        Module: ReturnType<typeof ModuleFactory>,
        Api: ReturnType<typeof ApiFactory>,
        public namingScheme = (ctor: ModuleConstructor | ApiConstructor) => {
            return ctor.name.replace(/(:?Module|Api)$/, '')
        },
    ) {
        for (let [ module, options ] of Module.registry) {
            let apis = new Map<string, {
                api: ApiConstructor,
                options: ApiOptions,
            }>();
            this.lookup.set(this.namingScheme(module), { module, options, apis });

            for (let api of options.apis) {
                const options = Api.get(api);
                apis.set(this.namingScheme(api), { api, options });
            }
        }
    }

    findModule(moduleName: string) {
        let item = this.lookup.get(moduleName);
        if (!item) throw new ArgumentError(`module "${moduleName}" not found`, 404);

        return item;
    }

    findApi(moduleName: string, apiName: string) {
        let { apis } = this.findModule(moduleName);

        let item = apis.get(apiName);
        if (!item) throw new ArgumentError(`api "${moduleName}/${apiName}" not found`, 404);

        return item;
    }
}