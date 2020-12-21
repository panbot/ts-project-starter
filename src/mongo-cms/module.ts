import { Module } from "../framework/module";
import { ReadApi } from "./apis/read";
import { MongoService } from "../services/mongo";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { InjectParam } from "../framework/parameter";
import { CreateApi } from "./apis/create";
import { UpdateApi } from "./apis/update";
import { DeleteApi } from "./apis/delete";
import { QueryApi } from "./apis/query";

@Module({
    doc: `mongo cms`,
    apis: [
        ReadApi,
        CreateApi,
        UpdateApi,
        DeleteApi,
        QueryApi,
    ]
})
export class MongoCmsModule {

    @InjectParam(p => p.mongo)
    mongoOptions: MongoConnectionOptions;

    async init() {
        await MongoService.createConnection(this.mongoOptions);
    }
}
