import { Roles } from "./auth";
import { Runnable } from "../lib/runnable";
export declare type ApiType = new (...args: any[]) => Runnable;
export declare type ApiOptions = {
    doc: string;
    name: string;
    roles: Roles;
    userContextProperty?: string;
};
export declare type ApiArgValidatableOptions = {
    inputype: string;
    parser: (v: unknown, api?: InstanceType<ApiType>) => any;
    validator: (v: unknown, api?: InstanceType<ApiType>) => boolean | Promise<boolean>;
};
export declare type ApiArgOptions = {
    doc: string;
    optional: boolean;
} & ApiArgValidatableOptions;
export declare function Api({ doc, name, roles }: {
    doc: string;
    name?: string;
    roles?: Roles;
}): (Api: ApiType) => void;
export declare function ApiArg(optionsOrDoc: Partial<ApiArgOptions> | string, optional?: boolean): (proto: Runnable<any>, propertyName: string) => void;
export declare function ApiArgInteger(options: {
    doc: string;
    optional?: boolean;
    range?: [number, number];
}): (proto: Runnable<any>, propertyName: string) => void;
export declare function ApiArgArrayOf(Type: any, options: {
    doc: string;
    optional?: boolean;
}): (proto: Runnable<any>, propertyName: string) => void;
export declare function ApiUserContextArg(): (proto: Runnable<any>, propertyName: string) => void;
export declare class ApiService {
    get(Api: ApiType): {
        options: ApiOptions;
        args: Map<string, ApiArgOptions> | undefined;
    };
    validate(Api: ApiType, api: InstanceType<ApiType>, propertyName: string, value: unknown): Promise<void>;
    validateAll(Api: ApiType, api: InstanceType<ApiType>, values: Object): Promise<any>;
    private validateByOptions;
    static apis: Map<ApiType, ApiOptions>;
    static args: Map<ApiType, Map<string, ApiArgOptions>>;
    static getOrInitArgMapFor(proto: InstanceType<ApiType>): Map<string, ApiArgOptions>;
    static validatables: Map<any, Partial<ApiArgValidatableOptions>>;
}
export declare function ApiArgValidatable(options: Partial<ApiArgValidatableOptions>): (Type: any) => void;
