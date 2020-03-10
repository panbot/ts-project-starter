import * as Fastify from 'fastify';
import { InjectParam } from './parameter';
import { randomBytes } from 'crypto';
import Container, { Inject } from 'typedi';
import { ModuleService, ModuleType } from './module';
import { run } from './connectors';
import { UserContext, AuthService } from './auth';
import { ApiService } from './api';
import { ApRouteService } from './route';

export class App {

    @InjectParam(p => p.fastify.listen)
    private fastifyOptions: Fastify.ListenOptions;

    private Modules: ModuleType[];

    @Inject(_ => ModuleService)
    private moduleService: ModuleService;

    @Inject(_ => ApiService)
    private apiService: ApiService;

    @Inject(_ => ApRouteService)
    private routeService: ApRouteService;

    @Inject(_ => AuthService)
    private authService: AuthService;

    async loadModules(Modules: ModuleType[]) {
        this.Modules = Modules;
        this.moduleService.initModuleApis();

        for (let Module of this.Modules) {
            if (!Module.prototype.init) continue;

            let module = Container.get(Module);
            await module.init!();
        }
    }

    async run(
        module: string,
        api: string,
        userContext: UserContext,
        args: Object,
    ) {
        const Api = this.moduleService.getApi(module, api);

        const { options } = this.apiService.get(Api);
        this.authService.assertRoles(options!.roles, userContext.roles);

        let runnable = Object.create(Container.get(Api));
        runnable.userContext = userContext;

        Object.assign(runnable, this.apiService.validateAll(Api, args));

        return run(runnable);
    }

    startFastify() {
        let fastify = Fastify({
            genReqId: () => randomBytes(16).toString('hex'),
        } as Fastify.ServerOptionsAsHttp);

        fastify.listen(
            this.fastifyOptions,
            (err, address) => {
                if (err) throw err;
                console.log(`fastify listening on ${address}`);
            },
        );

        for (let Module of this.Modules) {
            let moduleOptions = ModuleService.registry.get(Module);
            if (moduleOptions === undefined) throw new Error(
                `"${Module.name}" is loaded but not registered, ` +
                `is it missing the @ApModule() decoration?`
            );

            for (let Controller of moduleOptions.controllers) {
                let routes = ApRouteService.registry.get(Controller);
                if (routes === undefined) throw new Error(
                    `no routes found for "${Controller.name}", ` +
                    `is it missing the @ApRoute() decoration?`
                );

                for (let options of routes) {
                    const {
                        Controller,
                        methodName,
                        httpMethod: method,
                        route: url,
                    } = options;

                    fastify.route({
                        method,
                        url,
                        handler: this.routeService.createHandler(
                            options,
                            ctx => Container.get(Controller)[methodName](ctx),
                        ),
                    });
                }
            }
        }
    }


}