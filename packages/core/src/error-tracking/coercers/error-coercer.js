"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCoercer = void 0;
var utils_1 = require("@/utils");
var ErrorCoercer = /** @class */ (function () {
    function ErrorCoercer() {
    }
    ErrorCoercer.prototype.match = function (err) {
        return (0, utils_1.isPlainError)(err);
    };
    ErrorCoercer.prototype.coerce = function (err, ctx) {
        return {
            type: this.getType(err),
            value: this.getMessage(err, ctx),
            stack: this.getStack(err),
            cause: err.cause ? ctx.next(err.cause) : undefined,
            synthetic: false,
        };
    };
    ErrorCoercer.prototype.getType = function (err) {
        return err.name || err.constructor.name;
    };
    ErrorCoercer.prototype.getMessage = function (err, _ctx) {
        var message = err.message;
        if (message.error && typeof message.error.message === 'string') {
            return String(message.error.message);
        }
        return String(message);
    };
    ErrorCoercer.prototype.getStack = function (err) {
        return err.stacktrace || err.stack || undefined;
    };
    return ErrorCoercer;
}());
exports.ErrorCoercer = ErrorCoercer;
//# sourceMappingURL=error-coercer.js.map