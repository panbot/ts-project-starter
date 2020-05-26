import { Runnable } from "../../lib/runnable";
import { MongoEntityManager } from "typeorm";
export declare class ReadApi implements Runnable {
    entity: string;
    id: string;
    run(em: MongoEntityManager): Promise<unknown>;
}
