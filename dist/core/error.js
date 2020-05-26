"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ArgumentJsonError {
    constructor(clientJson, httpCode = 400) {
        this.clientJson = clientJson;
        this.httpCode = httpCode;
    }
}
exports.ArgumentJsonError = ArgumentJsonError;
class ArgumentError extends ArgumentJsonError {
    constructor(message, httpCode = 400) {
        super({ message }, httpCode);
        this.message = message;
    }
}
exports.ArgumentError = ArgumentError;
class AccessDeniedError extends ArgumentError {
    constructor(message) {
        super(message, 403);
    }
}
exports.AccessDeniedError = AccessDeniedError;
//# sourceMappingURL=error.js.map