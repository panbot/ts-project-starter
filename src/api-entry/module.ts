import { Module } from "../core/module";
import { ApiController } from "./controller";

@Module({
    doc: `api routes and etc.`,
    controllers: [
        ApiController,
    ]
})
export class ApiEntryModule {

}
