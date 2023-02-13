import { WhoAmI } from "../demo/who-am-i.api";
import { Module } from "../framework";
import { GatewayController } from "./gateway.controller";

@Module({
    doc: `app`,
    controllers: [
        GatewayController,
    ],
    apis: [
        WhoAmI,
    ],
})
export class AppModule {

}