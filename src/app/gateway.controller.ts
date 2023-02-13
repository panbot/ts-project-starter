import { Module, Route, Api, Tokens, Inject } from "../framework";
import { ApiOptions } from "../lib/framework/api";
import { ModuleApiLookup } from "../lib/framework/lookup";
import { ModuleOptions } from "../lib/framework/module";
import { ModuleConstructor, ApiConstructor } from "../lib/framework/types";
import { RouteContext } from "./types";
import { Roles } from "./security";

export class GatewayController {

    @Inject(Tokens.EnabledModules)
    private modules: ModuleConstructor[];

    @Inject(Tokens.ModuleApiLookup)
    private lookup: ModuleApiLookup;

    @Route({
        httpMethod: 'POST',
        path: '/api/:module/:api',
        aliases: [
            '/api/:module/:api/:_',
        ],
        contentType: 'application/json',
    })
    async api({
        params: { module, api },
        body,
        userContext,
    }: RouteContext) {
        return Api.run(
            this.lookup.findApi(module, api).api,
            userContext,
            body || {},
        );
    }

    @Route({
        httpMethod: 'GET',
        path: '/api-doc',
        contentType: 'application/json',
    })
    docForAll() {
        return {
            roles: (Object.keys(Roles) as (keyof typeof Roles)[])
                .filter(v => typeof Roles[v] != 'function')
                .reduce(
                    (pv, cv) => ( pv[cv] = Roles[cv], pv ),
                    {} as any,
                ),
            apis: this.modules
                .map(m => this.describeModule(m, Module.get(m)))
                .reduce(
                    (pv, cv) => pv.concat(cv),
                    [],
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