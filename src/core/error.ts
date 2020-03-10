
export class ArgumentJsonError {
    constructor(
        public clientJson: any,
        public httpCode: number = 400,
    ) {
    }
}

export class ArgumentError extends ArgumentJsonError {

    message: string;

    constructor(
        message: string,
        httpCode: number = 400,
    ) {
        super(
            { message },
            httpCode,
        );

        this.message = message;
    }
}

export class AccessDeniedError extends ArgumentError {
    constructor(
        message: string,
    ) {
        super(message, 403);
    }
}