"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorEventCoercer = void 0;
const utils_1 = require("@/utils");
class ErrorEventCoercer {
    constructor() { }
    match(err) {
        return (0, utils_1.isErrorEvent)(err) && err.error != undefined;
    }
    coerce(err, ctx) {
        var _a;
        const exceptionLike = ctx.apply(err.error);
        if (!exceptionLike) {
            return {
                type: 'ErrorEvent',
                value: err.message,
                stack: (_a = ctx.syntheticException) === null || _a === void 0 ? void 0 : _a.stack,
                synthetic: true,
            };
        }
        else {
            return exceptionLike;
        }
    }
}
exports.ErrorEventCoercer = ErrorEventCoercer;
//# sourceMappingURL=error-event-coercer.js.map