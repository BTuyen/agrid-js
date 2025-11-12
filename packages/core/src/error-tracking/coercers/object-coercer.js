"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectCoercer = void 0;
var utils_1 = require("@/utils");
var types_1 = require("../types");
var utils_2 = require("./utils");
var ObjectCoercer = /** @class */ (function () {
    function ObjectCoercer() {
    }
    ObjectCoercer.prototype.match = function (candidate) {
        return typeof candidate === 'object' && candidate !== null;
    };
    ObjectCoercer.prototype.coerce = function (candidate, ctx) {
        var _a;
        var errorProperty = this.getErrorPropertyFromObject(candidate);
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
    };
    ObjectCoercer.prototype.getType = function (err) {
        return (0, utils_1.isEvent)(err) ? err.constructor.name : 'Error';
    };
    ObjectCoercer.prototype.getValue = function (err) {
        if ('name' in err && typeof err.name === 'string') {
            var message = "'".concat(err.name, "' captured as exception");
            if ('message' in err && typeof err.message === 'string') {
                message += " with message: '".concat(err.message, "'");
            }
            return message;
        }
        else if ('message' in err && typeof err.message === 'string') {
            return err.message;
        }
        var className = this.getObjectClassName(err);
        var keys = (0, utils_2.extractExceptionKeysForMessage)(err);
        return "".concat(className && className !== 'Object' ? "'".concat(className, "'") : 'Object', " captured as exception with keys: ").concat(keys);
    };
    ObjectCoercer.prototype.isSeverityLevel = function (x) {
        return (0, utils_1.isString)(x) && !(0, utils_1.isEmptyString)(x) && types_1.severityLevels.indexOf(x) >= 0;
    };
    /** If a plain object has a property that is an `Error`, return this error. */
    ObjectCoercer.prototype.getErrorPropertyFromObject = function (obj) {
        for (var prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                var value = obj[prop];
                if ((0, utils_1.isError)(value)) {
                    return value;
                }
            }
        }
        return undefined;
    };
    ObjectCoercer.prototype.getObjectClassName = function (obj) {
        try {
            var prototype = Object.getPrototypeOf(obj);
            return prototype ? prototype.constructor.name : undefined;
        }
        catch (e) {
            return undefined;
        }
    };
    return ObjectCoercer;
}());
exports.ObjectCoercer = ObjectCoercer;
//# sourceMappingURL=object-coercer.js.map