"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorEventCoercer = void 0;
var utils_1 = require("@/utils");
var ErrorEventCoercer = /** @class */ (function () {
    function ErrorEventCoercer() {
    }
    ErrorEventCoercer.prototype.match = function (err) {
        return (0, utils_1.isErrorEvent)(err) && err.error != undefined;
    };
    ErrorEventCoercer.prototype.coerce = function (err, ctx) {
        var _a;
        var exceptionLike = ctx.apply(err.error);
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
    };
    return ErrorEventCoercer;
}());
exports.ErrorEventCoercer = ErrorEventCoercer;
//# sourceMappingURL=error-event-coercer.js.map