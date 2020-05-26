import { Runnable } from "../../lib/runnable";
import { MongoEntityManager } from "typeorm";
export declare class CreateApi implements Runnable {
    private mongoService;
    entity: string;
    values: Object;
    run(em: MongoEntityManager): Promise<Object>;
}
