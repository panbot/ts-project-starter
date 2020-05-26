import { ApiType } from "./api";
export declare type ModuleType = new (...args: any[]) => {
    init?: () => Promise<void>;
};
export declare type ModuleOptions = {
    doc: string;
    name: string;
    apis: ApiType[];
    controllers: any[];
};
export declare function Module(options: {
    doc: string;
    name?: string;
    apis?: ApiType[];
    controllers?: any;
}): (Module: ModuleType) => void;
export declare class ModuleService {
    initModuleApis(): void;
    getApi(module: string, api: string): ApiType;
    static registry: Map<ModuleType, ModuleOptions>;
    static names: Map<string, ModuleType>;
    static apis: Map<ModuleType, Map<string, ApiType>>;
    static register(Module: ModuleType, options: ModuleOptions): void;
}
