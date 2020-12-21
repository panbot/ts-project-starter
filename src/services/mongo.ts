import { RunArgFactory, Runnable } from "../lib/runnable";
import { MongoEntityManager, EntityMetadata, getConnectionManager, Connection } from "typeorm";
import { Service } from "typedi";
import { ApiArg, ApiType } from "../framework/api";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { InjectParam } from "../parameter";
import { ArgumentError } from "../framework/error";
import shutdown from "../lib/shutdown";

@Service()
export class MongoService implements RunArgFactory<MongoEntityManager> {

    @InjectParam(p => p.mongo)
    private connectionOptions: {
        [ key: string ]: MongoConnectionOptions,
    };

    make(
        entityOrClass: Object | Function,
        data: Object,
        em: MongoEntityManager,
    ) {
        let metadata: EntityMetadata;
        let entity: any;
        if (typeof entityOrClass == 'function') {
            entity = em.create(entityOrClass, data);
            metadata = em.connection.getMetadata(entityOrClass);
        } else {
            entity = Object.assign(entityOrClass, em.create(entityOrClass.constructor, data));
            metadata = em.connection.getMetadata(entityOrClass.constructor);
        }

        for (let column of metadata.nonVirtualColumns) {
            let p = column.propertyName;
            if (p == metadata.objectIdColumn?.propertyName) continue;

            let v = data[p];
            if (v === undefined) continue;

            switch (column.type) {
                case Date:
                entity[p] = new column.type(v);
                break;

                case 'string':
                case String:
                entity[p] = `${v}`;
                break;

                case Number:
                case 'number':
                entity[p] = parseFloat(v);
                break;

                case Boolean:
                case 'boolean':
                entity[p] = !!v;
                break;

                default:
                entity[p] = v;
            }
        }

        return entity;
    }

    async produceRunArgFor(runnable: Runnable, database?: string) {
        if (!database) {
            let propertyName = MongoEntityClassProperties.get(runnable.constructor);
            if (!propertyName) throw new Error(
                `cannot determine database for ${runnable.constructor.name}, ` +
                `is it missing the @ApiMongoEntityClassArg() annotation?`
            );

            let v = runnable[propertyName];
            if (typeof v == 'string') {
                database = MongoService.parseQualifiedEntityName(v)[0];
            } else if (typeof v == 'function') {
                database = MongoService.e2d.get(v);
            }
        }

        if (!database) throw new Error(
            `cannot determine database for ${runnable.constructor.name}`
        );

        return (await this.getConnection(database)).mongoManager;
    }

    async releaseRunArgFor(runnable: Runnable) {
        // (async () => await this.connections.get(runnable)?.close())().catch(e => console.error(e));
    }

    private connectionManager = getConnectionManager();
    private connectionInit = new WeakMap<Connection, Promise<Connection>>();
    async getConnection(database: string) {
        if (!this.connectionManager.has(database)) {
            let options = this.connectionOptions[database];
            if (!options) throw new Error(`connection options for "${database}" not found`);

            let entities = MongoService.d2e.get(database);
            if (!entities) throw new Error(`no entities registered for "${database}"`);

            let connection = this.connectionManager.create(Object.assign(options, {
                name: database,
                type: "mongodb",
                entities: [ ...entities.values() ],
            }));

            let resolve;
            let promise = new Promise<Connection>(r => resolve = r);
            this.connectionInit.set(connection, promise);
            await connection.connect();
            console.info(`mongo database "${database}" connected`)
            shutdown.register(async () => {
                await connection.close();
                console.info(`mongo database "${database}" disconnected`)
            });
            resolve(connection);
            this.connectionInit.delete(connection);

            return connection;
        }

        let connection = this.connectionManager.get(database);
        let init = this.connectionInit.get(connection);
        if (init) return await init;
        else return connection;
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

    static registerEntities(database: string, entityClasses: Function[]) {
        let entities = this.d2e.get(database);
        if (!entities) {
            entities = new Map<string, Function>();
            this.d2e.set(database, entities);
        }
        for (let entityClass of entityClasses) {
            entities.set(entityClass.name, entityClass);
            this.e2d.set(entityClass, database);
        }
    }

}

let MongoEntityClassProperties = new Map<Function, string>();
export function ApiMongoEntityClassArg(doc = 'entity class') {
    return function (proto: InstanceType<ApiType>, propertyName: string) {
        MongoEntityClassProperties.set(proto.constructor, propertyName);
        ApiArg({
            doc,
            parser: (v, api) => {
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

export function ApiMongoEntityIdArg(doc = 'entity id') {
    return ApiArg({
        doc,
        validator: (v: unknown) => typeof v == 'string' && /^[0-9a-f]{24}$/.test(v),
    })
}

export function ApiMongoEntityDataArg(doc = 'entity data') {
    return function (proto: InstanceType<ApiType>, propertyName: string) {
        ApiArg({
            doc,
            parser: (v, api) => {
                if (typeof v != 'object' || v == null) throw new ArgumentError(
                    `object expected`,
                );

                return v;
            },
        })(proto, propertyName)
    }
}
