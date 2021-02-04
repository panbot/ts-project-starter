import { RunArgFactory, Runnable } from "../lib/runnable";
import { MongoEntityManager, ConnectionOptions, createConnection, getConnection } from "typeorm";
import { ArgumentError } from "../lib/framework/error";
import shutdown from "../lib/shutdown";
import * as mongodb from 'mongodb';
import { ApiArg, ApiArgValidatable } from "../framework";

export class MongoService implements RunArgFactory<MongoEntityManager> {

    async produceRunArgFor(runnable: Runnable, database?: string) {
        if (!database) {
            let propertyName = MongoEntityClassProperties.get(runnable.constructor);
            if (!propertyName) throw new Error(
                `cannot determine database for ${runnable.constructor.name}, ` +
                `is it missing the @ApiMongoEntityClassArg() annotation?`
            );

            let v = (runnable as any)[propertyName];
            if (typeof v == 'string') {
                database = MongoService.parseQualifiedEntityName(v)[0];
            } else if (typeof v == 'function') {
                database = MongoService.e2d.get(v);
            }
        }

        if (!database) throw new Error(
            `cannot determine database for ${runnable.constructor.name}`
        );

        return (await getConnection(database)).mongoManager;
    }

    async releaseRunArgFor(runnable: Runnable) {
        // (async () => await this.connections.get(runnable)?.close())().catch(e => console.error(e));
    }

    getConnection(database: string) {
        return getConnection(database)
    }

    static parseQualifiedEntityName(v: string): [ string, Function ] {
        let [ database, entityName ] = v.split('.');
        if (!entityName) throw new ArgumentError(
            `the value must be in the format of <database>.<entity>`,
        );

        let entities = this.d2e.get(database);
        if (!entities) throw new ArgumentError(`database "${database}" not found`);

        let entityClass = entities.get(entityName);
        if (!entityClass) throw new ArgumentError(
            `entity "${entityName}" not found in "${database}"`,
            404,
        );

        return [ database, entityClass ];
    }

    static getQualifiedEntityName(entityClass: Function) {
        let database = this.e2d.get(entityClass);
        if (!database) throw new ArgumentError(
            `entity "${entityClass.name}" is not registered in any database`,
        );

        return database + '.' + entityClass.name;
    }


    static d2e = new Map<string, Map<string, Function>>();
    static e2d = new Map<Function, string>();

    private static registerEntities(database: string, entities: Function[]) {
        let map = this.d2e.get(database);
        if (!map) {
            map = new Map<string, Function>();
            this.d2e.set(database, map);
        }
        for (let entityClass of entities) {
            map.set(entityClass.name, entityClass);
            this.e2d.set(entityClass, database);
        }
    }

    static async createConnection(options: ConnectionOptions, entities: Function[]) {
        let name = options.name;
        if (!name) throw new Error(`name required`);

        this.registerEntities(name, entities);

        let connection = await createConnection(Object.assign({
            type: "mongodb",
            entities,
        }, options));

        console.info(`mongodb database "${options.database}" connected`)
        shutdown.register(async () => {
            try {
                await connection.close();
                console.info(`mongodb database "${options.database}" disconnected`)
            } catch (e) {
                console.error(e);
            }
        });
    }
}

let MongoEntityClassProperties = new Map<Function, string>();
export function ApiMongoEntityClassArg(doc = 'entity class') {
    return function (proto: Runnable, propertyName: string) {
        MongoEntityClassProperties.set(proto.constructor, propertyName);
        ApiArg({
            doc,
            parser: v => {
                let entityClass: Function;
                if (typeof v == 'string') {
                    [ , entityClass ] = MongoService.parseQualifiedEntityName(v);
                } else if (typeof v == 'function') {
                    entityClass = v;
                } else {
                    throw new ArgumentError(`type error`);
                }

                return entityClass;
            },
        })(proto, propertyName);
    }
}

export const MongoEntityId = mongodb.ObjectID;
export type MongoEntityId = mongodb.ObjectID;

ApiArgValidatable({
    inputype: 'string',
    parser: (v: string) => new MongoEntityId(v),
})(MongoEntityId);
