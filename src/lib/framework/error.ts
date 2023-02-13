import { Loggable } from "./log";

export let i18n = new Map<string, string>();
function t(msg: string) {
    return i18n.get(msg) || msg;
}

export class HttpCodedError {

    stack?: string;

    get userFriendlyMessage() { return t('something went wrong') }

    constructor(
        public message: string,
        public httpCode: number,
        extra = {},
    ) {
        Object.assign(this, extra);

        let stack = new Error().stack;
        Object.defineProperty(this, 'stack', {
            value: stack,
            enumerable: false,
        })
    }
}

export class ArgumentError extends HttpCodedError {

    get userFriendlyMessage() { return this.message }

    constructor(
        public message: string,
        public httpCode: number = 400,
        extra = {},
    ) {
        super(message, httpCode, extra)
    }
}

export class AuthenticationRequiredError extends ArgumentError {
    constructor(
        message = t('authentication required'),
        extra = {},
    ) {
        super(message, 401, extra);
    }
}

export class AccessDeniedError extends ArgumentError {
    constructor(
        message = t('insufficient permissions'),
        extra = {},
    ) {
        super(message, 403, extra);
    }
}

export class ServerTooManyRequestsError extends ArgumentError {

    constructor(
        public message = t('too many requests'),
        extra: any = {},
    ) {
        super(message, 529, extra)
    }
}

export class ClientTooManyRequestsError extends ArgumentError {
    constructor(
        public message = t('too many requests'),
        extra = {},
    ) {
        super(message, 429, extra)
    }
}

export function defaultErrorHandler(error: any) {
    let statusCode: number;
    let userFriendlyError: any;

    if (error instanceof HttpCodedError) {
        statusCode = error.httpCode;
        if (statusCode < 500) userFriendlyError = error;
        else userFriendlyError = new Error(error.userFriendlyMessage);
    } else {
        statusCode = 500;
        userFriendlyError = new Error(t('something went wrong'));
    }

    return {
        statusCode,
        userFriendlyError,
    }
}
