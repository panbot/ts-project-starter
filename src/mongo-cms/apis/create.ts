import { Runnable, RunArg } from "../../lib/runnable";
import { MongoEntityManager } from "typeorm";
import EV from '../../lib/entity-validator';
import { Inject } from "typedi";
import { MongoService } from "../../services/mongo";
import { ArgumentJsonError } from "../../framework/error";
import { CmsApi } from "../../framework/extensions";
import { ApiArg } from "../../framework/api";

@CmsApi(`create entity`)
export class CreateApi implements Runnable {

    @Inject(_ => MongoService)
    private mongoService: MongoService;

    @MongoService.MongoEntityName()
    entity: string;

    @ApiArg({
        doc: 'values',
        validator: _ => true,
    })
    values: Object;

    async run(
        @RunArg(MongoService) em: MongoEntityManager,
    ) {
        let entity = await this.mongoService.consume(this.entity, this.values, em);

        let [ valid, errors ] = EV.validate(entity);
        if (!valid) throw new ArgumentJsonError({ errors });

        return await em.save(entity);
    }
}
