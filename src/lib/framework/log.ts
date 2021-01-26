export enum LogLevel {
    DEBUG = -1,
    INFO = 0,
    WARN = 1,
    CRIT = 2,
    SILENCE = 3,
}

type LogFunction = (data: any) => void;
export type Loggable = Record<'debug' | 'info' | 'warn' | 'crit' | 'log', LogFunction>;

export default function loggerFactory(logLevel: LogLevel, loggers: Loggable[]): Loggable {

    let noLog = () => {};

    let debug: LogFunction;
    let info: LogFunction;
    let warn: LogFunction;
    let crit: LogFunction;

    if (logLevel > LogLevel.DEBUG) debug = noLog;
    else debug = (data: any) => loggers.forEach(logger => logger.debug(data));

    if (logLevel > LogLevel.INFO) info = noLog;
    else info = (data: any) => loggers.forEach(logger => logger.info(data))

    if (logLevel > LogLevel.WARN) warn = noLog;
    else warn = (data: any) => loggers.forEach(logger => logger.warn(data))

    if (logLevel > LogLevel.CRIT) crit = noLog;
    else crit = (data: any) => loggers.forEach(logger => logger.crit(data))

    return {
        debug,
        info,
        warn,
        crit,
        log: (data: any) => loggers.forEach(logger => logger.log(data)),
    }
}

export class ConsoleLogger implements Loggable {

    debug(data: any) {
        console.info(new Date().toLocaleString());
        console.log(data);
    }

    info(data: any) {
        console.info(new Date().toLocaleString());
        console.info(data);
    }

    warn(data: any) {
        console.warn(new Date().toLocaleString());
        console.warn(data);
    }

    crit(data: any) {
        console.error(new Date().toLocaleString());
        console.error(data);
    }

    log(data: any) {
        console.log(new Date().toLocaleString());
        console.log(data);
    }
}
