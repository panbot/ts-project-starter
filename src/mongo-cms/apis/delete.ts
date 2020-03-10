import { Runnable, RunArg } from "../../lib/runnable";
import { MongoEntityManager } from "typeorm";
import { MongoService } from "../../core/mongo";
import { CmsApi, ApiArg } from "../../core/api";

@CmsApi(`delete entity`)
export class DeleteApi implements Runnable {

    @MongoService.MongoEntityName()
    entity: string;

    @ApiArg(`id`)
    id: string;

    async run(
        @RunArg(MongoService) em: MongoEntityManager,
    ) {
        await em.getRepository(this.entity).delete(this.id);
    }
}
