import { Api, Inject, Memoize, Tokens } from "../framework";
import { Loggable } from "../lib/framework/log";
import { Runnable } from "../lib/runnable";

@Api({
    doc: `Demoing memoization`,
})
export class DemoMemoize implements Runnable {

    @Inject(Tokens.Logger)
    private logger: Loggable;

    async run() {
        return {
            expensiveData: await this.getExpensiveData(),
            expensiveDataWithAutoUpdate: await this.getExpensiveDataWithAutoUpdate(),
        }
    }

    @Memoize(5)
    private async getExpensiveData() {
        const generatedAt = new Date();
        let msg = `DemoMemoize::getExpensiveData() @ ${generatedAt}`;
        this.logger.debug(msg);
        let log: string[] = Reflect.getMetadata('log', this.getExpensiveData);
        if (!log) {
            log = [];
            Reflect.defineMetadata('log', log, this.getExpensiveData);
        }
        log.push(msg);
        if (log.length > 10) log.splice(0, log.length - 9, '...');
        return {
            log,
            data: Math.random(),
        }
    }

    @Memoize(5, true)
    private async getExpensiveDataWithAutoUpdate() {
        const generatedAt = new Date();
        let msg = `DemoMemoize::getExpensiveDataWithAutoUpdate() @ ${generatedAt}`;
        this.logger.debug(msg);
        let log: string[] = Reflect.getMetadata('log', this.getExpensiveDataWithAutoUpdate);
        if (!log) {
            log = [];
            Reflect.defineMetadata('log', log, this.getExpensiveDataWithAutoUpdate);
        }
        log.push(msg);
        if (log.length > 10) log.splice(0, log.length - 9, '...');
        return {
            log,
            data: Math.random(),
        }
    }
}