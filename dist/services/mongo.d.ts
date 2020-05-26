import { RunArgFactory, Runnable } from "../lib/runnable";
import { MongoEntityManager } from "typeorm";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
export declare class MongoService implements RunArgFactory<MongoEntityManager> {
    consume(entity: string | Function | Object, values: Object, em: MongoEntityManager): Object;
    produceRunArgFor(_: Runnable): Promise<MongoEntityManager>;
    releaseRunArgFor(_: Runnable): Promise<void>;
    private static connectionName;
    private static entities;
    private static entityNames;
    static createConnection(options: MongoConnectionOptions): Promise<void>;
    static registerEntities(entities: any[]): void;
    static hasEntity(name: string): boolean;
    static MongoEntityName(doc?: string): (proto: Runnable<any>, propertyName: string) => void;
}
