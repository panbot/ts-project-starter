"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const runnable_1 = require("../../lib/runnable");
const typeorm_1 = require("typeorm");
const api_1 = require("../../core/api");
const extensions_1 = require("../../core/extensions");
const mongo_1 = require("../../services/mongo");
let QueryApi = class QueryApi {
    async run(em) {
        let skip;
        let take;
        if (this.page && this.perPage) {
            skip = this.perPage * (this.page - 1);
            take = this.perPage;
        }
        if (this.offset)
            skip = this.offset;
        if (this.limit)
            take = this.limit;
        return em.getMongoRepository(this.entity).find({
            where: this.where,
            order: this.order,
            skip,
            take,
        });
    }
};
__decorate([
    mongo_1.MongoService.MongoEntityName(),
    __metadata("design:type", String)
], QueryApi.prototype, "entity", void 0);
__decorate([
    api_1.ApiArg({
        doc: 'where',
        optional: true,
        validator: _ => true,
    }),
    __metadata("design:type", Object)
], QueryApi.prototype, "where", void 0);
__decorate([
    api_1.ApiArg({
        doc: 'order',
        optional: true,
        validator: _ => true,
    }),
    __metadata("design:type", Object)
], QueryApi.prototype, "order", void 0);
__decorate([
    api_1.ApiArg('page', true),
    __metadata("design:type", Number)
], QueryApi.prototype, "page", void 0);
__decorate([
    api_1.ApiArg('perPage', true),
    __metadata("design:type", Number)
], QueryApi.prototype, "perPage", void 0);
__decorate([
    api_1.ApiArg('page', true),
    __metadata("design:type", Number)
], QueryApi.prototype, "offset", void 0);
__decorate([
    api_1.ApiArg('page', true),
    __metadata("design:type", Number)
], QueryApi.prototype, "limit", void 0);
__decorate([
    __param(0, runnable_1.RunArg(mongo_1.MongoService)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeorm_1.MongoEntityManager]),
    __metadata("design:returntype", Promise)
], QueryApi.prototype, "run", null);
QueryApi = __decorate([
    extensions_1.CmsApi(`query entity`)
], QueryApi);
exports.QueryApi = QueryApi;
//# sourceMappingURL=query.js.map