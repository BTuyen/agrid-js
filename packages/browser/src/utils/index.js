import { nativeForEach, nativeIndexOf } from './globals';
import { logger } from './logger';
import { isFormData, isNull, isNullish, isNumber, isString, isUndefined, hasOwnProperty, isArray } from '@agrid/core';
const breaker = {};
export function eachArray(obj, iterator, thisArg) {
    if (isArray(obj)) {
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, thisArg);
        }
        else if ('length' in obj && obj.length === +obj.length) {
            for (let i = 0, l = obj.length; i < l; i++) {
                if (i in obj && iterator.call(thisArg, obj[i], i) === breaker) {
                    return;
                }
            }
        }
    }
}
/**
 * @param {*=} obj
 * @param {function(...*)=} iterator
 * @param {Object=} thisArg
 */
export function each(obj, iterator, thisArg) {
    if (isNullish(obj)) {
        return;
    }
    if (isArray(obj)) {
        return eachArray(obj, iterator, thisArg);
    }
    if (isFormData(obj)) {
        for (const pair of obj.entries()) {
            if (iterator.call(thisArg, pair[1], pair[0]) === breaker) {
                return;
            }
        }
        return;
    }
    for (const key in obj) {
        if (hasOwnProperty.call(obj, key)) {
            if (iterator.call(thisArg, obj[key], key) === breaker) {
                return;
            }
        }
    }
}
export const extend = function (obj, ...args) {
    eachArray(args, function (source) {
        for (const prop in source) {
            if (source[prop] !== void 0) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
};
export const extendArray = function (obj, ...args) {
    eachArray(args, function (source) {
        eachArray(source, function (item) {
            obj.push(item);
        });
    });
    return obj;
};
export const include = function (obj, target) {
    let found = false;
    if (isNull(obj)) {
        return found;
    }
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) {
        return obj.indexOf(target) != -1;
    }
    each(obj, function (value) {
        if (found || (found = value === target)) {
            return breaker;
        }
        return;
    });
    return found;
};
/**
 * Object.entries() polyfill
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
 */
export function entries(obj) {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resArray = new Array(i); // preallocate the Array
    while (i--) {
        resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resArray;
}
export const trySafe = function (fn) {
    try {
        return fn();
    }
    catch {
        return undefined;
    }
};
export const safewrap = function (f) {
    return function (...args) {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return f.apply(this, args);
        }
        catch (e) {
            logger.critical('Implementation error. Please turn on debug mode and open a ticket on https://app.posthog.com/home#panel=support%3Asupport%3A.');
            logger.critical(e);
        }
    };
};
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const safewrapClass = function (klass, functions) {
    for (let i = 0; i < functions.length; i++) {
        klass.prototype[functions[i]] = safewrap(klass.prototype[functions[i]]);
    }
};
export const stripEmptyProperties = function (p) {
    const ret = {};
    each(p, function (v, k) {
        if ((isString(v) && v.length > 0) || isNumber(v)) {
            ret[k] = v;
        }
    });
    return ret;
};
/**
 * Deep copies an object.
 * It handles cycles by replacing all references to them with `undefined`
 * Also supports customizing native values
 *
 * @param value
 * @param customizer
 * @returns {{}|undefined|*}
 */
function deepCircularCopy(value, customizer) {
    const COPY_IN_PROGRESS_SET = new Set();
    function internalDeepCircularCopy(value, key) {
        if (value !== Object(value))
            return customizer ? customizer(value, key) : value; // primitive value
        if (COPY_IN_PROGRESS_SET.has(value))
            return undefined;
        COPY_IN_PROGRESS_SET.add(value);
        let result;
        if (isArray(value)) {
            result = [];
            eachArray(value, (it) => {
                result.push(internalDeepCircularCopy(it));
            });
        }
        else {
            result = {};
            each(value, (val, key) => {
                if (!COPY_IN_PROGRESS_SET.has(val)) {
                    ;
                    result[key] = internalDeepCircularCopy(val, key);
                }
            });
        }
        return result;
    }
    return internalDeepCircularCopy(value);
}
export function _copyAndTruncateStrings(object, maxStringLength) {
    return deepCircularCopy(object, (value) => {
        if (isString(value) && !isNull(maxStringLength)) {
            return value.slice(0, maxStringLength);
        }
        return value;
    });
}
// NOTE: Update PostHogConfig docs if you change this list
// We will not try to catch all bullets here, but we should make an effort to catch the most common ones
// You should be highly against adding more to this list, because ultimately customers can configure
// their `cross_subdomain_cookie` setting to anything they want.
const EXCLUDED_FROM_CROSS_SUBDOMAIN_COOKIE = ['herokuapp.com', 'vercel.app', 'netlify.app'];
export function isCrossDomainCookie(documentLocation) {
    const hostname = documentLocation === null || documentLocation === void 0 ? void 0 : documentLocation.hostname;
    if (!isString(hostname)) {
        return false;
    }
    // split and slice isn't a great way to match arbitrary domains,
    // but it's good enough for ensuring we only match herokuapp.com when it is the TLD
    // for the hostname
    const lastTwoParts = hostname.split('.').slice(-2).join('.');
    for (const excluded of EXCLUDED_FROM_CROSS_SUBDOMAIN_COOKIE) {
        if (lastTwoParts === excluded) {
            return false;
        }
    }
    return true;
}
export function find(value, predicate) {
    for (let i = 0; i < value.length; i++) {
        if (predicate(value[i])) {
            return value[i];
        }
    }
    return undefined;
}
// Use this instead of element.addEventListener to avoid eslint errors
// this properly implements the default options for passive event listeners
export function addEventListener(element, event, callback, options) {
    const { capture = false, passive = true } = options !== null && options !== void 0 ? options : {};
    // This is the only place where we are allowed to call this function
    // because the whole idea is that we should be calling this instead of the built-in one
    // eslint-disable-next-line posthog-js/no-add-event-listener
    element === null || element === void 0 ? void 0 : element.addEventListener(event, callback, { capture, passive });
}
/**
 * Helper to migrate deprecated config fields to new field names with appropriate warnings
 * @param config - The config object to check
 * @param newField - The new field name to use
 * @param oldField - The deprecated field name to check for
 * @param defaultValue - The default value if neither field is set
 * @param loggerInstance - Optional logger instance for deprecation warnings
 * @returns The value to use (new field takes precedence over old field)
 */
export function migrateConfigField(config, newField, oldField, defaultValue, loggerInstance) {
    const hasNewField = newField in config && !isUndefined(config[newField]);
    const hasOldField = oldField in config && !isUndefined(config[oldField]);
    if (hasNewField) {
        return config[newField];
    }
    if (hasOldField) {
        if (loggerInstance) {
            loggerInstance.warn(`Config field '${oldField}' is deprecated. Please use '${newField}' instead. ` +
                `The old field will be removed in a future major version.`);
        }
        return config[oldField];
    }
    return defaultValue;
}
