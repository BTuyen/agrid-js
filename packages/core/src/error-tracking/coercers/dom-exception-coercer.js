"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMExceptionCoercer = void 0;
const utils_1 = require("@/utils");
class DOMExceptionCoercer {
    match(err) {
        return this.isDOMException(err) || this.isDOMError(err);
    }
    coerce(err, ctx) {
        const hasStack = (0, utils_1.isString)(err.stack);
        return {
            type: this.getType(err),
            value: this.getValue(err),
            stack: hasStack ? err.stack : undefined,
            cause: err.cause ? ctx.next(err.cause) : undefined,
            synthetic: false,
        };
    }
    getType(candidate) {
        return this.isDOMError(candidate) ? 'DOMError' : 'DOMException';
    }
    getValue(err) {
        const name = err.name || (this.isDOMError(err) ? 'DOMError' : 'DOMException');
        const message = err.message ? `${name}: ${err.message}` : name;
        return message;
    }
    isDOMException(err) {
        return (0, utils_1.isBuiltin)(err, 'DOMException');
    }
    isDOMError(err) {
        return (0, utils_1.isBuiltin)(err, 'DOMError');
    }
}
exports.DOMExceptionCoercer = DOMExceptionCoercer;
//# sourceMappingURL=dom-exception-coercer.js.map