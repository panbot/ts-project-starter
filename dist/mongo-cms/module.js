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
Object.defineProperty(exports, "__esModule", { value: true });
const module_1 = require("../core/module");
const read_1 = require("./apis/read");
const mongo_1 = require("../services/mongo");
const parameter_1 = require("../core/parameter");
const create_1 = require("./apis/create");
const update_1 = require("./apis/update");
const delete_1 = require("./apis/delete");
const query_1 = require("./apis/query");
let MongoCmsModule = class MongoCmsModule {
    async init() {
        await mongo_1.MongoService.createConnection(this.mongoOptions);
    }
};
__decorate([
    parameter_1.InjectParam(p => p.mongo),
    __metadata("design:type", Object)
], MongoCmsModule.prototype, "mongoOptions", void 0);
MongoCmsModule = __decorate([
    module_1.Module({
        doc: `mongo cms`,
        apis: [
            read_1.ReadApi,
            create_1.CreateApi,
            update_1.UpdateApi,
            delete_1.DeleteApi,
            query_1.QueryApi,
        ]
    })
], MongoCmsModule);
exports.MongoCmsModule = MongoCmsModule;
//# sourceMappingURL=module.js.map