import { Runnable, RunArg } from "../../lib/runnable";
import { MongoEntityManager } from "typeorm";
import { ApiArg } from "../../framework/api";
import { CmsApi } from "../../framework/extensions";
import { MongoService } from "../../services/mongo";

@CmsApi(`query entity`)
export class QueryApi implements Runnable {

    @MongoService.MongoEntityName()
    entity: string;

    @ApiArg({
        doc: 'where',
        optional: true,
        validator: _ => true,
    })
    where: Object;

    @ApiArg({
        doc: 'order',
        optional: true,
        validator: _ => true,
    })
    order: Object;

    @ApiArg('page', true)
    page: number;

    @ApiArg('perPage', true)
    perPage: number;

    @ApiArg('page', true)
    offset: number;

    @ApiArg('page', true)
    limit: number;

    async run(
        @RunArg(MongoService) em: MongoEntityManager,
    ) {
        let skip: number | undefined;
        let take: number | undefined;
        if (this.page && this.perPage) {
            skip = this.perPage * (this.page - 1);
            take = this.perPage;
        }

        if (this.offset) skip = this.offset;
        if (this.limit) take = this.limit;

        return em.getMongoRepository(this.entity).find({
            where: this.where,
            order: this.order,
            skip,
            take,
        });
    }
}
