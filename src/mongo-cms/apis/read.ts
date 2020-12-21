import { Runnable, RunArg } from "../../lib/runnable";
import { MongoEntityManager } from "typeorm";
import { CmsApi } from "../../framework/extensions";
import { MongoService } from "../../services/mongo";
import { ApiArg } from "../../framework/api";

@CmsApi(`read entity`)
export class ReadApi implements Runnable {

    @MongoService.MongoEntityName()
    entity: string;

    @ApiArg(`id`)
    id: string;

    async run(
        @RunArg(MongoService) em: MongoEntityManager,
    ) {
        return em.getMongoRepository(this.entity).findOne(this.id);
    }
}
