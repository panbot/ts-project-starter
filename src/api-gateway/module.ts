import { Service } from "typedi";
import { Module } from "../framework";
import { GatewayController } from "./gateway.controller";

@Module({
    doc: `api gateway`,
    controllers: [
        GatewayController,
    ]
})
export class ApiGatewayModule {

}