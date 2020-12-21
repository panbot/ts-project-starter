import { fastify } from 'fastify';
import { InjectParam } from '../parameter';
import Container, { Inject } from 'typedi';
import { run } from './connectors';
import { Roles, UserContext } from './security';
import { deserialize } from 'bson';
import shutdown from '../lib/shutdown';
import { ApiConstructor, ModuleConstructor } from './types';
import { Module } from './module';
import { Route } from './route';
import { Api } from './api';
import { ArgumentError } from './error';

export class App {

    @InjectParam(p => p.fastify.listen)
    private fastifyOptions: { port: number; host?: string; backlog?: number };

    // private Modules: ModuleType[];
    loadedModules: ModuleConstructor[] = [];

    private controllers = new Set<Function>();

    // @Inject(_ => ModuleService)
    // private moduleService: ModuleService;

    // @Inject(_ => ApRouteService)
    // private routeService: ApRouteService;

    // @Inject(_ => SecurityService)
    // private securityService: SecurityService;

    loadModules(modules: ModuleConstructor[]) {
        this.loadedModules = this.loadedModules.concat(modules);
        for (let ctor of modules) {
            let opts = Module.get(ctor);
            if (!opts) throw new Error(
                `Options for module ${ctor.name} not found. ` +
                `Is it missing the @Module() decoration?`
            );

            for (let ctl of opts.controllers) this.controllers.add(ctl);
        }
        // this.Modules = Modules;
        // this.moduleService.initModuleApis();
    }

    async initModules() {
        for (let ctor of Module.resolveDependencies()) {
            let module = Container.get(ctor);
            if (module.init) await module.init!();
        }
    }

    // async run(
    //     moduleName: string,
    //     apiName: string,
    //     userContext: UserContext,
    //     args: Object,
    // ) {
    //     const Api = this.moduleService.getApi(module, api);
    //     return this.runApi(Api, userContext, args);
    // }

    async runApi(
        ctor: ApiConstructor,
        userContext: UserContext,
        args: Object,
    ) {
        if (!Api.has(ctor)) throw new ArgumentError(`api "${ctor.name} not found`);
        const opts = Api.get(ctor)!;
        Roles.assertRoles(opts.roles, userContext.roles);

        let runnable = Object.create(Container.get(ctor));
        if (opts.userContextProperty !== undefined) {
            runnable[opts.userContextProperty] = userContext;
        }
        Object.assign(runnable, opts.validateAll(runnable, args));

        return run(runnable);
    }

    startServer = () => new Promise<void>((resolve, reject) => {
        let server = fastify();

        server.register(require('fastify-cors'), {
            maxAge: 3600,
        });

        server.addContentTypeParser(
            'application/bson',
            { parseAs: 'string' },
            (_, body, done) => {
                try {
                    done(null, deserialize(Buffer.from(body as string, 'base64')))
                } catch (e) {
                    done(e)
                }
            },
        );

        for (let options of Route.routes) {
            const {
                Controller,
                methodName,
                httpMethod: method,
                route: url,
            } = options;

            if (!this.controllers.has(Controller)) continue;

            server.route({
                method,
                url,
                handler: Route.createHandler(
                    options,
                    ctx => Container.get(Controller)[methodName](ctx),
                ),
            });
        }

        server.listen(
            this.fastifyOptions,
            (err, address) => {
                if (err) return reject(err);

                console.info(`fastify listening on ${address}`);

                shutdown.register(() => server.close(() => console.info('fastify closed')));

                resolve()
            },
        );
    });

}