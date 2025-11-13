"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectCoercer = void 0;
const utils_1 = require("@/utils");
const types_1 = require("../types");
const utils_2 = require("./utils");
class ObjectCoercer {
    match(candidate) {
        return typeof candidate === 'object' && candidate !== null;
    }
    coerce(candidate, ctx) {
        var _a;
        const errorProperty = this.getErrorPropertyFromObject(candidate);
        if (errorProperty) {
            return ctx.apply(errorProperty);
        }
        else {
            return {
                type: this.getType(candidate),
                value: this.getValue(candidate),
                stack: (_a = ctx.syntheticException) === null || _a === void 0 ? void 0 : _a.stack,
                level: this.isSeverityLevel(candidate.level) ? candidate.level : 'error',
                synthetic: true,
            };
        }
    }
    getType(err) {
        return (0, utils_1.isEvent)(err) ? err.constructor.name : 'Error';
    }
    getValue(err) {
        if ('name' in err && typeof err.name === 'string') {
            let message = `'${err.name}' captured as exception`;
            if ('message' in err && typeof err.message === 'string') {
                message += ` with message: '${err.message}'`;
            }
            return message;
        }
        else if ('message' in err && typeof err.message === 'string') {
            return err.message;
        }
        const className = this.getObjectClassName(err);
        const keys = (0, utils_2.extractExceptionKeysForMessage)(err);
        return `${className && className !== 'Object' ? `'${className}'` : 'Object'} captured as exception with keys: ${keys}`;
    }
    isSeverityLevel(x) {
        return (0, utils_1.isString)(x) && !(0, utils_1.isEmptyString)(x) && types_1.severityLevels.indexOf(x) >= 0;
    }
    /** If a plain object has a property that is an `Error`, return this error. */
    getErrorPropertyFromObject(obj) {
        for (const prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                const value = obj[prop];
                if ((0, utils_1.isError)(value)) {
                    return value;
                }
            }
        }
        return undefined;
    }
    getObjectClassName(obj) {
        try {
            const prototype = Object.getPrototypeOf(obj);
            return prototype ? prototype.constructor.name : undefined;
        }
        catch (e) {
            return undefined;
        }
    }
}
exports.ObjectCoercer = ObjectCoercer;
//# sourceMappingURL=object-coercer.js.map