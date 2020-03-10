import { Runnable, RunArg } from "../../lib/runnable";
import { MongoEntityManager } from "typeorm";
import { MongoService } from "../../core/mongo";
import { CmsApi, ApiArg } from "../../core/api";

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
