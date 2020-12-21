import { Inject } from "typedi";
import { ArgumentError, Module } from "../framework";
import { Api, ApiOptions } from "../framework/api";
import { App } from "../framework/app";
import { Route } from "../framework/route";
import { ApiConstructor, ModuleConstructor, RouteContext } from "../framework/types";

export class GatewayController {

    @Inject(_ => App)
    private app: App;

    private lookup = new Map<string, {
        ctor: ModuleConstructor,
        apis: Map<string, ApiConstructor>,
    }>();

    constructor() {
        this.initLookup();
    }

    @Route({
        httpMethod: 'POST',
        route: '/api/:module/:api',
        contentType: 'application/json',
    })
    @Route({
        httpMethod: 'POST',
        route: '/api/:module/:api/:_',
        contentType: 'application/json',
    })
    run({
        params: { module, api },
        body,
        userContext,
    }: RouteContext) {
        return this.app.runApi(this.findApi(module, api), userContext, body);
    }

    @Route({
        httpMethod: 'GET',
        route: '/api-doc',
        contentType: 'application/json',
    })
    docForAll() {
        let modules: any[] = [];

        for (let ctor of this.app.loadedModules) {
            modules.push([
                ctor.name,
                this.describeModule(ctor),
            ]);
        }

        return modules
    }

    @Route({
        httpMethod: 'GET',
        route: '/api-doc/:module',
        contentType: 'application/json',
    })
    docForModule({
        params: { module },
    }: RouteContext) {
        return this.describeModule(this.findModule(module).ctor);
    }

    @Route({
        httpMethod: 'GET',
        route: '/api-doc/:module/:api',
        contentType: 'application/json',
    })
    docForApi({
        params: { module, api },
    }: RouteContext) {
        let ctor = this.findApi(module, api);
        return this.describeApi(Api.get(ctor)!);
    }

    private findModule(moduleName: string) {
        let v = this.lookup.get(moduleName);
        if (!v) throw new ArgumentError(`module "${moduleName}" not found`);
        return v;
    }

    private findApi(moduleName: string, apiName: string) {
        let v = this.findModule(moduleName);
        let api = v.apis.get(apiName);
        if (!api) throw new ArgumentError(`api "${apiName}" not found`);

        return api
    }

    private describeModule(ctor: ModuleConstructor) {
        return Module.get(ctor)!.apis.map(ctor => this.describeApi(Api.get(ctor)!))
    }

    private describeApi(options: ApiOptions) {
        let args: any[] = [];

        for (let [ name, arg ] of options.args) {
            args.push({
                name,
                doc: arg.doc,
                type: arg.inputype,
            })
        }

        return {
            doc: options.doc,
            args,
        }
    }

    private initLookup() {
        for (let ctor of this.app.loadedModules) {
            let name = ctor.name;
            let apis = new Map<string, ApiConstructor>();
            this.lookup.set(name, { ctor, apis });

            for (let apiCtor of Module.get(ctor)?.apis || []) {
                let name = apiCtor.name;
                apis.set(name, apiCtor);
                name = name.replace(/Api$/, '');
                apis.set(name, apiCtor);
            }
        }
    }
}
