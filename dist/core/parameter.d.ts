import { Token } from "typedi";
import * as Fastify from 'fastify';
import { UserContext } from "./auth";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
export declare type Parameters = {
    secret: string;
    fastify: {
        listen: Fastify.ListenOptions;
    };
    auth: {
        dev?: {
            [key: string]: UserContext;
        };
    };
    redis: {
        url: string;
    };
    dev?: boolean;
    mongo: MongoConnectionOptions;
    mysql: {};
};
export declare const ParameterToken: Token<Parameters>;
export declare function InjectParam(retrieve: (p: Parameters) => any): (object: any, propertyName: string, index?: number | undefined) => void;
