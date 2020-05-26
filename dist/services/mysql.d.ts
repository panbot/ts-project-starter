import { EntityManager, ConnectionOptions } from 'typeorm';
import { RunArgFactory, Runnable } from "../lib/runnable";
import { ArgumentError } from '../core/error';
export declare class MysqlService implements RunArgFactory<EntityManager> {
    static createConnection(options: ConnectionOptions): Promise<void>;
    produceRunArgFor(_: Runnable, connection: string): Promise<EntityManager>;
    releaseRunArgFor(_: Runnable): Promise<void>;
}
declare type TranslateErrorCode = {
    [key: string]: string;
};
export interface TransactionalEntityManager extends EntityManager {
    isTransactionActive(): boolean;
    translateErrorCode: (t: TranslateErrorCode) => void;
}
export declare class MysqlTransactionalEntityManager implements RunArgFactory<TransactionalEntityManager> {
    private upgradeEntityManager;
    private runArgs;
    produceRunArgFor(runner: Runnable, connection: string, retries?: number): Promise<TransactionalEntityManager>;
    releaseRunArgFor(runner: Runnable): Promise<void>;
    aroundRun(execute: () => Promise<any>, runner: Runnable): Promise<any>;
}
export declare class MysqlRaceCondition extends ArgumentError {
    constructor(msg: string);
}
export {};
