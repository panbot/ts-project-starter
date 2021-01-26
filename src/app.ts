import { LogLevel } from "./lib/framework/log";
import { Anonymous } from "./lib/framework/roles";
import { UserContextBase } from "./lib/framework/types";
import RolesFactory from './lib/framework/roles';

export const Roles = RolesFactory({
    // your roles here

});

export class UserContext implements UserContextBase {

    roles: number = Anonymous;

    constructor(data?: any) {
        Object.assign(this, data);
    }
}

export type AppParameters = {

    logLevel: LogLevel,

    secret: string,

    fastify: {
        listen: { port: number; host?: string; backlog?: number },
    },

}
