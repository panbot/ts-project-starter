import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { LogLevel } from "../lib/framework/log";

export type AppParameters = {

    dev: boolean,

    logLevel: LogLevel,

    secret: string,

    fastify: {
        listen: { port: number; host?: string; backlog?: number },
    },

    mongodb: {
        connection: MongoConnectionOptions,
        databases: Record<string, string>,
    },

}
