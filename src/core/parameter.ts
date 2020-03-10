import Container, { Token } from "typedi"
import * as Fastify from 'fastify';
import { UserContext } from "./auth";
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";

export type Parameters = {

    secret: string,

    fastify: {
        listen: Fastify.ListenOptions,
    },

    auth: {
        dev?: { [ key: string ]: UserContext },
    },

    redis: {
        url: string,
    },

    dev?: boolean,

    mongo: MongoConnectionOptions,

    mysql: {
        // dbname: MysqlConnectionOptions,
    },

}

export const ParameterToken = new Token<Parameters>('Parameters');

export function InjectParam(retrieve: (p: Parameters) => any) {
    return function (
        object: any,
        propertyName: string,
        index?: number,
    ) {
        Container.registerHandler({
            object,
            propertyName,
            index,
            value: container => retrieve(container.get(ParameterToken))
        })
    }
}
