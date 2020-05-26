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
const entity_validator_1 = require("../../lib/entity-validator");
const typedi_1 = require("typedi");
const mongo_1 = require("../../services/mongo");
const error_1 = require("../../core/error");
const extensions_1 = require("../../core/extensions");
const api_1 = require("../../core/api");
let CreateApi = class CreateApi {
    async run(em) {
        let entity = await this.mongoService.consume(this.entity, this.values, em);
        let [valid, errors] = entity_validator_1.default.validate(entity);
        if (!valid)
            throw new error_1.ArgumentJsonError({ errors });
        return await em.save(entity);
    }
};
__decorate([
    typedi_1.Inject(_ => mongo_1.MongoService),
    __metadata("design:type", mongo_1.MongoService)
], CreateApi.prototype, "mongoService", void 0);
__decorate([
    mongo_1.MongoService.MongoEntityName(),
    __metadata("design:type", String)
], CreateApi.prototype, "entity", void 0);
__decorate([
    api_1.ApiArg({
        doc: 'values',
        validator: _ => true,
    }),
    __metadata("design:type", Object)
], CreateApi.prototype, "values", void 0);
__decorate([
    __param(0, runnable_1.RunArg(mongo_1.MongoService)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeorm_1.MongoEntityManager]),
    __metadata("design:returntype", Promise)
], CreateApi.prototype, "run", null);
CreateApi = __decorate([
    extensions_1.CmsApi(`create entity`)
], CreateApi);
exports.CreateApi = CreateApi;
//# sourceMappingURL=create.js.map