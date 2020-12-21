// import { Module } from "../framework/module";
import { Module } from "../framework";
import { GatewayController } from "./gateway.controller";

@Module({
    doc: `api gateway`,
    apis: [
    ],
    controllers: [
        GatewayController,
    ],
})
export class ApiGatewayModule {

}