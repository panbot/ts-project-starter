
export class HttpCodedError {

    stack?: string;

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

    constructor(
        public message: string,
        public httpCode: number = 400,
        extra = {},
    ) {
        super(message, httpCode, extra)
    }
}

export class AuthenticationRequiredError extends HttpCodedError {
    constructor(
        message = 'authentication required',
        extra = {},
    ) {
        super(message, 401, extra);
    }
}

export class AccessDeniedError extends HttpCodedError {
    constructor(
        message = 'insufficient permissions',
        extra = {},
    ) {
        super(message, 403, extra);
    }
}

export class ServerTooManyRequestsError extends HttpCodedError {
    constructor(
        public message = 'too many requests',
        extra = {},
    ) {
        super(message, 529, extra)
    }
}

export class ClientTooManyRequestsError extends HttpCodedError {
    constructor(
        public message = 'too many requests',
        extra = {},
    ) {
        super(message, 429, extra)
    }
}
