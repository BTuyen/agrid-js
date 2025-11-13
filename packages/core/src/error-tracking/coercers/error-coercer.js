"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCoercer = void 0;
const utils_1 = require("@/utils");
class ErrorCoercer {
    match(err) {
        return (0, utils_1.isPlainError)(err);
    }
    coerce(err, ctx) {
        return {
            type: this.getType(err),
            value: this.getMessage(err, ctx),
            stack: this.getStack(err),
            cause: err.cause ? ctx.next(err.cause) : undefined,
            synthetic: false,
        };
    }
    getType(err) {
        return err.name || err.constructor.name;
    }
    getMessage(err, _ctx) {
        const message = err.message;
        if (message.error && typeof message.error.message === 'string') {
            return String(message.error.message);
        }
        return String(message);
    }
    getStack(err) {
        return err.stacktrace || err.stack || undefined;
    }
}
exports.ErrorCoercer = ErrorCoercer;
//# sourceMappingURL=error-coercer.js.map