import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
export declare class MongoCmsModule {
    mongoOptions: MongoConnectionOptions;
    init(): Promise<void>;
}
