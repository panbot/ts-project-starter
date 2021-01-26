import { Inject, Service } from "typedi";
import { Roles } from "../app";
import { Module, Route, Api, Tokens } from "../framework";
import { ApiOptions } from "../lib/framework/api";
import { ModuleApiLookup } from "../lib/framework/lookup";
import { ModuleOptions } from "../lib/framework/module";
import { RouteContext } from "../lib/framework/route";
import { ModuleConstructor, ApiConstructor } from "../lib/framework/types";

export class GatewayController {

    @Inject(Tokens.EnabledModules)
    private modules: ModuleConstructor[];

    @Inject(Tokens.ModuleApiLookup)
    private lookup: ModuleApiLookup;

    @Route({
        httpMethod: 'POST',
        path: '/api/:module/:api',
        contentType: 'application/json',
    })
    @Route({
        httpMethod: 'POST',
        path: '/api/:module/:api/:_',
        contentType: 'application/json',
    })
    async api({
        params: { module, api },
        body,
        userContext,
    }: RouteContext) {
        let args: { [ key: string ]: unknown };
        if (body == null) args = {};
        else args = body;
        return Api.run(
            this.lookup.findApi(module, api).api,
            userContext,
            args,
        );
    }

    @Route({
        httpMethod: 'GET',
        path: '/api-doc',
        contentType: 'application/json',
    })
    docForAll() {
        return {
            roles: Roles,
            apis: this.modules
                .map(m => this.describeModule(m, Module.get(m)))
                .reduce(
                    (pv, cv) => pv.concat(cv),
                    []
                ),
        }
    }

    @Route({
        httpMethod: 'GET',
        path: '/api-doc/:module',
        contentType: 'application/json',
    })
    docForModule({
        params,
    }: RouteContext) {
        const { module, options } = this.lookup.findModule(params.module);
        return this.describeModule(module, options);
    }

    @Route({
        httpMethod: 'GET',
        path: '/api-doc/:module/:api',
        contentType: 'application/json',
    })
    docForApi({
        params,
    }: RouteContext) {
        const { api, options } = this.lookup.findApi(params.module, params.api);
        return this.describeApi(api, options);
    }

    @Route({
        httpMethod: 'GET',
        path: '/who-am-i',
        contentType: 'application/json',
    })
    whoAmI({
        userContext,
    }: RouteContext) {
        return {
            roles: Roles.nameRoles(userContext.roles),
            userContext,
        }
    }

    private describeModule(module: ModuleConstructor, options: ModuleOptions) {
        return options
            .apis
            .map(api => Object.assign(this.describeApi(api, Api.get(api)), {
                module: module.name,
                path: [
                    'api',
                    ...[
                        module,
                        api,
                    ].map(ctor => this.lookup.namingScheme(ctor)),
                ].join('/'),
            }))
    }

    private describeApi(api: ApiConstructor, options: ApiOptions) {
        let args: any[] = [];

        for (let [ name, arg ] of options.args) {
            if (arg.necessity == 'overridden') continue;
            args.push(Object.assign({ name }, arg));
        }

        return {
            name: api.name,
            doc: options.doc,
            roles: options.roles,
            args,
        }
    }
}