import { Runnable } from "../../lib/runnable";
import { MongoEntityManager } from "typeorm";
export declare class UpdateApi implements Runnable {
    private mongoService;
    entity: string;
    id: string;
    values: Object;
    run(em: MongoEntityManager): Promise<Object>;
}
