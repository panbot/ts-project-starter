"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MongoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const typedi_1 = require("typedi");
const api_1 = require("../core/api");
const error_1 = require("../core/error");
let MongoService = MongoService_1 = class MongoService {
    consume(entity, values, em) {
        let metadata;
        if (typeof entity == 'string' || typeof entity == 'function') {
            metadata = em.connection.getMetadata(entity);
            entity = em.getRepository(metadata.target).create();
        }
        else {
            metadata = em.connection.getMetadata(entity.constructor);
        }
        for (let column of metadata.nonVirtualColumns) {
            let p = column.propertyName;
            let v = values[p];
            if (v === undefined)
                continue;
            switch (column.type) {
                case Date:
                    entity[p] = new column.type(v);
                    break;
                case 'string':
                case String:
                    entity[p] = `${v}`;
                    break;
                case Number:
                case 'number':
                    entity[p] = parseFloat(v);
                    break;
                case Boolean:
                case 'boolean':
                    entity[p] = !!v;
                    break;
                default:
                    entity[p] = v;
            }
        }
        return entity;
    }
    async produceRunArgFor(_) {
        return typeorm_1.getConnection(MongoService_1.connectionName).mongoManager;
    }
    async releaseRunArgFor(_) {
    }
    static async createConnection(options) {
        const name = options.name;
        if (name === undefined)
            throw new Error(`name is required`);
        MongoService_1.connectionName = name;
        await typeorm_1.createConnection(Object.assign(options, {
            entities: MongoService_1.entities,
        }));
    }
    static registerEntities(entities) {
        MongoService_1.entities.push(...entities);
        for (let entity of entities) {
            MongoService_1.entities.push(entity);
            MongoService_1.entityNames.add(entity.name);
        }
    }
    static hasEntity(name) {
        return MongoService_1.entityNames.has(name);
    }
    static MongoEntityName(doc = 'mongo entity name') {
        return api_1.ApiArg({
            doc,
            parser: (v) => {
                if (typeof v == 'string') {
                    if (!MongoService_1.hasEntity(v)) {
                        throw new error_1.ArgumentError(`mongo entity "${v}" not found`, 404);
                    }
                    return v;
                }
                else {
                    throw new error_1.ArgumentError(`string expected`);
                }
            }
        });
    }
};
MongoService.entities = [];
MongoService.entityNames = new Set();
MongoService = MongoService_1 = __decorate([
    typedi_1.Service()
], MongoService);
exports.MongoService = MongoService;
//# sourceMappingURL=mongo.js.map