"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNoLike = exports.noLikeValues = exports.isYesLike = exports.yesLikeValues = exports.isKnownUnsafeEditableEvent = exports.isPlainError = exports.isFile = exports.isFormData = exports.isBoolean = exports.isNumber = exports.isNullish = exports.isNull = exports.isEmptyString = exports.isString = exports.isUndefined = exports.isEmptyObject = exports.isObject = exports.isNativeFunction = exports.isFunction = exports.isArray = exports.hasOwnProperty = void 0;
exports.isInstanceOf = isInstanceOf;
exports.isPrimitive = isPrimitive;
exports.isBuiltin = isBuiltin;
exports.isError = isError;
exports.isErrorEvent = isErrorEvent;
exports.isEvent = isEvent;
exports.isPlainObject = isPlainObject;
const types_1 = require("../types");
const string_utils_1 = require("./string-utils");
// eslint-disable-next-line posthog-js/no-direct-array-check
const nativeIsArray = Array.isArray;
const ObjProto = Object.prototype;
exports.hasOwnProperty = ObjProto.hasOwnProperty;
const toString = ObjProto.toString;
exports.isArray = nativeIsArray ||
    function (obj) {
        return toString.call(obj) === '[object Array]';
    };
// from a comment on http://dbj.org/dbj/?p=286
// fails on only one very rare and deliberate custom object:
// let bomb = { toString : undefined, valueOf: function(o) { return "function BOMBA!"; }};
const isFunction = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-function-check
    return typeof x === 'function';
};
exports.isFunction = isFunction;
const isNativeFunction = (x) => (0, exports.isFunction)(x) && x.toString().indexOf('[native code]') !== -1;
exports.isNativeFunction = isNativeFunction;
// Underscore Addons
const isObject = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-object-check
    return x === Object(x) && !(0, exports.isArray)(x);
};
exports.isObject = isObject;
const isEmptyObject = (x) => {
    if ((0, exports.isObject)(x)) {
        for (const key in x) {
            if (exports.hasOwnProperty.call(x, key)) {
                return false;
            }
        }
        return true;
    }
    return false;
};
exports.isEmptyObject = isEmptyObject;
const isUndefined = (x) => x === void 0;
exports.isUndefined = isUndefined;
const isString = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-string-check
    return toString.call(x) == '[object String]';
};
exports.isString = isString;
const isEmptyString = (x) => (0, exports.isString)(x) && x.trim().length === 0;
exports.isEmptyString = isEmptyString;
const isNull = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-null-check
    return x === null;
};
exports.isNull = isNull;
/*
    sometimes you want to check if something is null or undefined
    that's what this is for
 */
const isNullish = (x) => (0, exports.isUndefined)(x) || (0, exports.isNull)(x);
exports.isNullish = isNullish;
const isNumber = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-number-check
    return toString.call(x) == '[object Number]';
};
exports.isNumber = isNumber;
const isBoolean = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-boolean-check
    return toString.call(x) === '[object Boolean]';
};
exports.isBoolean = isBoolean;
const isFormData = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-form-data-check
    return x instanceof FormData;
};
exports.isFormData = isFormData;
const isFile = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-file-check
    return x instanceof File;
};
exports.isFile = isFile;
const isPlainError = (x) => {
    return x instanceof Error;
};
exports.isPlainError = isPlainError;
const isKnownUnsafeEditableEvent = (x) => {
    return (0, string_utils_1.includes)(types_1.knownUnsafeEditableEvent, x);
};
exports.isKnownUnsafeEditableEvent = isKnownUnsafeEditableEvent;
function isInstanceOf(candidate, base) {
    try {
        return candidate instanceof base;
    }
    catch {
        return false;
    }
}
function isPrimitive(value) {
    return value === null || typeof value !== 'object';
}
function isBuiltin(candidate, className) {
    return Object.prototype.toString.call(candidate) === `[object ${className}]`;
}
function isError(candidate) {
    switch (Object.prototype.toString.call(candidate)) {
        case '[object Error]':
        case '[object Exception]':
        case '[object DOMException]':
        case '[object DOMError]':
        case '[object WebAssembly.Exception]':
            return true;
        default:
            return isInstanceOf(candidate, Error);
    }
}
function isErrorEvent(event) {
    return isBuiltin(event, 'ErrorEvent');
}
function isEvent(candidate) {
    return !(0, exports.isUndefined)(Event) && isInstanceOf(candidate, Event);
}
function isPlainObject(candidate) {
    return isBuiltin(candidate, 'Object');
}
exports.yesLikeValues = [true, 'true', 1, '1', 'yes'];
const isYesLike = (val) => (0, string_utils_1.includes)(exports.yesLikeValues, val);
exports.isYesLike = isYesLike;
exports.noLikeValues = [false, 'false', 0, '0', 'no'];
const isNoLike = (val) => (0, string_utils_1.includes)(exports.noLikeValues, val);
exports.isNoLike = isNoLike;
//# sourceMappingURL=type-utils.js.map