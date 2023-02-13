import { DataSource } from "typeorm";
import { AppParameters } from "../app/parameter";
import { ApiArg, ArgumentError, Inject, InjectParam, Tokens } from "../framework";
import { Loggable } from "../lib/framework/log";
import { ApiArgOptions } from "../lib/framework/types";
import { RunArgFactory, Runnable } from "../lib/runnable";
import shutdown from "../lib/shutdown";
import { Constructor } from "../lib/types";
import mr from '../lib/metadata-registry';
import { ObjectId } from "mongodb";

export class MongoService implements RunArgFactory {

    @Inject(Tokens.Logger)
    private logger: Loggable;

    @InjectParam(p => p.mongodb)
    private config: AppParameters['mongodb'];

    async init(dsn: string, entities: MongoService.EntityConstructor[]) {
        if (MongoService.dataSources.has(dsn)) throw new Error(`"${dsn}" already initialized`);

        MongoService.registerEntities(dsn, entities);

        const options = this.config.connection;
        const database = this.config.databases[dsn];

        if (!database) throw new Error(`mongo dsn "${dsn}" not configured`);

        let ds = new DataSource({
            synchronize: false,
            migrationsRun: false,
            database,
            ...options,
            type: 'mongodb',
            entities,
        });

        MongoService.dataSources.set(dsn, ds);

        await ds.initialize();

        this.logger.info(`mongo database "${database}" connected`)

        shutdown.register(async() => {
            try {
                await ds.destroy();
                this.logger.info(`mongo database "${database}" disconnected`)
            } catch (e) {
                this.logger.warn(e);
            }
        });
    }


    async produceRunArgFor(
        r: Runnable<unknown>,
        dsn?: string,
    ) {
        if (!dsn) dsn = MongoService.EntityClassApiArg.get(r).dsn;

        const ds = MongoService.dataSources.get(dsn);
        if (!ds) throw new Error(`mongo dsn "${dsn}" not found`);

        return ds.mongoManager;
    }

    async releaseRunArgFor(r: Runnable<unknown>) {

    }
}

export namespace MongoService {

    export type EntityConstructor = Constructor<any>;

    export let dataSources = new Map<string, DataSource>();

    export const EntityId = ObjectId;
    export function EntityIdApiArg(options?: Partial<ApiArgOptions>) {
        return ApiArg({
            doc: `entity id`,
            inputype: 'string',
            parser(this: Runnable, v: any) {
                if (v == null) throw new ArgumentError(`invalid value`);

                return new ObjectId(v);
            },

            ...options,
        })
    }

    export const EntityClassApiArg = Object.assign(
        function(options?: Partial<ApiArgOptions>) {
            return function (proto: Runnable, propertyName: string) {
                let registry = mr<string>(EntityClassApiArg, proto);
                if (registry.get().length > 1) throw new Error(
                    `more than 1 EntityClassApiArg registered for ${proto.constructor.name}`
                );

                registry.add(propertyName);

                ApiArg({
                    doc: 'entity class name',
                    inputype: 'string',
                    parser: v => {
                        if (typeof v != 'string') throw new ArgumentError(`string expected`);
                        return QualifiedEntityName.parse(v).entityClass;
                    },

                    ...options,
                })(proto, propertyName)
            }
        },
        {
            get(r: Runnable) {
                let registry = mr<string>(EntityClassApiArg, r);
                let propertyName = registry.get()[0];
                if (!propertyName) throw new Error(
                    `EntityClassApiArg not registered for ${r.constructor.name}`
                );

                let qen = e2d.get((r as any)[propertyName]);
                if (!qen) throw new Error(
                    `the value of ${r.constructor.name}::${propertyName} is not a registered entity class`
                )

                return qen;
            },
        }
    );

    let d2e = new Map<string, Map<string, EntityConstructor>>();
    let e2d = new Map<EntityConstructor, QualifiedEntityName>();

    export function registerEntities(dsn: string, entities: EntityConstructor[]) {
        let map = d2e.get(dsn);
        if (!map) {
            map = new Map<string, EntityConstructor>();
            d2e.set(dsn, map);
        }
        for (let entityClass of entities) {
            map.set(entityClass.name, entityClass);
            e2d.set(entityClass, new QualifiedEntityName(dsn, entityClass));
        }
    }

    export class QualifiedEntityName {
        constructor(
            public dsn: string,
            public entityClass: EntityConstructor,
        ) { }

        stringify() {
            return this.dsn + '.' + this.entityClass.name;
        }

        static parse(v: string) {
            let [ dsn, entityName ] = v.split('.');
            if (!entityName) throw new ArgumentError(
                `the value must be in the format of <dsn>.<entity>`,
            );

            let entities = d2e.get(dsn);
            if (!entities) throw new ArgumentError(`database "${dsn}" not found`);

            let entityClass = entities.get(entityName);
            if (!entityClass) throw new ArgumentError(
                `entity "${entityName}" not found in "${dsn}"`,
                404,
            );

            return new QualifiedEntityName(dsn, entityClass);
        }
    }

    export function getQualifiedEntityName(entityClass: EntityConstructor) {
        let qen = e2d.get(entityClass);
        if (!qen) throw new ArgumentError(
            `entity "${entityClass.name}" is not registered in any database`,
        );

        return qen
    }

    export function getAllQualifiedEntityNames() {
        return [ ...e2d.values() ]
    }
}
