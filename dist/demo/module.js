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
const module_1 = require("../core/module");
const typedi_1 = require("typedi");
const runnable_1 = require("../lib/runnable");
const api_1 = require("../core/api");
const mongo_1 = require("../services/mongo");
const demo_entity_1 = require("./mongo-entities/demo-entity");
let DemoService = class DemoService {
    constructor() {
        this.runArgs = new WeakMap();
    }
    demoMethod() {
        console.log('inside demo method');
        return 'ret of demo method';
    }
    async produceRunArgFor(target) {
        let arg = Math.random();
        this.runArgs.set(target, arg);
        console.log(`produced ${this.runArgs.get(target)}`);
        return Promise.resolve(arg);
    }
    async releaseRunArgFor(target) {
        console.log(`released ${this.runArgs.get(target)}`);
        this.runArgs.delete(target);
    }
};
DemoService = __decorate([
    typedi_1.Service()
], DemoService);
class AnotherDemoService {
    constructor() {
        this.runArgs = new WeakMap();
    }
    async produceRunArgFor(target, factoryArg) {
        let arg = 'produced from ' + factoryArg;
        this.runArgs.set(target, arg);
        console.log(`produced ${this.runArgs.get(target)}`);
        return Promise.resolve(arg);
    }
    async releaseRunArgFor(target) {
        console.log(`released ${this.runArgs.get(target)}`);
        this.runArgs.delete(target);
    }
}
let DemoApi = class DemoApi {
    async run(runArg1, runArg2) {
        console.log(`inside demo api run`);
        console.log('runArg1:', runArg1);
        console.log('runArg2:', runArg2);
        console.log('apiArg1:', this.apiArg1);
        console.log('ret of DemoService.demoMethod: ', this.service.demoMethod());
    }
};
__decorate([
    typedi_1.Inject(_ => DemoService),
    __metadata("design:type", DemoService)
], DemoApi.prototype, "service", void 0);
__decorate([
    api_1.ApiArg('demo arg'),
    __metadata("design:type", String)
], DemoApi.prototype, "apiArg1", void 0);
__decorate([
    __param(0, runnable_1.RunArg(DemoService)),
    __param(1, runnable_1.RunArg(AnotherDemoService, 'another demo service')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], DemoApi.prototype, "run", null);
DemoApi = __decorate([
    api_1.Api({
        doc: `demo api`,
    }),
    typedi_1.Service()
], DemoApi);
let DemoModule = class DemoModule {
    async init() {
        // await MysqlService.createConnection(Object.assign({
        //     entities: [
        //         Account,
        //         Event,
        //         Inventory,
        //         MerchandiseInventory,
        //         Transaction,
        //     ],
        // }, this.connectionOptions));
        mongo_1.MongoService.registerEntities([
            demo_entity_1.DemoEntity,
        ]);
    }
};
DemoModule = __decorate([
    module_1.Module({
        doc: `demo module`,
        apis: [
            DemoApi,
        ],
    })
], DemoModule);
exports.DemoModule = DemoModule;
//# sourceMappingURL=module.js.map