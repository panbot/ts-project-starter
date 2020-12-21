import Container, { Token } from "typedi";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";

export type AppParameters = {

    secret: string,

    superuser: {
        username: string,
        password: string,
    },

    fastify: {
        listen: { port: number; host?: string; backlog?: number },
    },

    ldap: any,

    mongo: {
        [ key: string ]: MongoConnectionOptions,
    },

    // auth: {
    //     captcha?: {
    //         disabled?: boolean,
    //         override?: [ string, string ],
    //     }
    // },

    // redis: {
    //     url: string,
    // },

    // dev?: boolean,

    // hundsun: {
    //     v4: {
    //         merid: string,
    //         backends: string[],
    //     },
    //     wechat: {
    //         gateway: string,
    //     },
    // },

    // cms: {
    //     gateway: string,
    //     cdn: string,
    //     token: string,
    //     preview: boolean,
    // },

    // mongo: MongoConnectionOptions,

    // mysql: {
    //     cms: MysqlConnectionOptions,
    //     app: MysqlConnectionOptions,
    //     infomatic: MysqlConnectionOptions,
    // },
}

export const ParameterToken: Token<AppParameters> = new Token<AppParameters>('app parameters');

export function InjectParam(retrieve: (p: AppParameters) => any) {
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
