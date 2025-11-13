"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFlagValue = exports.createFlagsResponseFromFlagsAndPayloads = exports.parsePayload = exports.getFeatureFlagValue = exports.getFlagDetailsFromFlagsAndPayloads = exports.getPayloadsFromFlags = exports.getFlagValuesFromFlags = exports.normalizeFlagsResponse = void 0;
const normalizeFlagsResponse = (flagsResponse) => {
    var _a;
    if ('flags' in flagsResponse) {
        // Convert v2 format to v1 format
        const featureFlags = (0, exports.getFlagValuesFromFlags)(flagsResponse.flags);
        const featureFlagPayloads = (0, exports.getPayloadsFromFlags)(flagsResponse.flags);
        return {
            ...flagsResponse,
            featureFlags,
            featureFlagPayloads,
        };
    }
    else {
        // Convert v1 format to v2 format
        const featureFlags = (_a = flagsResponse.featureFlags) !== null && _a !== void 0 ? _a : {};
        const featureFlagPayloads = Object.fromEntries(Object.entries(flagsResponse.featureFlagPayloads || {}).map(([k, v]) => [k, (0, exports.parsePayload)(v)]));
        const flags = Object.fromEntries(Object.entries(featureFlags).map(([key, value]) => [
            key,
            getFlagDetailFromFlagAndPayload(key, value, featureFlagPayloads[key]),
        ]));
        return {
            ...flagsResponse,
            featureFlags,
            featureFlagPayloads,
            flags,
        };
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
const getFlagValuesFromFlags = (flags) => {
    return Object.fromEntries(Object.entries(flags !== null && flags !== void 0 ? flags : {})
        .map(([key, detail]) => [key, (0, exports.getFeatureFlagValue)(detail)])
        .filter(([, value]) => value !== undefined));
};
exports.getFlagValuesFromFlags = getFlagValuesFromFlags;
/**
 * Get the payloads from the flags v4 response.
 * @param flags - The flags
 * @returns The payloads
 */
const getPayloadsFromFlags = (flags) => {
    const safeFlags = flags !== null && flags !== void 0 ? flags : {};
    return Object.fromEntries(Object.keys(safeFlags)
        .filter((flag) => {
        const details = safeFlags[flag];
        return details.enabled && details.metadata && details.metadata.payload !== undefined;
    })
        .map((flag) => {
        var _a;
        const payload = (_a = safeFlags[flag].metadata) === null || _a === void 0 ? void 0 : _a.payload;
        return [flag, payload ? (0, exports.parsePayload)(payload) : undefined];
    }));
};
exports.getPayloadsFromFlags = getPayloadsFromFlags;
/**
 * Get the flag details from the legacy v1 flags and payloads. As such, it will lack the reason, id, version, and description.
 * @param flagsResponse - The flags response
 * @returns The flag details
 */
const getFlagDetailsFromFlagsAndPayloads = (flagsResponse) => {
    var _a, _b;
    const flags = (_a = flagsResponse.featureFlags) !== null && _a !== void 0 ? _a : {};
    const payloads = (_b = flagsResponse.featureFlagPayloads) !== null && _b !== void 0 ? _b : {};
    return Object.fromEntries(Object.entries(flags).map(([key, value]) => [
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
    ]));
};
exports.getFlagDetailsFromFlagsAndPayloads = getFlagDetailsFromFlagsAndPayloads;
const getFeatureFlagValue = (detail) => {
    var _a;
    return detail === undefined ? undefined : ((_a = detail.variant) !== null && _a !== void 0 ? _a : detail.enabled);
};
exports.getFeatureFlagValue = getFeatureFlagValue;
const parsePayload = (response) => {
    if (typeof response !== 'string') {
        return response;
    }
    try {
        return JSON.parse(response);
    }
    catch {
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
const createFlagsResponseFromFlagsAndPayloads = (featureFlags, featureFlagPayloads) => {
    // If a feature flag payload key is not in the feature flags, we treat it as true feature flag.
    const allKeys = [...new Set([...Object.keys(featureFlags !== null && featureFlags !== void 0 ? featureFlags : {}), ...Object.keys(featureFlagPayloads !== null && featureFlagPayloads !== void 0 ? featureFlagPayloads : {})])];
    const enabledFlags = allKeys
        .filter((flag) => !!featureFlags[flag] || !!featureFlagPayloads[flag])
        .reduce((res, key) => { var _a; return ((res[key] = (_a = featureFlags[key]) !== null && _a !== void 0 ? _a : true), res); }, {});
    const flagDetails = {
        featureFlags: enabledFlags,
        featureFlagPayloads: featureFlagPayloads !== null && featureFlagPayloads !== void 0 ? featureFlagPayloads : {},
    };
    return (0, exports.normalizeFlagsResponse)(flagDetails);
};
exports.createFlagsResponseFromFlagsAndPayloads = createFlagsResponseFromFlagsAndPayloads;
const updateFlagValue = (flag, value) => {
    return {
        ...flag,
        enabled: getEnabledFromValue(value),
        variant: getVariantFromValue(value),
    };
};
exports.updateFlagValue = updateFlagValue;
function getEnabledFromValue(value) {
    return typeof value === 'string' ? true : value;
}
function getVariantFromValue(value) {
    return typeof value === 'string' ? value : undefined;
}
//# sourceMappingURL=featureFlagUtils.js.map