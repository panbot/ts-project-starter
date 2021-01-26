import { Inject } from "typedi";
import { MongoEntityManager } from "typeorm";
import { ShiChangYanPanResearch } from "../antfin/entity/shi-chang-yan-pan";
import { Superuser } from "../lib/framework/security";
import { RunArg, Runnable } from "../lib/runnable";
import { EntityQueryService } from "../services/entity-query";
import { MongoService } from "../services/mongo";

export default class implements Runnable {

    @Inject(_ => EntityQueryService)
    entityQueryService: EntityQueryService;

    async run(
        @RunArg(MongoService, 'antfin') em: MongoEntityManager,
    ) {
        return await this.entityQueryService.query(
            ShiChangYanPanResearch,
            {
                where: {
                    board: "A股中盘",
                    market: "国内股票",
                    date: {
                        $lt: new Date(2021, 0, 1),
                    },
                },
                order: {
                    date: -1,
                },
            },
            {
                roles: Superuser,
            },
            em,
        );
    }
}
