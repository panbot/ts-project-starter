import { EntityManager, getConnection, QueryRunner, ConnectionOptions, createConnection } from 'typeorm';
import { RunArgFactory, Runnable } from "../lib/runnable";
import { ArgumentJsonError, ArgumentError } from '../core/error';

export class MysqlService
implements RunArgFactory<EntityManager> {

    static async createConnection(options: ConnectionOptions) {
        await createConnection(options);
    }

    async produceRunArgFor(_: Runnable, connection: string) {
        return getConnection(connection).manager;
    }

    async releaseRunArgFor(_: Runnable) {
        return;
    }
}

type TranslateErrorCode = { [ key: string ]: string };

export interface TransactionalEntityManager extends EntityManager {
    isTransactionActive(): boolean;
    translateErrorCode: (t: TranslateErrorCode) => void,
}

export class MysqlTransactionalEntityManager
implements RunArgFactory<TransactionalEntityManager> {

    private upgradeEntityManager(
        em: EntityManager,
        runArg: {
            retries: number,
            translateErrorCode?: TranslateErrorCode,
            qr: QueryRunner,
        },
    ) {
        Object.defineProperty(em, 'isTransactionActive', {
            value: function () {
                return this.queryRunner &&
                    this.queryRunner.isTransactionActive
                ;
            }
        });
        Object.defineProperty(em, 'translateErrorCode', {
            value: function (t: TranslateErrorCode) {
                runArg.translateErrorCode = Object.assign(
                    {},
                    runArg.translateErrorCode,
                    t,
                );
            }
        })
        return em as TransactionalEntityManager;
    }

    private runArgs = new WeakMap<any, {
        retries: number,
        translateErrorCode?: TranslateErrorCode,
        qr: QueryRunner,
    }>();

    async produceRunArgFor(
        runner: Runnable,
        connection: string,
        retries = 1,
    ) {
        if (this.runArgs.has(runner)) throw new Error('should not happen');
        const qr = getConnection(connection).createQueryRunner();
        let runArg = {
            qr,
            retries,
        }
        this.runArgs.set(runner, runArg);
        return this.upgradeEntityManager(qr.manager, runArg);
    }

    async releaseRunArgFor(runner: Runnable) {
        const v = this.runArgs.get(runner);
        if (v === undefined) throw new Error('should not happen');

        await v.qr.release();
        this.runArgs.delete(runner);

        return Promise.resolve();
    }

    async aroundRun(execute: () => Promise<any>, runner: Runnable) {
        const v = this.runArgs.get(runner);
        if (v === undefined) throw new Error('should not happen');
        const { qr, translateErrorCode, retries } = v;

        let count = 0;

        try {
            while (true) {
                await qr.startTransaction();
                try {
                    const result = await execute();
                    await qr.commitTransaction();
                    return result;
                } catch (e) {
                    await qr.rollbackTransaction();
                    if (
                        e instanceof MysqlRaceCondition &&
                        ++count < retries
                    ) continue;

                    throw e;
                }
            }
        } catch (e) {
            if (translateErrorCode) {
                let msg = translateErrorCode[e.code]
                if (msg != null) throw new ArgumentJsonError(msg)
                else throw e;
            } else {
                throw e;
            }
        }
    }
}

export class MysqlRaceCondition extends ArgumentError {
    constructor(msg: string) {
        super(msg, 419);
    }
}
