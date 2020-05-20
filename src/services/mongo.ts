import { RunArgFactory, Runnable } from "../lib/runnable";
import { MongoEntityManager, getConnection, createConnection, EntityMetadata } from "typeorm";
import { Service } from "typedi";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { ApiArg } from "./api";
import { ArgumentError } from "./error";

@Service()
export class MongoService implements RunArgFactory<MongoEntityManager> {

    consume(entity: string | Function | Object, values: Object, em: MongoEntityManager) {
        let metadata: EntityMetadata;
        if (typeof entity == 'string' || typeof entity == 'function') {
            metadata = em.connection.getMetadata(entity);
            entity = em.getRepository(metadata.target).create() as Object;
        } else {
            metadata = em.connection.getMetadata(entity.constructor);
        }

        for (let column of metadata.nonVirtualColumns) {
            let p = column.propertyName;
            let v = values[p];
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

    async produceRunArgFor(_: Runnable) {
        return getConnection(MongoService.connectionName).mongoManager;
    }

    async releaseRunArgFor(_: Runnable) {
    }

    private static connectionName: string;
    private static entities: any[] = [];
    private static entityNames = new Set<string>();

    static async createConnection(options: MongoConnectionOptions) {
        const name = options.name;
        if (name === undefined) throw new Error(`name is required`);
        MongoService.connectionName = name;
        await createConnection(Object.assign(options, {
            entities: MongoService.entities,
        }));
    }

    static registerEntities(entities: any[]) {
        MongoService.entities.push(...entities);
       for (let entity of entities) {
            MongoService.entities.push(entity);
            MongoService.entityNames.add(entity.name);
       }
    }

    static hasEntity(name: string) {
        return MongoService.entityNames.has(name);
    }

    static MongoEntityName(doc = 'mongo entity name') {
        return ApiArg({
            doc,
            parser: (v: unknown) => {
                if (typeof v == 'string') {
                    if (!MongoService.hasEntity(v)) {
                        throw new ArgumentError(`mongo entity "${v}" not found`, 404);
                    }
                    return v;
                } else {
                    throw new ArgumentError(`string expected`);
                }
            }
        })
    }
}
