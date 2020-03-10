import { Module } from "../core/module";
import { ReadApi } from "./apis/read";
import { MongoService } from "../core/mongo";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { InjectParam } from "../core/parameter";
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
