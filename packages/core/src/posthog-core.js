import { createFlagsResponseFromFlagsAndPayloads, getFeatureFlagValue, getFlagValuesFromFlags, getPayloadsFromFlags, normalizeFlagsResponse, updateFlagValue, } from './featureFlagUtils';
import { Compression, PostHogPersistedProperty } from './types';
import { maybeAdd, PostHogCoreStateless, QuotaLimitedFeature } from './posthog-core-stateless';
import { uuidv7 } from './vendor/uuidv7';
import { isPlainError } from './utils';
export class PostHogCore extends PostHogCoreStateless {
    // options
    sendFeatureFlagEvent;
    flagCallReported = {};
    // internal
    _flagsResponsePromise; // TODO: come back to this, fix typing
    _sessionExpirationTimeSeconds;
    _sessionMaxLengthSeconds = 24 * 60 * 60; // 24 hours
    sessionProps = {};
    constructor(apiKey, options) {
        // Default for stateful mode is to not disable geoip. Only override if explicitly set
        const disableGeoipOption = options?.disableGeoip ?? false;
        // Default for stateful mode is to timeout at 10s. Only override if explicitly set
        const featureFlagsRequestTimeoutMs = options?.featureFlagsRequestTimeoutMs ?? 10000; // 10 seconds
        super(apiKey, { ...options, disableGeoip: disableGeoipOption, featureFlagsRequestTimeoutMs });
        this.sendFeatureFlagEvent = options?.sendFeatureFlagEvent ?? true;
        this._sessionExpirationTimeSeconds = options?.sessionExpirationTimeSeconds ?? 1800; // 30 minutes
    }
    setupBootstrap(options) {
        const bootstrap = options?.bootstrap;
        if (!bootstrap) {
            return;
        }
        // bootstrap options are only set if no persisted values are found
        // this is to prevent overwriting existing values
        if (bootstrap.distinctId) {
            if (bootstrap.isIdentifiedId) {
                const distinctId = this.getPersistedProperty(PostHogPersistedProperty.DistinctId);
                if (!distinctId) {
                    this.setPersistedProperty(PostHogPersistedProperty.DistinctId, bootstrap.distinctId);
                }
            }
            else {
                const anonymousId = this.getPersistedProperty(PostHogPersistedProperty.AnonymousId);
                if (!anonymousId) {
                    this.setPersistedProperty(PostHogPersistedProperty.AnonymousId, bootstrap.distinctId);
                }
            }
        }
        const bootstrapFeatureFlags = bootstrap.featureFlags;
        const bootstrapFeatureFlagPayloads = bootstrap.featureFlagPayloads ?? {};
        if (bootstrapFeatureFlags && Object.keys(bootstrapFeatureFlags).length) {
            const normalizedBootstrapFeatureFlagDetails = createFlagsResponseFromFlagsAndPayloads(bootstrapFeatureFlags, bootstrapFeatureFlagPayloads);
            if (Object.keys(normalizedBootstrapFeatureFlagDetails.flags).length > 0) {
                this.setBootstrappedFeatureFlagDetails(normalizedBootstrapFeatureFlagDetails);
                const currentFeatureFlagDetails = this.getKnownFeatureFlagDetails() || { flags: {}, requestId: undefined };
                const newFeatureFlagDetails = {
                    flags: {
                        ...normalizedBootstrapFeatureFlagDetails.flags,
                        ...currentFeatureFlagDetails.flags,
                    },
                    requestId: normalizedBootstrapFeatureFlagDetails.requestId,
                };
                this.setKnownFeatureFlagDetails(newFeatureFlagDetails);
            }
        }
    }
    clearProps() {
        this.props = undefined;
        this.sessionProps = {};
        this.flagCallReported = {};
    }
    on(event, cb) {
        return this._events.on(event, cb);
    }
    reset(propertiesToKeep) {
        this.wrap(() => {
            const allPropertiesToKeep = [PostHogPersistedProperty.Queue, ...(propertiesToKeep || [])];
            // clean up props
            this.clearProps();
            for (const key of Object.keys(PostHogPersistedProperty)) {
                if (!allPropertiesToKeep.includes(PostHogPersistedProperty[key])) {
                    this.setPersistedProperty(PostHogPersistedProperty[key], null);
                }
            }
            this.reloadFeatureFlags();
        });
    }
    getCommonEventProperties() {
        const featureFlags = this.getFeatureFlags();
        const featureVariantProperties = {};
        if (featureFlags) {
            for (const [feature, variant] of Object.entries(featureFlags)) {
                featureVariantProperties[`$feature/${feature}`] = variant;
            }
        }
        return {
            ...maybeAdd('$active_feature_flags', featureFlags ? Object.keys(featureFlags) : undefined),
            ...featureVariantProperties,
            ...super.getCommonEventProperties(),
        };
    }
    enrichProperties(properties) {
        return {
            ...this.props, // Persisted properties first
            ...this.sessionProps, // Followed by session properties
            ...(properties || {}), // Followed by user specified properties
            ...this.getCommonEventProperties(), // Followed by FF props
            $session_id: this.getSessionId(),
        };
    }
    /**
     * Returns the current session_id.
     *
     * @remarks
     * This should only be used for informative purposes.
     * Any actual internal use case for the session_id should be handled by the sessionManager.
     *
     * @public
     *
     * @returns The stored session ID for the current session. This may be an empty string if the client is not yet fully initialized.
     */
    getSessionId() {
        if (!this._isInitialized) {
            return '';
        }
        let sessionId = this.getPersistedProperty(PostHogPersistedProperty.SessionId);
        const sessionLastTimestamp = this.getPersistedProperty(PostHogPersistedProperty.SessionLastTimestamp) || 0;
        const sessionStartTimestamp = this.getPersistedProperty(PostHogPersistedProperty.SessionStartTimestamp) || 0;
        const now = Date.now();
        const sessionLastDif = now - sessionLastTimestamp;
        const sessionStartDif = now - sessionStartTimestamp;
        if (!sessionId ||
            sessionLastDif > this._sessionExpirationTimeSeconds * 1000 ||
            sessionStartDif > this._sessionMaxLengthSeconds * 1000) {
            sessionId = uuidv7();
            this.setPersistedProperty(PostHogPersistedProperty.SessionId, sessionId);
            this.setPersistedProperty(PostHogPersistedProperty.SessionStartTimestamp, now);
        }
        this.setPersistedProperty(PostHogPersistedProperty.SessionLastTimestamp, now);
        return sessionId;
    }
    resetSessionId() {
        this.wrap(() => {
            this.setPersistedProperty(PostHogPersistedProperty.SessionId, null);
            this.setPersistedProperty(PostHogPersistedProperty.SessionLastTimestamp, null);
            this.setPersistedProperty(PostHogPersistedProperty.SessionStartTimestamp, null);
        });
    }
    /**
     * Returns the current anonymous ID.
     *
     * This is the ID assigned to users before they are identified. It's used to track
     * anonymous users and link them to identified users when they sign up.
     *
     * {@label Identification}
     *
     * @example
     * ```js
     * // get the anonymous ID
     * const anonId = posthog.getAnonymousId()
     * console.log('Anonymous ID:', anonId)
     * ```
     *
     * @public
     *
     * @returns {string} The stored anonymous ID. This may be an empty string if the client is not yet fully initialized.
     */
    getAnonymousId() {
        if (!this._isInitialized) {
            return '';
        }
        let anonId = this.getPersistedProperty(PostHogPersistedProperty.AnonymousId);
        if (!anonId) {
            anonId = uuidv7();
            this.setPersistedProperty(PostHogPersistedProperty.AnonymousId, anonId);
        }
        return anonId;
    }
    /**
     * * @returns {string} The stored distinct ID. This may be an empty string if the client is not yet fully initialized.
     */
    getDistinctId() {
        if (!this._isInitialized) {
            return '';
        }
        return this.getPersistedProperty(PostHogPersistedProperty.DistinctId) || this.getAnonymousId();
    }
    registerForSession(properties) {
        this.sessionProps = {
            ...this.sessionProps,
            ...properties,
        };
    }
    unregisterForSession(property) {
        delete this.sessionProps[property];
    }
    /***
     *** TRACKING
     ***/
    identify(distinctId, properties, options) {
        this.wrap(() => {
            const previousDistinctId = this.getDistinctId();
            distinctId = distinctId || previousDistinctId;
            if (properties?.$groups) {
                this.groups(properties.$groups);
            }
            // promote $set and $set_once to top level
            const userPropsOnce = properties?.$set_once;
            delete properties?.$set_once;
            // if no $set is provided we assume all properties are $set
            const userProps = properties?.$set || properties;
            const allProperties = this.enrichProperties({
                $anon_distinct_id: this.getAnonymousId(),
                ...maybeAdd('$set', userProps),
                ...maybeAdd('$set_once', userPropsOnce),
            });
            if (distinctId !== previousDistinctId) {
                // We keep the AnonymousId to be used by flags calls and identify to link the previousId
                this.setPersistedProperty(PostHogPersistedProperty.AnonymousId, previousDistinctId);
                this.setPersistedProperty(PostHogPersistedProperty.DistinctId, distinctId);
                this.reloadFeatureFlags();
            }
            super.identifyStateless(distinctId, allProperties, options);
        });
    }
    capture(event, properties, options) {
        this.wrap(() => {
            const distinctId = this.getDistinctId();
            if (properties?.$groups) {
                this.groups(properties.$groups);
            }
            const allProperties = this.enrichProperties(properties);
            super.captureStateless(distinctId, event, allProperties, options);
        });
    }
    alias(alias) {
        this.wrap(() => {
            const distinctId = this.getDistinctId();
            const allProperties = this.enrichProperties({});
            super.aliasStateless(alias, distinctId, allProperties);
        });
    }
    autocapture(eventType, elements, properties = {}, options) {
        this.wrap(() => {
            const distinctId = this.getDistinctId();
            const payload = {
                distinct_id: distinctId,
                event: '$autocapture',
                properties: {
                    ...this.enrichProperties(properties),
                    $event_type: eventType,
                    $elements: elements,
                },
            };
            this.enqueue('autocapture', payload, options);
        });
    }
    /***
     *** GROUPS
     ***/
    groups(groups) {
        this.wrap(() => {
            // Get persisted groups
            const existingGroups = this.props.$groups || {};
            this.register({
                $groups: {
                    ...existingGroups,
                    ...groups,
                },
            });
            if (Object.keys(groups).find((type) => existingGroups[type] !== groups[type])) {
                this.reloadFeatureFlags();
            }
        });
    }
    group(groupType, groupKey, groupProperties, options) {
        this.wrap(() => {
            this.groups({
                [groupType]: groupKey,
            });
            if (groupProperties) {
                this.groupIdentify(groupType, groupKey, groupProperties, options);
            }
        });
    }
    groupIdentify(groupType, groupKey, groupProperties, options) {
        this.wrap(() => {
            const distinctId = this.getDistinctId();
            const eventProperties = this.enrichProperties({});
            super.groupIdentifyStateless(groupType, groupKey, groupProperties, options, distinctId, eventProperties);
        });
    }
    /***
     * PROPERTIES
     ***/
    setPersonPropertiesForFlags(properties) {
        this.wrap(() => {
            // Get persisted person properties
            const existingProperties = this.getPersistedProperty(PostHogPersistedProperty.PersonProperties) || {};
            this.setPersistedProperty(PostHogPersistedProperty.PersonProperties, {
                ...existingProperties,
                ...properties,
            });
        });
    }
    resetPersonPropertiesForFlags() {
        this.wrap(() => {
            this.setPersistedProperty(PostHogPersistedProperty.PersonProperties, null);
        });
    }
    setGroupPropertiesForFlags(properties) {
        this.wrap(() => {
            // Get persisted group properties
            const existingProperties = this.getPersistedProperty(PostHogPersistedProperty.GroupProperties) ||
                {};
            if (Object.keys(existingProperties).length !== 0) {
                Object.keys(existingProperties).forEach((groupType) => {
                    existingProperties[groupType] = {
                        ...existingProperties[groupType],
                        ...properties[groupType],
                    };
                    delete properties[groupType];
                });
            }
            this.setPersistedProperty(PostHogPersistedProperty.GroupProperties, {
                ...existingProperties,
                ...properties,
            });
        });
    }
    resetGroupPropertiesForFlags() {
        this.wrap(() => {
            this.setPersistedProperty(PostHogPersistedProperty.GroupProperties, null);
        });
    }
    async remoteConfigAsync() {
        await this._initPromise;
        if (this._remoteConfigResponsePromise) {
            return this._remoteConfigResponsePromise;
        }
        return this._remoteConfigAsync();
    }
    /***
     *** FEATURE FLAGS
     ***/
    async flagsAsync(sendAnonDistinctId = true, fetchConfig = true) {
        await this._initPromise;
        if (this._flagsResponsePromise) {
            return this._flagsResponsePromise;
        }
        return this._flagsAsync(sendAnonDistinctId, fetchConfig);
    }
    cacheSessionReplay(source, response) {
        const sessionReplay = response?.sessionRecording;
        if (sessionReplay) {
            this.setPersistedProperty(PostHogPersistedProperty.SessionReplay, sessionReplay);
            this._logger.info(`Session replay config from ${source}: `, JSON.stringify(sessionReplay));
        }
        else if (typeof sessionReplay === 'boolean' && sessionReplay === false) {
            // if session replay is disabled, we don't need to cache it
            // we need to check for this because the response might be undefined (/flags does not return sessionRecording yet)
            this._logger.info(`Session replay config from ${source} disabled.`);
            this.setPersistedProperty(PostHogPersistedProperty.SessionReplay, null);
        }
    }
    async _remoteConfigAsync() {
        this._remoteConfigResponsePromise = this._initPromise
            .then(() => {
            let remoteConfig = this.getPersistedProperty(PostHogPersistedProperty.RemoteConfig);
            this._logger.info('Cached remote config: ', JSON.stringify(remoteConfig));
            return super.getRemoteConfig().then((response) => {
                if (response) {
                    const remoteConfigWithoutSurveys = { ...response };
                    delete remoteConfigWithoutSurveys.surveys;
                    this._logger.info('Fetched remote config: ', JSON.stringify(remoteConfigWithoutSurveys));
                    if (this.disableSurveys === false) {
                        const surveys = response.surveys;
                        let hasSurveys = true;
                        if (!Array.isArray(surveys)) {
                            // If surveys is not an array, it means there are no surveys (its a boolean instead)
                            this._logger.info('There are no surveys.');
                            hasSurveys = false;
                        }
                        else {
                            this._logger.info('Surveys fetched from remote config: ', JSON.stringify(surveys));
                        }
                        if (hasSurveys) {
                            this.setPersistedProperty(PostHogPersistedProperty.Surveys, surveys);
                        }
                        else {
                            this.setPersistedProperty(PostHogPersistedProperty.Surveys, null);
                        }
                    }
                    else {
                        this.setPersistedProperty(PostHogPersistedProperty.Surveys, null);
                    }
                    // we cache the surveys in its own storage key
                    this.setPersistedProperty(PostHogPersistedProperty.RemoteConfig, remoteConfigWithoutSurveys);
                    this.cacheSessionReplay('remote config', response);
                    // we only dont load flags if the remote config has no feature flags
                    if (response.hasFeatureFlags === false) {
                        // resetting flags to empty object
                        this.setKnownFeatureFlagDetails({ flags: {} });
                        this._logger.warn('Remote config has no feature flags, will not load feature flags.');
                    }
                    else if (this.preloadFeatureFlags !== false) {
                        this.reloadFeatureFlags();
                    }
                    if (!response.supportedCompression?.includes(Compression.GZipJS)) {
                        this.disableCompression = true;
                    }
                    remoteConfig = response;
                }
                return remoteConfig;
            });
        })
            .finally(() => {
            this._remoteConfigResponsePromise = undefined;
        });
        return this._remoteConfigResponsePromise;
    }
    async _flagsAsync(sendAnonDistinctId = true, fetchConfig = true) {
        this._flagsResponsePromise = this._initPromise
            .then(async () => {
            const distinctId = this.getDistinctId();
            const groups = this.props.$groups || {};
            const personProperties = this.getPersistedProperty(PostHogPersistedProperty.PersonProperties) || {};
            const groupProperties = this.getPersistedProperty(PostHogPersistedProperty.GroupProperties) ||
                {};
            const extraProperties = {
                $anon_distinct_id: sendAnonDistinctId ? this.getAnonymousId() : undefined,
            };
            const res = await super.getFlags(distinctId, groups, personProperties, groupProperties, extraProperties, fetchConfig);
            // Add check for quota limitation on feature flags
            if (res?.quotaLimited?.includes(QuotaLimitedFeature.FeatureFlags)) {
                // Unset all feature flags by setting to null
                this.setKnownFeatureFlagDetails(null);
                console.warn('[FEATURE FLAGS] Feature flags quota limit exceeded - unsetting all flags. Learn more about billing limits at https://posthog.com/docs/billing/limits-alerts');
                return res;
            }
            if (res?.featureFlags) {
                // clear flag call reported if we have new flags since they might have changed
                if (this.sendFeatureFlagEvent) {
                    this.flagCallReported = {};
                }
                let newFeatureFlagDetails = res;
                if (res.errorsWhileComputingFlags) {
                    // if not all flags were computed, we upsert flags instead of replacing them
                    const currentFlagDetails = this.getKnownFeatureFlagDetails();
                    this._logger.info('Cached feature flags: ', JSON.stringify(currentFlagDetails));
                    newFeatureFlagDetails = {
                        ...res,
                        flags: { ...currentFlagDetails?.flags, ...res.flags },
                    };
                }
                this.setKnownFeatureFlagDetails(newFeatureFlagDetails);
                // Mark that we hit the /flags endpoint so we can capture this in the $feature_flag_called event
                this.setPersistedProperty(PostHogPersistedProperty.FlagsEndpointWasHit, true);
                this.cacheSessionReplay('flags', res);
            }
            return res;
        })
            .finally(() => {
            this._flagsResponsePromise = undefined;
        });
        return this._flagsResponsePromise;
    }
    // We only store the flags and request id in the feature flag details storage key
    setKnownFeatureFlagDetails(flagsResponse) {
        this.wrap(() => {
            this.setPersistedProperty(PostHogPersistedProperty.FeatureFlagDetails, flagsResponse);
            this._events.emit('featureflags', getFlagValuesFromFlags(flagsResponse?.flags ?? {}));
        });
    }
    getKnownFeatureFlagDetails() {
        const storedDetails = this.getPersistedProperty(PostHogPersistedProperty.FeatureFlagDetails);
        if (!storedDetails) {
            // Rebuild from the stored feature flags and feature flag payloads
            const featureFlags = this.getPersistedProperty(PostHogPersistedProperty.FeatureFlags);
            const featureFlagPayloads = this.getPersistedProperty(PostHogPersistedProperty.FeatureFlagPayloads);
            if (featureFlags === undefined && featureFlagPayloads === undefined) {
                return undefined;
            }
            return createFlagsResponseFromFlagsAndPayloads(featureFlags ?? {}, featureFlagPayloads ?? {});
        }
        return normalizeFlagsResponse(storedDetails);
    }
    getKnownFeatureFlags() {
        const featureFlagDetails = this.getKnownFeatureFlagDetails();
        if (!featureFlagDetails) {
            return undefined;
        }
        return getFlagValuesFromFlags(featureFlagDetails.flags);
    }
    getKnownFeatureFlagPayloads() {
        const featureFlagDetails = this.getKnownFeatureFlagDetails();
        if (!featureFlagDetails) {
            return undefined;
        }
        return getPayloadsFromFlags(featureFlagDetails.flags);
    }
    getBootstrappedFeatureFlagDetails() {
        const details = this.getPersistedProperty(PostHogPersistedProperty.BootstrapFeatureFlagDetails);
        if (!details) {
            return undefined;
        }
        return details;
    }
    setBootstrappedFeatureFlagDetails(details) {
        this.setPersistedProperty(PostHogPersistedProperty.BootstrapFeatureFlagDetails, details);
    }
    getBootstrappedFeatureFlags() {
        const details = this.getBootstrappedFeatureFlagDetails();
        if (!details) {
            return undefined;
        }
        return getFlagValuesFromFlags(details.flags);
    }
    getBootstrappedFeatureFlagPayloads() {
        const details = this.getBootstrappedFeatureFlagDetails();
        if (!details) {
            return undefined;
        }
        return getPayloadsFromFlags(details.flags);
    }
    getFeatureFlag(key) {
        const details = this.getFeatureFlagDetails();
        if (!details) {
            // If we haven't loaded flags yet, or errored out, we respond with undefined
            return undefined;
        }
        const featureFlag = details.flags[key];
        let response = getFeatureFlagValue(featureFlag);
        if (response === undefined) {
            // For cases where the flag is unknown, return false
            response = false;
        }
        if (this.sendFeatureFlagEvent && !this.flagCallReported[key]) {
            const bootstrappedResponse = this.getBootstrappedFeatureFlags()?.[key];
            const bootstrappedPayload = this.getBootstrappedFeatureFlagPayloads()?.[key];
            this.flagCallReported[key] = true;
            this.capture('$feature_flag_called', {
                $feature_flag: key,
                $feature_flag_response: response,
                ...maybeAdd('$feature_flag_id', featureFlag?.metadata?.id),
                ...maybeAdd('$feature_flag_version', featureFlag?.metadata?.version),
                ...maybeAdd('$feature_flag_reason', featureFlag?.reason?.description ?? featureFlag?.reason?.code),
                ...maybeAdd('$feature_flag_bootstrapped_response', bootstrappedResponse),
                ...maybeAdd('$feature_flag_bootstrapped_payload', bootstrappedPayload),
                // If we haven't yet received a response from the /flags endpoint, we must have used the bootstrapped value
                $used_bootstrap_value: !this.getPersistedProperty(PostHogPersistedProperty.FlagsEndpointWasHit),
                ...maybeAdd('$feature_flag_request_id', details.requestId),
            });
        }
        // If we have flags we either return the value (true or string) or false
        return response;
    }
    getFeatureFlagPayload(key) {
        const payloads = this.getFeatureFlagPayloads();
        if (!payloads) {
            return undefined;
        }
        const response = payloads[key];
        // Undefined means a loading or missing data issue. Null means evaluation happened and there was no match
        if (response === undefined) {
            return null;
        }
        return response;
    }
    getFeatureFlagPayloads() {
        return this.getFeatureFlagDetails()?.featureFlagPayloads;
    }
    getFeatureFlags() {
        // NOTE: We don't check for _initPromise here as the function is designed to be
        // callable before the state being loaded anyways
        return this.getFeatureFlagDetails()?.featureFlags;
    }
    getFeatureFlagDetails() {
        // NOTE: We don't check for _initPromise here as the function is designed to be
        // callable before the state being loaded anyways
        let details = this.getKnownFeatureFlagDetails();
        const overriddenFlags = this.getPersistedProperty(PostHogPersistedProperty.OverrideFeatureFlags);
        if (!overriddenFlags) {
            return details;
        }
        details = details ?? { featureFlags: {}, featureFlagPayloads: {}, flags: {} };
        const flags = details.flags ?? {};
        for (const key in overriddenFlags) {
            if (!overriddenFlags[key]) {
                delete flags[key];
            }
            else {
                flags[key] = updateFlagValue(flags[key], overriddenFlags[key]);
            }
        }
        const result = {
            ...details,
            flags,
        };
        return normalizeFlagsResponse(result);
    }
    getFeatureFlagsAndPayloads() {
        const flags = this.getFeatureFlags();
        const payloads = this.getFeatureFlagPayloads();
        return {
            flags,
            payloads,
        };
    }
    isFeatureEnabled(key) {
        const response = this.getFeatureFlag(key);
        if (response === undefined) {
            return undefined;
        }
        return !!response;
    }
    // Used when we want to trigger the reload but we don't care about the result
    reloadFeatureFlags(options) {
        this.flagsAsync(true)
            .then((res) => {
            options?.cb?.(undefined, res?.featureFlags);
        })
            .catch((e) => {
            options?.cb?.(e, undefined);
            if (!options?.cb) {
                this._logger.info('Error reloading feature flags', e);
            }
        });
    }
    async reloadRemoteConfigAsync() {
        return await this.remoteConfigAsync();
    }
    async reloadFeatureFlagsAsync(sendAnonDistinctId) {
        return (await this.flagsAsync(sendAnonDistinctId ?? true))?.featureFlags;
    }
    onFeatureFlags(cb) {
        return this.on('featureflags', async () => {
            const flags = this.getFeatureFlags();
            if (flags) {
                cb(flags);
            }
        });
    }
    onFeatureFlag(key, cb) {
        return this.on('featureflags', async () => {
            const flagResponse = this.getFeatureFlag(key);
            if (flagResponse !== undefined) {
                cb(flagResponse);
            }
        });
    }
    async overrideFeatureFlag(flags) {
        this.wrap(() => {
            if (flags === null) {
                return this.setPersistedProperty(PostHogPersistedProperty.OverrideFeatureFlags, null);
            }
            return this.setPersistedProperty(PostHogPersistedProperty.OverrideFeatureFlags, flags);
        });
    }
    /**
     * Capture a caught exception manually
     *
     * {@label Error tracking}
     *
     * @public
     *
     * @example
     * ```js
     * // Capture a caught exception
     * try {
     *   // something that might throw
     * } catch (error) {
     *   posthog.captureException(error)
     * }
     * ```
     *
     * @example
     * ```js
     * // With additional properties
     * posthog.captureException(error, {
     *   customProperty: 'value',
     *   anotherProperty: ['I', 'can be a list'],
     *   ...
     * })
     * ```
     *
     * @param {Error} error The error to capture
     * @param {Object} [additionalProperties] Any additional properties to add to the error event
     * @returns {CaptureResult} The result of the capture
     */
    captureException(error, additionalProperties) {
        const properties = {
            $exception_level: 'error',
            $exception_list: [
                {
                    type: isPlainError(error) ? error.name : 'Error',
                    value: isPlainError(error) ? error.message : error,
                    mechanism: {
                        handled: true,
                        synthetic: false,
                    },
                },
            ],
            ...additionalProperties,
        };
        this.capture('$exception', properties);
    }
    /**
     * Capture written user feedback for a LLM trace. Numeric values are converted to strings.
     *
     * {@label LLM analytics}
     *
     * @public
     *
     * @param traceId The trace ID to capture feedback for.
     * @param userFeedback The feedback to capture.
     */
    captureTraceFeedback(traceId, userFeedback) {
        this.capture('$ai_feedback', {
            $ai_feedback_text: userFeedback,
            $ai_trace_id: String(traceId),
        });
    }
    /**
     * Capture a metric for a LLM trace. Numeric values are converted to strings.
     *
     * {@label LLM analytics}
     *
     * @public
     *
     * @param traceId The trace ID to capture the metric for.
     * @param metricName The name of the metric to capture.
     * @param metricValue The value of the metric to capture.
     */
    captureTraceMetric(traceId, metricName, metricValue) {
        this.capture('$ai_metric', {
            $ai_metric_name: metricName,
            $ai_metric_value: String(metricValue),
            $ai_trace_id: String(traceId),
        });
    }
}
