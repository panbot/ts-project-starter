import { Runnable } from "../../lib/runnable";
import { MongoEntityManager } from "typeorm";
export declare class QueryApi implements Runnable {
    entity: string;
    where: Object;
    order: Object;
    page: number;
    perPage: number;
    offset: number;
    limit: number;
    run(em: MongoEntityManager): Promise<unknown[]>;
}
