import './bootstrap';

import shutdown from './lib/shutdown';
import { Runnable } from './lib/runnable';
import { Inject, InjectParam, Module, Route, Tokens } from './framework';
import { Loggable } from './lib/framework/log';
import { JWT } from './lib/jwt';
import { Controller, ModuleConstructor } from './lib/framework/types';
import { Constructor } from './lib/types';
import fastify from "fastify";
import { deserialize } from "bson";
import { UserContext } from './app';

export default class implements Runnable {

    @InjectParam(p => p.fastify.listen)
    listen: any;

    @Inject(Tokens.Jwt)
    jwt: JWT;

    @Inject(Tokens.Logger)
    logger: Loggable;

    @Inject(Tokens.EnabledModules)
    modules: ModuleConstructor[];

    @Inject(Tokens.AuthSchemes)
    authSchemes: Record<string, (payload: string) => any>;

    get controllers() {
        return this.modules.reduce(
            (pv, cv) => pv.concat(Module.get(cv).controllers),
            [] as Constructor<Controller>[],
        );
    }

    async run() {
        shutdown.listen();

        await Module.initModules(this.modules);

        let server = fastify();

        server.register(require('fastify-cors'), {
            maxAge: 3600,
            origin: true,
            credentials: true,
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

        Route.addRoutes(
            this.controllers,
            server,
            v => new UserContext(v),
            this.authSchemes,
            this.logger,
        );

        server.listen(
            this.listen,
            (err, address) => {
                if (err) { console.error(err); return }

                console.info(`fastify listening on ${address}`);

                shutdown.register(() => server.close(() => console.info('fastify closed')));
            },
        );
    }
}
