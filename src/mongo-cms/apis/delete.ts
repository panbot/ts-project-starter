import { Runnable, RunArg } from "../../lib/runnable";
import { MongoEntityManager } from "typeorm";
import { MongoService } from "../../services/mongo";
import { ApiArg } from "../../framework/api";
import { CmsApi } from "../../framework/extensions";

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
