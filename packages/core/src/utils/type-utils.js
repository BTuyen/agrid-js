import { knownUnsafeEditableEvent } from '../types';
import { includes } from './string-utils';
// eslint-disable-next-line posthog-js/no-direct-array-check
const nativeIsArray = Array.isArray;
const ObjProto = Object.prototype;
export const hasOwnProperty = ObjProto.hasOwnProperty;
const toString = ObjProto.toString;
export const isArray = nativeIsArray ||
    function (obj) {
        return toString.call(obj) === '[object Array]';
    };
// from a comment on http://dbj.org/dbj/?p=286
// fails on only one very rare and deliberate custom object:
// let bomb = { toString : undefined, valueOf: function(o) { return "function BOMBA!"; }};
export const isFunction = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-function-check
    return typeof x === 'function';
};
export const isNativeFunction = (x) => isFunction(x) && x.toString().indexOf('[native code]') !== -1;
// Underscore Addons
export const isObject = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-object-check
    return x === Object(x) && !isArray(x);
};
export const isEmptyObject = (x) => {
    if (isObject(x)) {
        for (const key in x) {
            if (hasOwnProperty.call(x, key)) {
                return false;
            }
        }
        return true;
    }
    return false;
};
export const isUndefined = (x) => x === void 0;
export const isString = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-string-check
    return toString.call(x) == '[object String]';
};
export const isEmptyString = (x) => isString(x) && x.trim().length === 0;
export const isNull = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-null-check
    return x === null;
};
/*
    sometimes you want to check if something is null or undefined
    that's what this is for
 */
export const isNullish = (x) => isUndefined(x) || isNull(x);
export const isNumber = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-number-check
    return toString.call(x) == '[object Number]';
};
export const isBoolean = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-boolean-check
    return toString.call(x) === '[object Boolean]';
};
export const isFormData = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-form-data-check
    return x instanceof FormData;
};
export const isFile = (x) => {
    // eslint-disable-next-line posthog-js/no-direct-file-check
    return x instanceof File;
};
export const isPlainError = (x) => {
    return x instanceof Error;
};
export const isKnownUnsafeEditableEvent = (x) => {
    return includes(knownUnsafeEditableEvent, x);
};
export function isInstanceOf(candidate, base) {
    try {
        return candidate instanceof base;
    }
    catch {
        return false;
    }
}
export function isPrimitive(value) {
    return value === null || typeof value !== 'object';
}
export function isBuiltin(candidate, className) {
    return Object.prototype.toString.call(candidate) === `[object ${className}]`;
}
export function isError(candidate) {
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
export function isErrorEvent(event) {
    return isBuiltin(event, 'ErrorEvent');
}
export function isEvent(candidate) {
    return !isUndefined(Event) && isInstanceOf(candidate, Event);
}
export function isPlainObject(candidate) {
    return isBuiltin(candidate, 'Object');
}
export const yesLikeValues = [true, 'true', 1, '1', 'yes'];
export const isYesLike = (val) => includes(yesLikeValues, val);
export const noLikeValues = [false, 'false', 0, '0', 'no'];
export const isNoLike = (val) => includes(noLikeValues, val);
