import { LogLevel } from "./lib/framework/log";
import { Anonymous } from "./lib/framework/roles";
import { UserContextBase } from "./lib/framework/types";
import RolesFactory from './lib/framework/roles';

export const Roles = RolesFactory({
    // roles for your awesome project

});

export class UserContext implements UserContextBase {

    roles: number = Anonymous;

    constructor(data?: any) {
        Object.assign(this, data);
    }

    // user context properties for your awesome project
    uid?: string;
}

export type AppParameters = {

    dev: boolean,

    logLevel: LogLevel,

    secret: string,

    fastify: {
        listen: { port: number; host?: string; backlog?: number },
    },

}
