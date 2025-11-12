"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMExceptionCoercer = void 0;
var utils_1 = require("@/utils");
var DOMExceptionCoercer = /** @class */ (function () {
    function DOMExceptionCoercer() {
    }
    DOMExceptionCoercer.prototype.match = function (err) {
        return this.isDOMException(err) || this.isDOMError(err);
    };
    DOMExceptionCoercer.prototype.coerce = function (err, ctx) {
        var hasStack = (0, utils_1.isString)(err.stack);
        return {
            type: this.getType(err),
            value: this.getValue(err),
            stack: hasStack ? err.stack : undefined,
            cause: err.cause ? ctx.next(err.cause) : undefined,
            synthetic: false,
        };
    };
    DOMExceptionCoercer.prototype.getType = function (candidate) {
        return this.isDOMError(candidate) ? 'DOMError' : 'DOMException';
    };
    DOMExceptionCoercer.prototype.getValue = function (err) {
        var name = err.name || (this.isDOMError(err) ? 'DOMError' : 'DOMException');
        var message = err.message ? "".concat(name, ": ").concat(err.message) : name;
        return message;
    };
    DOMExceptionCoercer.prototype.isDOMException = function (err) {
        return (0, utils_1.isBuiltin)(err, 'DOMException');
    };
    DOMExceptionCoercer.prototype.isDOMError = function (err) {
        return (0, utils_1.isBuiltin)(err, 'DOMError');
    };
    return DOMExceptionCoercer;
}());
exports.DOMExceptionCoercer = DOMExceptionCoercer;
//# sourceMappingURL=dom-exception-coercer.js.map