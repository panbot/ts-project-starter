import './bootstrap';

import shutdown from './lib/shutdown';
import { Runnable } from './lib/runnable';
import { Inject, InjectParam, Module, Route, Tokens } from './framework';
import { Loggable } from './lib/framework/log';
import { Controller, ModuleConstructor } from './lib/framework/types';
import { Constructor } from './lib/types';
import fastify, { FastifyRequest } from "fastify";
import { deserialize } from "bson";
import { UserContext } from './app';
import { FastifyHandlerFactory } from './lib/framework/route-fastify';

export default class implements Runnable {

    @InjectParam(p => p.fastify.listen)
    listen: any;

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
            new FastifyHandlerFactory(
                server,
                (...args) => this.createUserContext(...args),
                this.logger,
            ),
        );

        server.listen(
            this.listen,
            (err, address) => {
                if (err) { this.logger.crit(err); return }

                this.logger.info('fastify listening on', address);

                shutdown.register(() => server.close(() => this.logger.info('fastify closed')));
            },
        );
    }

    createUserContext (
        request: FastifyRequest,
        logger: Loggable,
        token: string | undefined,
    ) {
        let uc = new UserContext();

        if (!token) return uc;

        let [ scheme, payload ] = token.split(' ', 2);

        let parse = this.authSchemes[scheme];
        if (!parse) {
            logger.debug(`invalid auth scheme "${scheme}"`);
            return uc;
        }

        try {
            Object.assign(uc, parse(payload))
        } catch (e) {
            logger.debug(`failed to parse auth token`, e);
        }

        return uc;
    }
}
