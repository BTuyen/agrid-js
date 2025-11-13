import { entries, extend } from './utils';
import { Compression, } from './types';
import { PERSISTENCE_EARLY_ACCESS_FEATURES, PERSISTENCE_FEATURE_FLAG_DETAILS, ENABLED_FEATURE_FLAGS, STORED_GROUP_PROPERTIES_KEY, STORED_PERSON_PROPERTIES_KEY, FLAG_CALL_REPORTED, } from './constants';
import { isUndefined, isArray } from '@agrid/core';
import { createLogger } from './utils/logger';
import { getTimezone } from './utils/event-utils';
const logger = createLogger('[FeatureFlags]');
const PERSISTENCE_ACTIVE_FEATURE_FLAGS = '$active_feature_flags';
const PERSISTENCE_OVERRIDE_FEATURE_FLAGS = '$override_feature_flags';
const PERSISTENCE_FEATURE_FLAG_PAYLOADS = '$feature_flag_payloads';
const PERSISTENCE_OVERRIDE_FEATURE_FLAG_PAYLOADS = '$override_feature_flag_payloads';
const PERSISTENCE_FEATURE_FLAG_REQUEST_ID = '$feature_flag_request_id';
export const filterActiveFeatureFlags = (featureFlags) => {
    const activeFeatureFlags = {};
    for (const [key, value] of entries(featureFlags || {})) {
        if (value) {
            activeFeatureFlags[key] = value;
        }
    }
    return activeFeatureFlags;
};
export const parseFlagsResponse = (response, persistence, currentFlags = {}, currentFlagPayloads = {}, currentFlagDetails = {}) => {
    const normalizedResponse = normalizeFlagsResponse(response);
    const flagDetails = normalizedResponse.flags;
    const featureFlags = normalizedResponse.featureFlags;
    const flagPayloads = normalizedResponse.featureFlagPayloads;
    if (!featureFlags) {
        return; // <-- This early return means we don't update anything, which is good.
    }
    const requestId = response['requestId'];
    // using the v1 api
    if (isArray(featureFlags)) {
        logger.warn('v1 of the feature flags endpoint is deprecated. Please use the latest version.');
        const $enabled_feature_flags = {};
        if (featureFlags) {
            for (let i = 0; i < featureFlags.length; i++) {
                $enabled_feature_flags[featureFlags[i]] = true;
            }
        }
        persistence &&
            persistence.register({
                [PERSISTENCE_ACTIVE_FEATURE_FLAGS]: featureFlags,
                [ENABLED_FEATURE_FLAGS]: $enabled_feature_flags,
            });
        return;
    }
    // using the v2+ api
    let newFeatureFlags = featureFlags;
    let newFeatureFlagPayloads = flagPayloads;
    let newFeatureFlagDetails = flagDetails;
    if (response.errorsWhileComputingFlags) {
        // if not all flags were computed, we upsert flags instead of replacing them
        newFeatureFlags = { ...currentFlags, ...newFeatureFlags };
        newFeatureFlagPayloads = { ...currentFlagPayloads, ...newFeatureFlagPayloads };
        newFeatureFlagDetails = { ...currentFlagDetails, ...newFeatureFlagDetails };
    }
    persistence &&
        persistence.register({
            [PERSISTENCE_ACTIVE_FEATURE_FLAGS]: Object.keys(filterActiveFeatureFlags(newFeatureFlags)),
            [ENABLED_FEATURE_FLAGS]: newFeatureFlags || {},
            [PERSISTENCE_FEATURE_FLAG_PAYLOADS]: newFeatureFlagPayloads || {},
            [PERSISTENCE_FEATURE_FLAG_DETAILS]: newFeatureFlagDetails || {},
            ...(requestId ? { [PERSISTENCE_FEATURE_FLAG_REQUEST_ID]: requestId } : {}),
        });
};
const normalizeFlagsResponse = (response) => {
    const flagDetails = response['flags'];
    if (flagDetails) {
        // This is a v=4 request.
        // Map of flag keys to flag values: Record<string, string | boolean>
        response.featureFlags = Object.fromEntries(Object.keys(flagDetails).map((flag) => { var _a; return [flag, (_a = flagDetails[flag].variant) !== null && _a !== void 0 ? _a : flagDetails[flag].enabled]; }));
        // Map of flag keys to flag payloads: Record<string, JsonType>
        response.featureFlagPayloads = Object.fromEntries(Object.keys(flagDetails)
            .filter((flag) => flagDetails[flag].enabled)
            .filter((flag) => { var _a; return (_a = flagDetails[flag].metadata) === null || _a === void 0 ? void 0 : _a.payload; })
            .map((flag) => { var _a; return [flag, (_a = flagDetails[flag].metadata) === null || _a === void 0 ? void 0 : _a.payload]; }));
    }
    else {
        logger.warn('Using an older version of the feature flags endpoint. Please upgrade your PostHog server to the latest version');
    }
    return response;
};
export var QuotaLimitedResource;
(function (QuotaLimitedResource) {
    QuotaLimitedResource["FeatureFlags"] = "feature_flags";
    QuotaLimitedResource["Recordings"] = "recordings";
})(QuotaLimitedResource || (QuotaLimitedResource = {}));
export class PostHogFeatureFlags {
    constructor(_instance) {
        this._instance = _instance;
        this._override_warning = false;
        this._hasLoadedFlags = false;
        this._requestInFlight = false;
        this._reloadingDisabled = false;
        this._additionalReloadRequested = false;
        this._flagsCalled = false;
        this._flagsLoadedFromRemote = false;
        this.featureFlagEventHandlers = [];
    }
    _getValidEvaluationEnvironments() {
        const envs = this._instance.config.evaluation_environments;
        if (!(envs === null || envs === void 0 ? void 0 : envs.length)) {
            return [];
        }
        return envs.filter((env) => {
            const isValid = env && typeof env === 'string' && env.trim().length > 0;
            if (!isValid) {
                logger.error('Invalid evaluation environment found:', env, 'Expected non-empty string');
            }
            return isValid;
        });
    }
    _shouldIncludeEvaluationEnvironments() {
        return this._getValidEvaluationEnvironments().length > 0;
    }
    flags() {
        if (this._instance.config.__preview_remote_config) {
            // If remote config is enabled we don't call /flags and we mark it as called so that we don't simulate it
            this._flagsCalled = true;
            return;
        }
        // TRICKY: We want to disable flags if we don't have a queued reload, and one of the settings exist for disabling on first load
        const disableFlags = !this._reloadDebouncer &&
            (this._instance.config.advanced_disable_feature_flags ||
                this._instance.config.advanced_disable_feature_flags_on_first_load);
        this._callFlagsEndpoint({
            disableFlags,
        });
    }
    get hasLoadedFlags() {
        return this._hasLoadedFlags;
    }
    getFlags() {
        return Object.keys(this.getFlagVariants());
    }
    getFlagsWithDetails() {
        var _a, _b;
        const flagDetails = this._instance.get_property(PERSISTENCE_FEATURE_FLAG_DETAILS);
        const overridenFlags = this._instance.get_property(PERSISTENCE_OVERRIDE_FEATURE_FLAGS);
        const overriddenPayloads = this._instance.get_property(PERSISTENCE_OVERRIDE_FEATURE_FLAG_PAYLOADS);
        if (!overriddenPayloads && !overridenFlags) {
            return flagDetails || {};
        }
        const finalDetails = extend({}, flagDetails || {});
        const overriddenKeys = [
            ...new Set([...Object.keys(overriddenPayloads || {}), ...Object.keys(overridenFlags || {})]),
        ];
        for (const key of overriddenKeys) {
            const originalDetail = finalDetails[key];
            const overrideFlagValue = overridenFlags === null || overridenFlags === void 0 ? void 0 : overridenFlags[key];
            const finalEnabled = isUndefined(overrideFlagValue)
                ? ((_a = originalDetail === null || originalDetail === void 0 ? void 0 : originalDetail.enabled) !== null && _a !== void 0 ? _a : false)
                : !!overrideFlagValue;
            const overrideVariant = isUndefined(overrideFlagValue)
                ? originalDetail.variant
                : typeof overrideFlagValue === 'string'
                    ? overrideFlagValue
                    : undefined;
            const overridePayload = overriddenPayloads === null || overriddenPayloads === void 0 ? void 0 : overriddenPayloads[key];
            const overridenDetail = {
                ...originalDetail,
                enabled: finalEnabled,
                // If the flag is not enabled, the variant should be undefined, even if the original has a variant value.
                variant: finalEnabled ? (overrideVariant !== null && overrideVariant !== void 0 ? overrideVariant : originalDetail === null || originalDetail === void 0 ? void 0 : originalDetail.variant) : undefined,
            };
            // Keep track of the original enabled and variant values so we can send them in the $feature_flag_called event.
            // This will be helpful for debugging and for understanding the impact of overrides.
            if (finalEnabled !== (originalDetail === null || originalDetail === void 0 ? void 0 : originalDetail.enabled)) {
                overridenDetail.original_enabled = originalDetail === null || originalDetail === void 0 ? void 0 : originalDetail.enabled;
            }
            if (overrideVariant !== (originalDetail === null || originalDetail === void 0 ? void 0 : originalDetail.variant)) {
                overridenDetail.original_variant = originalDetail === null || originalDetail === void 0 ? void 0 : originalDetail.variant;
            }
            if (overridePayload) {
                overridenDetail.metadata = {
                    ...originalDetail === null || originalDetail === void 0 ? void 0 : originalDetail.metadata,
                    payload: overridePayload,
                    original_payload: (_b = originalDetail === null || originalDetail === void 0 ? void 0 : originalDetail.metadata) === null || _b === void 0 ? void 0 : _b.payload,
                };
            }
            finalDetails[key] = overridenDetail;
        }
        if (!this._override_warning) {
            logger.warn(' Overriding feature flag details!', {
                flagDetails,
                overriddenPayloads,
                finalDetails,
            });
            this._override_warning = true;
        }
        return finalDetails;
    }
    getFlagVariants() {
        const enabledFlags = this._instance.get_property(ENABLED_FEATURE_FLAGS);
        const overriddenFlags = this._instance.get_property(PERSISTENCE_OVERRIDE_FEATURE_FLAGS);
        if (!overriddenFlags) {
            return enabledFlags || {};
        }
        const finalFlags = extend({}, enabledFlags);
        const overriddenKeys = Object.keys(overriddenFlags);
        for (let i = 0; i < overriddenKeys.length; i++) {
            finalFlags[overriddenKeys[i]] = overriddenFlags[overriddenKeys[i]];
        }
        if (!this._override_warning) {
            logger.warn(' Overriding feature flags!', {
                enabledFlags,
                overriddenFlags,
                finalFlags,
            });
            this._override_warning = true;
        }
        return finalFlags;
    }
    getFlagPayloads() {
        const flagPayloads = this._instance.get_property(PERSISTENCE_FEATURE_FLAG_PAYLOADS);
        const overriddenPayloads = this._instance.get_property(PERSISTENCE_OVERRIDE_FEATURE_FLAG_PAYLOADS);
        if (!overriddenPayloads) {
            return flagPayloads || {};
        }
        const finalPayloads = extend({}, flagPayloads || {});
        const overriddenKeys = Object.keys(overriddenPayloads);
        for (let i = 0; i < overriddenKeys.length; i++) {
            finalPayloads[overriddenKeys[i]] = overriddenPayloads[overriddenKeys[i]];
        }
        if (!this._override_warning) {
            logger.warn(' Overriding feature flag payloads!', {
                flagPayloads,
                overriddenPayloads,
                finalPayloads,
            });
            this._override_warning = true;
        }
        return finalPayloads;
    }
    /**
     * Reloads feature flags asynchronously.
     *
     * Constraints:
     *
     * 1. Avoid parallel requests
     * 2. Delay a few milliseconds after each reloadFeatureFlags call to batch subsequent changes together
     */
    reloadFeatureFlags() {
        if (this._reloadingDisabled || this._instance.config.advanced_disable_feature_flags) {
            // If reloading has been explicitly disabled then we don't want to do anything
            // Or if feature flags are disabled
            return;
        }
        if (this._reloadDebouncer) {
            // If we're already in a debounce then we don't want to do anything
            return;
        }
        // Debounce multiple calls on the same tick
        this._reloadDebouncer = setTimeout(() => {
            this._callFlagsEndpoint();
        }, 5);
    }
    _clearDebouncer() {
        clearTimeout(this._reloadDebouncer);
        this._reloadDebouncer = undefined;
    }
    ensureFlagsLoaded() {
        if (this._hasLoadedFlags || this._requestInFlight || this._reloadDebouncer) {
            // If we are or have already loaded the flags then we don't want to do anything
            return;
        }
        this.reloadFeatureFlags();
    }
    setAnonymousDistinctId(anon_distinct_id) {
        this.$anon_distinct_id = anon_distinct_id;
    }
    setReloadingPaused(isPaused) {
        this._reloadingDisabled = isPaused;
    }
    /**
     * NOTE: This is used both for flags and remote config. Once the RemoteConfig is fully released this will essentially only
     * be for flags and can eventually be replaced with the new flags endpoint
     */
    _callFlagsEndpoint(options) {
        var _a;
        // Ensure we don't have double queued /flags requests
        this._clearDebouncer();
        if (this._instance._shouldDisableFlags()) {
            // The way this is documented is essentially used to refuse to ever call the /flags endpoint.
            return;
        }
        if (this._requestInFlight) {
            this._additionalReloadRequested = true;
            return;
        }
        const token = this._instance.config.token;
        const data = {
            token: token,
            distinct_id: this._instance.get_distinct_id(),
            groups: this._instance.getGroups(),
            $anon_distinct_id: this.$anon_distinct_id,
            person_properties: {
                ...(((_a = this._instance.persistence) === null || _a === void 0 ? void 0 : _a.get_initial_props()) || {}),
                ...(this._instance.get_property(STORED_PERSON_PROPERTIES_KEY) || {}),
            },
            group_properties: this._instance.get_property(STORED_GROUP_PROPERTIES_KEY),
        };
        if ((options === null || options === void 0 ? void 0 : options.disableFlags) || this._instance.config.advanced_disable_feature_flags) {
            data.disable_flags = true;
        }
        // Add evaluation environments if configured
        if (this._shouldIncludeEvaluationEnvironments()) {
            data.evaluation_environments = this._getValidEvaluationEnvironments();
        }
        // flags supports loading config data with the `config` query param, but if you're using remote config, you
        // don't need to add that parameter because all the config data is loaded from the remote config endpoint.
        const useRemoteConfigWithFlags = this._instance.config.__preview_remote_config;
        const flagsRoute = useRemoteConfigWithFlags ? '/flags/?v=2' : '/flags/?v=2&config=true';
        const queryParams = this._instance.config.advanced_only_evaluate_survey_feature_flags
            ? '&only_evaluate_survey_feature_flags=true'
            : '';
        const url = this._instance.requestRouter.endpointFor('flags', flagsRoute + queryParams);
        if (useRemoteConfigWithFlags) {
            data.timezone = getTimezone();
        }
        this._requestInFlight = true;
        this._instance._send_request({
            method: 'POST',
            url,
            data,
            compression: this._instance.config.disable_compression ? undefined : Compression.Base64,
            timeout: this._instance.config.feature_flag_request_timeout_ms,
            callback: (response) => {
                var _a, _b, _c;
                let errorsLoading = true;
                if (response.statusCode === 200) {
                    // successful request
                    // reset anon_distinct_id after at least a single request with it
                    // makes it through
                    if (!this._additionalReloadRequested) {
                        this.$anon_distinct_id = undefined;
                    }
                    errorsLoading = false;
                }
                this._requestInFlight = false;
                // NB: this block is only reached if this._instance.config.__preview_remote_config is false
                if (!this._flagsCalled) {
                    this._flagsCalled = true;
                    this._instance._onRemoteConfig((_a = response.json) !== null && _a !== void 0 ? _a : {});
                }
                if (data.disable_flags && !this._additionalReloadRequested) {
                    // If flags are disabled then there is no need to call /flags again (flags are the only thing that may change)
                    // UNLESS, an additional reload is requested.
                    return;
                }
                this._flagsLoadedFromRemote = !errorsLoading;
                if (response.json && ((_b = response.json.quotaLimited) === null || _b === void 0 ? void 0 : _b.includes(QuotaLimitedResource.FeatureFlags))) {
                    // log a warning and then early return
                    logger.warn('You have hit your feature flags quota limit, and will not be able to load feature flags until the quota is reset.  Please visit https://posthog.com/docs/billing/limits-alerts to learn more.');
                    return;
                }
                if (!data.disable_flags) {
                    this.receivedFeatureFlags((_c = response.json) !== null && _c !== void 0 ? _c : {}, errorsLoading);
                }
                if (this._additionalReloadRequested) {
                    this._additionalReloadRequested = false;
                    this._callFlagsEndpoint();
                }
            },
        });
    }
    /*
     * Get feature flag's value for user.
     *
     * ### Usage:
     *
     *     if(posthog.getFeatureFlag('my-flag') === 'some-variant') { // do something }
     *
     * @param {Object|String} key Key of the feature flag.
     * @param {Object|String} options (optional) If {send_event: false}, we won't send an $feature_flag_called event to PostHog.
     */
    getFeatureFlag(key, options = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        if (!this._hasLoadedFlags && !(this.getFlags() && this.getFlags().length > 0)) {
            logger.warn('getFeatureFlag for key "' + key + '" failed. Feature flags didn\'t load in time.');
            return undefined;
        }
        const flagValue = this.getFlagVariants()[key];
        const flagReportValue = `${flagValue}`;
        const requestId = this._instance.get_property(PERSISTENCE_FEATURE_FLAG_REQUEST_ID) || undefined;
        const flagCallReported = this._instance.get_property(FLAG_CALL_REPORTED) || {};
        if (options.send_event || !('send_event' in options)) {
            if (!(key in flagCallReported) || !flagCallReported[key].includes(flagReportValue)) {
                if (isArray(flagCallReported[key])) {
                    flagCallReported[key].push(flagReportValue);
                }
                else {
                    flagCallReported[key] = [flagReportValue];
                }
                (_a = this._instance.persistence) === null || _a === void 0 ? void 0 : _a.register({ [FLAG_CALL_REPORTED]: flagCallReported });
                const flagDetails = this.getFeatureFlagDetails(key);
                const properties = {
                    $feature_flag: key,
                    $feature_flag_response: flagValue,
                    $feature_flag_payload: this.getFeatureFlagPayload(key) || null,
                    $feature_flag_request_id: requestId,
                    $feature_flag_bootstrapped_response: ((_c = (_b = this._instance.config.bootstrap) === null || _b === void 0 ? void 0 : _b.featureFlags) === null || _c === void 0 ? void 0 : _c[key]) || null,
                    $feature_flag_bootstrapped_payload: ((_e = (_d = this._instance.config.bootstrap) === null || _d === void 0 ? void 0 : _d.featureFlagPayloads) === null || _e === void 0 ? void 0 : _e[key]) || null,
                    // If we haven't yet received a response from the /flags endpoint, we must have used the bootstrapped value
                    $used_bootstrap_value: !this._flagsLoadedFromRemote,
                };
                if (!isUndefined((_f = flagDetails === null || flagDetails === void 0 ? void 0 : flagDetails.metadata) === null || _f === void 0 ? void 0 : _f.version)) {
                    properties.$feature_flag_version = flagDetails.metadata.version;
                }
                const reason = (_h = (_g = flagDetails === null || flagDetails === void 0 ? void 0 : flagDetails.reason) === null || _g === void 0 ? void 0 : _g.description) !== null && _h !== void 0 ? _h : (_j = flagDetails === null || flagDetails === void 0 ? void 0 : flagDetails.reason) === null || _j === void 0 ? void 0 : _j.code;
                if (reason) {
                    properties.$feature_flag_reason = reason;
                }
                if ((_k = flagDetails === null || flagDetails === void 0 ? void 0 : flagDetails.metadata) === null || _k === void 0 ? void 0 : _k.id) {
                    properties.$feature_flag_id = flagDetails.metadata.id;
                }
                // It's possible that flag values were overridden by calling overrideFeatureFlags.
                // We want to capture the original values in case someone forgets they were using overrides
                // and is wondering why their app is acting weird.
                if (!isUndefined(flagDetails === null || flagDetails === void 0 ? void 0 : flagDetails.original_variant) || !isUndefined(flagDetails === null || flagDetails === void 0 ? void 0 : flagDetails.original_enabled)) {
                    properties.$feature_flag_original_response = !isUndefined(flagDetails.original_variant)
                        ? flagDetails.original_variant
                        : flagDetails.original_enabled;
                }
                if ((_l = flagDetails === null || flagDetails === void 0 ? void 0 : flagDetails.metadata) === null || _l === void 0 ? void 0 : _l.original_payload) {
                    properties.$feature_flag_original_payload = (_m = flagDetails === null || flagDetails === void 0 ? void 0 : flagDetails.metadata) === null || _m === void 0 ? void 0 : _m.original_payload;
                }
                this._instance.capture('$feature_flag_called', properties);
            }
        }
        return flagValue;
    }
    /*
     * Retrieves the details for a feature flag.
     *
     * ### Usage:
     *
     *     const details = getFeatureFlagDetails("my-flag")
     *     console.log(details.metadata.version)
     *     console.log(details.reason)
     *
     * @param {String} key Key of the feature flag.
     */
    getFeatureFlagDetails(key) {
        const details = this.getFlagsWithDetails();
        return details[key];
    }
    getFeatureFlagPayload(key) {
        const payloads = this.getFlagPayloads();
        return payloads[key];
    }
    /*
     * Fetches the payload for a remote config feature flag. This method will bypass any cached values and fetch the latest
     * value from the PostHog API.
     *
     * Note: Because the posthog-js SDK is primarily used with public project API keys, encrypted remote config payloads will
     * be redacted, never decrypted in the response.
     *
     * ### Usage:
     *
     *     getRemoteConfigPayload("home-page-welcome-message", (payload) => console.log(`Fetched remote config: ${payload}`))
     *
     * @param {String} key Key of the feature flag.
     * @param {Function} [callback] The callback function will be called once the remote config feature flag payload has been fetched.
     */
    getRemoteConfigPayload(key, callback) {
        const token = this._instance.config.token;
        const data = {
            distinct_id: this._instance.get_distinct_id(),
            token,
        };
        // Add evaluation environments if configured
        if (this._shouldIncludeEvaluationEnvironments()) {
            data.evaluation_environments = this._getValidEvaluationEnvironments();
        }
        this._instance._send_request({
            method: 'POST',
            url: this._instance.requestRouter.endpointFor('flags', '/flags/?v=2&config=true'),
            data,
            compression: this._instance.config.disable_compression ? undefined : Compression.Base64,
            timeout: this._instance.config.feature_flag_request_timeout_ms,
            callback: (response) => {
                var _a;
                const flagPayloads = (_a = response.json) === null || _a === void 0 ? void 0 : _a['featureFlagPayloads'];
                callback((flagPayloads === null || flagPayloads === void 0 ? void 0 : flagPayloads[key]) || undefined);
            },
        });
    }
    /**
     * See if feature flag is enabled for user.
     *
     * ### Usage:
     *
     *     if(posthog.isFeatureEnabled('beta-feature')) { // do something }
     *
     * @param key Key of the feature flag.
     * @param [options] If {send_event: false}, we won't send an $feature_flag_call event to PostHog.
     * @returns A boolean value indicating whether or not the specified feature flag is enabled. If flag information has not yet been loaded,
     *          or if the specified feature flag is disabled or does not exist, returns undefined.
     */
    isFeatureEnabled(key, options = {}) {
        if (!this._hasLoadedFlags && !(this.getFlags() && this.getFlags().length > 0)) {
            logger.warn('isFeatureEnabled for key "' + key + '" failed. Feature flags didn\'t load in time.');
            return undefined;
        }
        const flagValue = this.getFeatureFlag(key, options);
        return isUndefined(flagValue) ? undefined : !!flagValue;
    }
    addFeatureFlagsHandler(handler) {
        this.featureFlagEventHandlers.push(handler);
    }
    removeFeatureFlagsHandler(handler) {
        this.featureFlagEventHandlers = this.featureFlagEventHandlers.filter((h) => h !== handler);
    }
    receivedFeatureFlags(response, errorsLoading) {
        if (!this._instance.persistence) {
            return;
        }
        this._hasLoadedFlags = true;
        const currentFlags = this.getFlagVariants();
        const currentFlagPayloads = this.getFlagPayloads();
        const currentFlagDetails = this.getFlagsWithDetails();
        parseFlagsResponse(response, this._instance.persistence, currentFlags, currentFlagPayloads, currentFlagDetails);
        this._fireFeatureFlagsCallbacks(errorsLoading);
    }
    /**
     * @deprecated Use overrideFeatureFlags instead. This will be removed in a future version.
     */
    override(flags, suppressWarning = false) {
        logger.warn('override is deprecated. Please use overrideFeatureFlags instead.');
        this.overrideFeatureFlags({
            flags: flags,
            suppressWarning: suppressWarning,
        });
    }
    /**
     * Override feature flags on the client-side. Useful for setting non-persistent feature flags,
     * or for testing/debugging feature flags in the PostHog app.
     *
     * ### Usage:
     *
     *     - posthog.featureFlags.overrideFeatureFlags(false) // clear all overrides
     *     - posthog.featureFlags.overrideFeatureFlags(['beta-feature']) // enable flags
     *     - posthog.featureFlags.overrideFeatureFlags({'beta-feature': 'variant'}) // set variants
     *     - posthog.featureFlags.overrideFeatureFlags({ // set both flags and payloads
     *         flags: {'beta-feature': 'variant'},
     *         payloads: { 'beta-feature': { someData: true } }
     *       })
     *     - posthog.featureFlags.overrideFeatureFlags({ // only override payloads
     *         payloads: { 'beta-feature': { someData: true } }
     *       })
     */
    overrideFeatureFlags(overrideOptions) {
        var _a;
        if (!this._instance.__loaded || !this._instance.persistence) {
            return logger.uninitializedWarning('posthog.featureFlags.overrideFeatureFlags');
        }
        // Clear all overrides if false, lets you do something like posthog.featureFlags.overrideFeatureFlags(false)
        if (overrideOptions === false) {
            this._instance.persistence.unregister(PERSISTENCE_OVERRIDE_FEATURE_FLAGS);
            this._instance.persistence.unregister(PERSISTENCE_OVERRIDE_FEATURE_FLAG_PAYLOADS);
            this._fireFeatureFlagsCallbacks();
            return;
        }
        if (overrideOptions &&
            typeof overrideOptions === 'object' &&
            ('flags' in overrideOptions || 'payloads' in overrideOptions)) {
            const options = overrideOptions;
            this._override_warning = Boolean((_a = options.suppressWarning) !== null && _a !== void 0 ? _a : false);
            // Handle flags if provided, lets you do something like posthog.featureFlags.overrideFeatureFlags({flags: ['beta-feature']})
            if ('flags' in options) {
                if (options.flags === false) {
                    this._instance.persistence.unregister(PERSISTENCE_OVERRIDE_FEATURE_FLAGS);
                }
                else if (options.flags) {
                    if (isArray(options.flags)) {
                        const flagsObj = {};
                        for (let i = 0; i < options.flags.length; i++) {
                            flagsObj[options.flags[i]] = true;
                        }
                        this._instance.persistence.register({ [PERSISTENCE_OVERRIDE_FEATURE_FLAGS]: flagsObj });
                    }
                    else {
                        this._instance.persistence.register({ [PERSISTENCE_OVERRIDE_FEATURE_FLAGS]: options.flags });
                    }
                }
            }
            // Handle payloads independently, lets you do something like posthog.featureFlags.overrideFeatureFlags({payloads: { 'beta-feature': { someData: true } }})
            if ('payloads' in options) {
                if (options.payloads === false) {
                    this._instance.persistence.unregister(PERSISTENCE_OVERRIDE_FEATURE_FLAG_PAYLOADS);
                }
                else if (options.payloads) {
                    this._instance.persistence.register({
                        [PERSISTENCE_OVERRIDE_FEATURE_FLAG_PAYLOADS]: options.payloads,
                    });
                }
            }
            this._fireFeatureFlagsCallbacks();
            return;
        }
        this._fireFeatureFlagsCallbacks();
    }
    /*
     * Register an event listener that runs when feature flags become available or when they change.
     * If there are flags, the listener is called immediately in addition to being called on future changes.
     *
     * ### Usage:
     *
     *     posthog.onFeatureFlags(function(featureFlags, featureFlagsVariants, { errorsLoading }) { // do something })
     *
     * @param {Function} [callback] The callback function will be called once the feature flags are ready or when they are updated.
     *                              It'll return a list of feature flags enabled for the user, the variants,
     *                              and also a context object indicating whether we succeeded to fetch the flags or not.
     * @returns {Function} A function that can be called to unsubscribe the listener. Used by useEffect when the component unmounts.
     */
    onFeatureFlags(callback) {
        this.addFeatureFlagsHandler(callback);
        if (this._hasLoadedFlags) {
            const { flags, flagVariants } = this._prepareFeatureFlagsForCallbacks();
            callback(flags, flagVariants);
        }
        return () => this.removeFeatureFlagsHandler(callback);
    }
    updateEarlyAccessFeatureEnrollment(key, isEnrolled, stage) {
        var _a;
        const existing_early_access_features = this._instance.get_property(PERSISTENCE_EARLY_ACCESS_FEATURES) || [];
        const feature = existing_early_access_features.find((f) => f.flagKey === key);
        const enrollmentPersonProp = {
            [`$feature_enrollment/${key}`]: isEnrolled,
        };
        const properties = {
            $feature_flag: key,
            $feature_enrollment: isEnrolled,
            $set: enrollmentPersonProp,
        };
        if (feature) {
            properties['$early_access_feature_name'] = feature.name;
        }
        if (stage) {
            properties['$feature_enrollment_stage'] = stage;
        }
        this._instance.capture('$feature_enrollment_update', properties);
        this.setPersonPropertiesForFlags(enrollmentPersonProp, false);
        const newFlags = { ...this.getFlagVariants(), [key]: isEnrolled };
        (_a = this._instance.persistence) === null || _a === void 0 ? void 0 : _a.register({
            [PERSISTENCE_ACTIVE_FEATURE_FLAGS]: Object.keys(filterActiveFeatureFlags(newFlags)),
            [ENABLED_FEATURE_FLAGS]: newFlags,
        });
        this._fireFeatureFlagsCallbacks();
    }
    getEarlyAccessFeatures(callback, force_reload = false, stages) {
        const existing_early_access_features = this._instance.get_property(PERSISTENCE_EARLY_ACCESS_FEATURES);
        const stageParams = stages ? `&${stages.map((s) => `stage=${s}`).join('&')}` : '';
        if (!existing_early_access_features || force_reload) {
            this._instance._send_request({
                url: this._instance.requestRouter.endpointFor('api', `/api/early_access_features/?token=${this._instance.config.token}${stageParams}`),
                method: 'GET',
                callback: (response) => {
                    var _a, _b;
                    if (!response.json) {
                        return;
                    }
                    const earlyAccessFeatures = response.json.earlyAccessFeatures;
                    // Unregister first to ensure complete replacement, not merge
                    // This prevents accumulation of stale features in persistence
                    (_a = this._instance.persistence) === null || _a === void 0 ? void 0 : _a.unregister(PERSISTENCE_EARLY_ACCESS_FEATURES);
                    (_b = this._instance.persistence) === null || _b === void 0 ? void 0 : _b.register({ [PERSISTENCE_EARLY_ACCESS_FEATURES]: earlyAccessFeatures });
                    return callback(earlyAccessFeatures);
                },
            });
        }
        else {
            return callback(existing_early_access_features);
        }
    }
    _prepareFeatureFlagsForCallbacks() {
        const flags = this.getFlags();
        const flagVariants = this.getFlagVariants();
        // Return truthy
        const truthyFlags = flags.filter((flag) => flagVariants[flag]);
        const truthyFlagVariants = Object.keys(flagVariants)
            .filter((variantKey) => flagVariants[variantKey])
            .reduce((res, key) => {
            res[key] = flagVariants[key];
            return res;
        }, {});
        return {
            flags: truthyFlags,
            flagVariants: truthyFlagVariants,
        };
    }
    _fireFeatureFlagsCallbacks(errorsLoading) {
        const { flags, flagVariants } = this._prepareFeatureFlagsForCallbacks();
        this.featureFlagEventHandlers.forEach((handler) => handler(flags, flagVariants, { errorsLoading }));
    }
    /**
     * Set override person properties for feature flags.
     * This is used when dealing with new persons / where you don't want to wait for ingestion
     * to update user properties.
     */
    setPersonPropertiesForFlags(properties, reloadFeatureFlags = true) {
        // Get persisted person properties
        const existingProperties = this._instance.get_property(STORED_PERSON_PROPERTIES_KEY) || {};
        this._instance.register({
            [STORED_PERSON_PROPERTIES_KEY]: {
                ...existingProperties,
                ...properties,
            },
        });
        if (reloadFeatureFlags) {
            this._instance.reloadFeatureFlags();
        }
    }
    resetPersonPropertiesForFlags() {
        this._instance.unregister(STORED_PERSON_PROPERTIES_KEY);
    }
    /**
     * Set override group properties for feature flags.
     * This is used when dealing with new groups / where you don't want to wait for ingestion
     * to update properties.
     * Takes in an object, the key of which is the group type.
     * For example:
     *     setGroupPropertiesForFlags({'organization': { name: 'CYZ', employees: '11' } })
     */
    setGroupPropertiesForFlags(properties, reloadFeatureFlags = true) {
        // Get persisted group properties
        const existingProperties = this._instance.get_property(STORED_GROUP_PROPERTIES_KEY) || {};
        if (Object.keys(existingProperties).length !== 0) {
            Object.keys(existingProperties).forEach((groupType) => {
                existingProperties[groupType] = {
                    ...existingProperties[groupType],
                    ...properties[groupType],
                };
                delete properties[groupType];
            });
        }
        this._instance.register({
            [STORED_GROUP_PROPERTIES_KEY]: {
                ...existingProperties,
                ...properties,
            },
        });
        if (reloadFeatureFlags) {
            this._instance.reloadFeatureFlags();
        }
    }
    resetGroupPropertiesForFlags(group_type) {
        if (group_type) {
            const existingProperties = this._instance.get_property(STORED_GROUP_PROPERTIES_KEY) || {};
            this._instance.register({
                [STORED_GROUP_PROPERTIES_KEY]: { ...existingProperties, [group_type]: {} },
            });
        }
        else {
            this._instance.unregister(STORED_GROUP_PROPERTIES_KEY);
        }
    }
    reset() {
        this._hasLoadedFlags = false;
        this._requestInFlight = false;
        this._reloadingDisabled = false;
        this._additionalReloadRequested = false;
        this._flagsCalled = false;
        this._flagsLoadedFromRemote = false;
        this.$anon_distinct_id = undefined;
        this._clearDebouncer();
        this._override_warning = false;
    }
}
