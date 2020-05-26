import { Runnable, RunArg } from "../../lib/runnable";
import { MongoEntityManager } from "typeorm";
import EV from '../../lib/entity-validator';
import { Inject } from "typedi";
import { ArgumentError, ArgumentJsonError } from "../../core/error";
import { CmsApi } from "../../core/extensions";
import { MongoService } from "../../services/mongo";
import { ApiArg } from "../../core/api";

@CmsApi(`update entity`)
export class UpdateApi implements Runnable {

    @Inject(_ => MongoService)
    private mongoService: MongoService;

    @MongoService.MongoEntityName()
    entity: string;

    @ApiArg(`object id`)
    id: string;

    @ApiArg({
        doc: 'values',
        validator: _ => true,
    })
    values: Object;

    async run(
        @RunArg(MongoService) em: MongoEntityManager,
    ) {
        let entity: Object;
        try {
            entity = await em.getMongoRepository(this.entity).findOne(this.id) as Object;
        } catch (e) {
            throw new ArgumentError(e.message);
        }
        if (!entity) throw new ArgumentError(`"${this.id}" not found`);

        this.mongoService.consume(entity, this.values, em);

        let [ valid, errors ] = EV.validate(entity);
        if (!valid) throw new ArgumentJsonError({ errors });

        return await em.save(entity);
    }
}
