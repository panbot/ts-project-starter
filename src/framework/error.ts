
export class ArgumentError {

    constructor(
        public message: string,
        public httpCode: number = 400,
        extra = {},
    ) {
        Object.assign(this, extra);
    }
}

export class AuthenticationRequiredError extends ArgumentError {
    constructor(
        message = 'authentication required',
        extra = {},
    ) {
        super(message, 401, extra);
    }
}

export class AccessDeniedError extends ArgumentError {
    constructor(
        message = 'insufficient permissions',
        extra = {},
    ) {
        super(message, 403, extra);
    }
}
