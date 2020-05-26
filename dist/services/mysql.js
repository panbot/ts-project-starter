"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const error_1 = require("../core/error");
class MysqlService {
    static async createConnection(options) {
        await typeorm_1.createConnection(options);
    }
    async produceRunArgFor(_, connection) {
        return typeorm_1.getConnection(connection).manager;
    }
    async releaseRunArgFor(_) {
        return;
    }
}
exports.MysqlService = MysqlService;
class MysqlTransactionalEntityManager {
    constructor() {
        this.runArgs = new WeakMap();
    }
    upgradeEntityManager(em, runArg) {
        Object.defineProperty(em, 'isTransactionActive', {
            value: function () {
                return this.queryRunner &&
                    this.queryRunner.isTransactionActive;
            }
        });
        Object.defineProperty(em, 'translateErrorCode', {
            value: function (t) {
                runArg.translateErrorCode = Object.assign({}, runArg.translateErrorCode, t);
            }
        });
        return em;
    }
    async produceRunArgFor(runner, connection, retries = 1) {
        if (this.runArgs.has(runner))
            throw new Error('should not happen');
        const qr = typeorm_1.getConnection(connection).createQueryRunner();
        let runArg = {
            qr,
            retries,
        };
        this.runArgs.set(runner, runArg);
        return this.upgradeEntityManager(qr.manager, runArg);
    }
    async releaseRunArgFor(runner) {
        const v = this.runArgs.get(runner);
        if (v === undefined)
            throw new Error('should not happen');
        await v.qr.release();
        this.runArgs.delete(runner);
        return Promise.resolve();
    }
    async aroundRun(execute, runner) {
        const v = this.runArgs.get(runner);
        if (v === undefined)
            throw new Error('should not happen');
        const { qr, translateErrorCode, retries } = v;
        let count = 0;
        try {
            while (true) {
                await qr.startTransaction();
                try {
                    const result = await execute();
                    await qr.commitTransaction();
                    return result;
                }
                catch (e) {
                    await qr.rollbackTransaction();
                    if (e instanceof MysqlRaceCondition &&
                        ++count < retries)
                        continue;
                    throw e;
                }
            }
        }
        catch (e) {
            if (translateErrorCode) {
                let msg = translateErrorCode[e.code];
                if (msg != null)
                    throw new error_1.ArgumentJsonError(msg);
                else
                    throw e;
            }
            else {
                throw e;
            }
        }
    }
}
exports.MysqlTransactionalEntityManager = MysqlTransactionalEntityManager;
class MysqlRaceCondition extends error_1.ArgumentError {
    constructor(msg) {
        super(msg, 419);
    }
}
exports.MysqlRaceCondition = MysqlRaceCondition;
//# sourceMappingURL=mysql.js.map