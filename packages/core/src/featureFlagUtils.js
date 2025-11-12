"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFlagValue = exports.createFlagsResponseFromFlagsAndPayloads = exports.parsePayload = exports.getFeatureFlagValue = exports.getFlagDetailsFromFlagsAndPayloads = exports.getPayloadsFromFlags = exports.getFlagValuesFromFlags = exports.normalizeFlagsResponse = void 0;
var normalizeFlagsResponse = function (flagsResponse) {
    var _a;
    if ('flags' in flagsResponse) {
        // Convert v2 format to v1 format
        var featureFlags = (0, exports.getFlagValuesFromFlags)(flagsResponse.flags);
        var featureFlagPayloads = (0, exports.getPayloadsFromFlags)(flagsResponse.flags);
        return __assign(__assign({}, flagsResponse), { featureFlags: featureFlags, featureFlagPayloads: featureFlagPayloads });
    }
    else {
        // Convert v1 format to v2 format
        var featureFlags = (_a = flagsResponse.featureFlags) !== null && _a !== void 0 ? _a : {};
        var featureFlagPayloads_1 = Object.fromEntries(Object.entries(flagsResponse.featureFlagPayloads || {}).map(function (_a) {
            var _b = __read(_a, 2), k = _b[0], v = _b[1];
            return [k, (0, exports.parsePayload)(v)];
        }));
        var flags = Object.fromEntries(Object.entries(featureFlags).map(function (_a) {
            var _b = __read(_a, 2), key = _b[0], value = _b[1];
            return [
                key,
                getFlagDetailFromFlagAndPayload(key, value, featureFlagPayloads_1[key]),
            ];
        }));
        return __assign(__assign({}, flagsResponse), { featureFlags: featureFlags, featureFlagPayloads: featureFlagPayloads_1, flags: flags });
    }
};
exports.normalizeFlagsResponse = normalizeFlagsResponse;
function getFlagDetailFromFlagAndPayload(key, value, payload) {
    return {
        key: key,
        enabled: typeof value === 'string' ? true : value,
        variant: typeof value === 'string' ? value : undefined,
        reason: undefined,
        metadata: {
            id: undefined,
            version: undefined,
            payload: payload ? JSON.stringify(payload) : undefined,
            description: undefined,
        },
    };
}
/**
 * Get the flag values from the flags v4 response.
 * @param flags - The flags
 * @returns The flag values
 */
var getFlagValuesFromFlags = function (flags) {
    return Object.fromEntries(Object.entries(flags !== null && flags !== void 0 ? flags : {})
        .map(function (_a) {
        var _b = __read(_a, 2), key = _b[0], detail = _b[1];
        return [key, (0, exports.getFeatureFlagValue)(detail)];
    })
        .filter(function (_a) {
        var _b = __read(_a, 2), value = _b[1];
        return value !== undefined;
    }));
};
exports.getFlagValuesFromFlags = getFlagValuesFromFlags;
/**
 * Get the payloads from the flags v4 response.
 * @param flags - The flags
 * @returns The payloads
 */
var getPayloadsFromFlags = function (flags) {
    var safeFlags = flags !== null && flags !== void 0 ? flags : {};
    return Object.fromEntries(Object.keys(safeFlags)
        .filter(function (flag) {
        var details = safeFlags[flag];
        return details.enabled && details.metadata && details.metadata.payload !== undefined;
    })
        .map(function (flag) {
        var _a;
        var payload = (_a = safeFlags[flag].metadata) === null || _a === void 0 ? void 0 : _a.payload;
        return [flag, payload ? (0, exports.parsePayload)(payload) : undefined];
    }));
};
exports.getPayloadsFromFlags = getPayloadsFromFlags;
/**
 * Get the flag details from the legacy v1 flags and payloads. As such, it will lack the reason, id, version, and description.
 * @param flagsResponse - The flags response
 * @returns The flag details
 */
var getFlagDetailsFromFlagsAndPayloads = function (flagsResponse) {
    var _a, _b;
    var flags = (_a = flagsResponse.featureFlags) !== null && _a !== void 0 ? _a : {};
    var payloads = (_b = flagsResponse.featureFlagPayloads) !== null && _b !== void 0 ? _b : {};
    return Object.fromEntries(Object.entries(flags).map(function (_a) {
        var _b = __read(_a, 2), key = _b[0], value = _b[1];
        return [
            key,
            {
                key: key,
                enabled: typeof value === 'string' ? true : value,
                variant: typeof value === 'string' ? value : undefined,
                reason: undefined,
                metadata: {
                    id: undefined,
                    version: undefined,
                    payload: (payloads === null || payloads === void 0 ? void 0 : payloads[key]) ? JSON.stringify(payloads[key]) : undefined,
                    description: undefined,
                },
            },
        ];
    }));
};
exports.getFlagDetailsFromFlagsAndPayloads = getFlagDetailsFromFlagsAndPayloads;
var getFeatureFlagValue = function (detail) {
    var _a;
    return detail === undefined ? undefined : ((_a = detail.variant) !== null && _a !== void 0 ? _a : detail.enabled);
};
exports.getFeatureFlagValue = getFeatureFlagValue;
var parsePayload = function (response) {
    if (typeof response !== 'string') {
        return response;
    }
    try {
        return JSON.parse(response);
    }
    catch (_a) {
        return response;
    }
};
exports.parsePayload = parsePayload;
/**
 * Get the normalized flag details from the flags and payloads.
 * This is used to convert things like bootstrap and stored feature flags and payloads to the v4 format.
 * This helps us ensure backwards compatibility.
 * If a key exists in the featureFlagPayloads that is not in the featureFlags, we treat it as a true feature flag.
 *
 * @param featureFlags - The feature flags
 * @param featureFlagPayloads - The feature flag payloads
 * @returns The normalized flag details
 */
var createFlagsResponseFromFlagsAndPayloads = function (featureFlags, featureFlagPayloads) {
    // If a feature flag payload key is not in the feature flags, we treat it as true feature flag.
    var allKeys = __spreadArray([], __read(new Set(__spreadArray(__spreadArray([], __read(Object.keys(featureFlags !== null && featureFlags !== void 0 ? featureFlags : {})), false), __read(Object.keys(featureFlagPayloads !== null && featureFlagPayloads !== void 0 ? featureFlagPayloads : {})), false))), false);
    var enabledFlags = allKeys
        .filter(function (flag) { return !!featureFlags[flag] || !!featureFlagPayloads[flag]; })
        .reduce(function (res, key) { var _a; return ((res[key] = (_a = featureFlags[key]) !== null && _a !== void 0 ? _a : true), res); }, {});
    var flagDetails = {
        featureFlags: enabledFlags,
        featureFlagPayloads: featureFlagPayloads !== null && featureFlagPayloads !== void 0 ? featureFlagPayloads : {},
    };
    return (0, exports.normalizeFlagsResponse)(flagDetails);
};
exports.createFlagsResponseFromFlagsAndPayloads = createFlagsResponseFromFlagsAndPayloads;
var updateFlagValue = function (flag, value) {
    return __assign(__assign({}, flag), { enabled: getEnabledFromValue(value), variant: getVariantFromValue(value) });
};
exports.updateFlagValue = updateFlagValue;
function getEnabledFromValue(value) {
    return typeof value === 'string' ? true : value;
}
function getVariantFromValue(value) {
    return typeof value === 'string' ? value : undefined;
}
//# sourceMappingURL=featureFlagUtils.js.map