import { Inject } from "typedi";
import { ArgumentError, Module } from "../framework";
import { App } from "../framework/app";
import { Route } from "../framework/route";
import { ApiConstructor, RouteContext } from "../framework/types";

export class GatewayController {

    @Inject(_ => App)
    private app: App;

    private lookup = new Map<string, Map<string, ApiConstructor>>();

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
        let map = this.lookup.get(module);
        if (!map) throw new ArgumentError(`module "${module}" not found`);
        let apiCtor = map.get(api);
        if (!apiCtor) throw new ArgumentError(`api "${api}" not found`);

        return this.app.runApi(apiCtor, userContext, body);
    }

    @Route({
        httpMethod: 'GET',
        route: '/api-doc',
        contentType: 'application/json',
    })
    docForAllApis() {

    }

    @Route({
        httpMethod: 'GET',
        route: '/api-doc/:module',
        contentType: 'application/json',
    })
    docForModule({
        params: { module },
    }: RouteContext) {

    }

    @Route({
        httpMethod: 'GET',
        route: '/api-doc/:module/:api',
        contentType: 'application/json',
    })
    docForApi({

    }: RouteContext) {

    }

    private initLookup() {
        for (let moduleCtor of this.app.loadedModules) {
            let name = moduleCtor.name;
            let apis = new Map<string, ApiConstructor>();
            this.lookup.set(name, apis);

            for (let apiCtor of Module.get(moduleCtor)?.apis || []) {
                let name = apiCtor.name;
                apis.set(name, apiCtor);
                name = name.replace(/Api$/, '');
                apis.set(name, apiCtor);
            }
        }
    }
}
