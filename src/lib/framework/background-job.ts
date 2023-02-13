import CreateRun, { Runnable } from '../runnable';
import { Constructor, Instantiator } from "../types";
import { createRegistryDecorator as crd } from "./decorator";
import { Loggable } from './log';

export class BackgroundJobOptions {
    name: string;
    intervalInSeconds: number;
}

export default function(
    instantiate: Instantiator,
) {
    const run = CreateRun(instantiate);

    const registry = crd<Constructor<Runnable>,
                         BackgroundJobOptions,
                         BackgroundJobOptions>(() => new BackgroundJobOptions());

    let loaded = new Map<Constructor<Runnable>, any>();

    function start(
        job: Constructor<Runnable>,
        logger: Loggable,
    ) {
        let opts = registry.get(job);
        logger.info(`background job ${opts.name} started`);

        next();

        async function next() {
            try {
                await run(instantiate(job));
            } catch (e) {
                logger.warn(opts.name, e);
            }

            setTimeout(next, opts.intervalInSeconds * 1000);
        }
    }

    return Object.assign(registry, {
        load: (
            jobs: Constructor<Runnable>[]
        ) => jobs.forEach(j => loaded.set(j, {})),

        start: (
            logger: Loggable,
        ) => [ ...loaded.keys() ].forEach(j => start(j, logger)),
    })
}
