import { SimpleEventEmitter } from './eventemitter';
import { getFeatureFlagValue, normalizeFlagsResponse } from './featureFlagUtils';
import { gzipCompress, isGzipSupported } from './gzip';
import { createLogger } from './logger';
import { PostHogPersistedProperty, } from './types';
import { allSettled, assert, currentISOTime, PromiseQueue, removeTrailingSlash, retriable, safeSetTimeout, STRING_FORMAT, } from './utils';
import { uuidv7 } from './vendor/uuidv7';
class PostHogFetchHttpError extends Error {
    response;
    reqByteLength;
    name = 'PostHogFetchHttpError';
    constructor(response, reqByteLength) {
        super('HTTP error while fetching PostHog: status=' + response.status + ', reqByteLength=' + reqByteLength);
        this.response = response;
        this.reqByteLength = reqByteLength;
    }
    get status() {
        return this.response.status;
    }
    get text() {
        return this.response.text();
    }
    get json() {
        return this.response.json();
    }
}
class PostHogFetchNetworkError extends Error {
    error;
    name = 'PostHogFetchNetworkError';
    constructor(error) {
        // TRICKY: "cause" is a newer property but is just ignored otherwise. Cast to any to ignore the type issue.
        // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
        // @ts-ignore
        super('Network error while fetching PostHog', error instanceof Error ? { cause: error } : {});
        this.error = error;
    }
}
export const maybeAdd = (key, value) => value !== undefined ? { [key]: value } : {};
export async function logFlushError(err) {
    if (err instanceof PostHogFetchHttpError) {
        let text = '';
        try {
            text = await err.text;
        }
        catch { }
        console.error(`Error while flushing PostHog: message=${err.message}, response body=${text}`, err);
    }
    else {
        console.error('Error while flushing PostHog', err);
    }
    return Promise.resolve();
}
function isPostHogFetchError(err) {
    return typeof err === 'object' && (err instanceof PostHogFetchHttpError || err instanceof PostHogFetchNetworkError);
}
function isPostHogFetchContentTooLargeError(err) {
    return typeof err === 'object' && err instanceof PostHogFetchHttpError && err.status === 413;
}
export var QuotaLimitedFeature;
(function (QuotaLimitedFeature) {
    QuotaLimitedFeature["FeatureFlags"] = "feature_flags";
    QuotaLimitedFeature["Recordings"] = "recordings";
})(QuotaLimitedFeature || (QuotaLimitedFeature = {}));
export class PostHogCoreStateless {
    // options
    apiKey;
    host;
    flushAt;
    preloadFeatureFlags;
    disableSurveys;
    maxBatchSize;
    maxQueueSize;
    flushInterval;
    flushPromise = null;
    shutdownPromise = null;
    requestTimeout;
    featureFlagsRequestTimeoutMs;
    remoteConfigRequestTimeoutMs;
    removeDebugCallback;
    disableGeoip;
    historicalMigration;
    evaluationEnvironments;
    disabled;
    disableCompression;
    defaultOptIn;
    promiseQueue = new PromiseQueue();
    // internal
    _events = new SimpleEventEmitter();
    _flushTimer;
    _retryOptions;
    _initPromise;
    _isInitialized = false;
    _remoteConfigResponsePromise;
    _logger;
    constructor(apiKey, options = {}) {
        assert(apiKey, "You must pass your PostHog project's api key.");
        this.apiKey = apiKey;
        this.host = removeTrailingSlash(options.host || 'https://us.i.posthog.com');
        this.flushAt = options.flushAt ? Math.max(options.flushAt, 1) : 20;
        this.maxBatchSize = Math.max(this.flushAt, options.maxBatchSize ?? 100);
        this.maxQueueSize = Math.max(this.flushAt, options.maxQueueSize ?? 1000);
        this.flushInterval = options.flushInterval ?? 10000;
        this.preloadFeatureFlags = options.preloadFeatureFlags ?? true;
        // If enable is explicitly set to false we override the optout
        this.defaultOptIn = options.defaultOptIn ?? true;
        this.disableSurveys = options.disableSurveys ?? false;
        this._retryOptions = {
            retryCount: options.fetchRetryCount ?? 3,
            retryDelay: options.fetchRetryDelay ?? 3000, // 3 seconds
            retryCheck: isPostHogFetchError,
        };
        this.requestTimeout = options.requestTimeout ?? 10000; // 10 seconds
        this.featureFlagsRequestTimeoutMs = options.featureFlagsRequestTimeoutMs ?? 3000; // 3 seconds
        this.remoteConfigRequestTimeoutMs = options.remoteConfigRequestTimeoutMs ?? 3000; // 3 seconds
        this.disableGeoip = options.disableGeoip ?? true;
        this.disabled = options.disabled ?? false;
        this.historicalMigration = options?.historicalMigration ?? false;
        this.evaluationEnvironments = options?.evaluationEnvironments;
        // Init promise allows the derived class to block calls until it is ready
        this._initPromise = Promise.resolve();
        this._isInitialized = true;
        this._logger = createLogger('[PostHog]', this.logMsgIfDebug.bind(this));
        this.disableCompression = !isGzipSupported() || (options?.disableCompression ?? false);
    }
    logMsgIfDebug(fn) {
        if (this.isDebug) {
            fn();
        }
    }
    wrap(fn) {
        if (this.disabled) {
            this._logger.warn('The client is disabled');
            return;
        }
        if (this._isInitialized) {
            // NOTE: We could also check for the "opt in" status here...
            return fn();
        }
        this._initPromise.then(() => fn());
    }
    getCommonEventProperties() {
        return {
            $lib: this.getLibraryId(),
            $lib_version: this.getLibraryVersion(),
        };
    }
    get optedOut() {
        return this.getPersistedProperty(PostHogPersistedProperty.OptedOut) ?? !this.defaultOptIn;
    }
    async optIn() {
        this.wrap(() => {
            this.setPersistedProperty(PostHogPersistedProperty.OptedOut, false);
        });
    }
    async optOut() {
        this.wrap(() => {
            this.setPersistedProperty(PostHogPersistedProperty.OptedOut, true);
        });
    }
    on(event, cb) {
        return this._events.on(event, cb);
    }
    /**
     * Enables or disables debug mode for detailed logging.
     *
     * @remarks
     * Debug mode logs all PostHog calls to the console for troubleshooting.
     * This is useful during development to understand what data is being sent.
     *
     * {@label Initialization}
     *
     * @example
     * ```js
     * // enable debug mode
     * posthog.debug(true)
     * ```
     *
     * @example
     * ```js
     * // disable debug mode
     * posthog.debug(false)
     * ```
     *
     * @public
     *
     * @param {boolean} [debug] If true, will enable debug mode.
     */
    debug(enabled = true) {
        this.removeDebugCallback?.();
        if (enabled) {
            const removeDebugCallback = this.on('*', (event, payload) => this._logger.info(event, payload));
            this.removeDebugCallback = () => {
                removeDebugCallback();
                this.removeDebugCallback = undefined;
            };
        }
    }
    get isDebug() {
        return !!this.removeDebugCallback;
    }
    get isDisabled() {
        return this.disabled;
    }
    buildPayload(payload) {
        return {
            distinct_id: payload.distinct_id,
            event: payload.event,
            properties: {
                ...(payload.properties || {}),
                ...this.getCommonEventProperties(), // Common PH props
            },
        };
    }
    addPendingPromise(promise) {
        return this.promiseQueue.add(promise);
    }
    /***
     *** TRACKING
     ***/
    identifyStateless(distinctId, properties, options) {
        this.wrap(() => {
            // The properties passed to identifyStateless are event properties.
            // To add person properties, pass in all person properties to the `$set` and `$set_once` keys.
            const payload = {
                ...this.buildPayload({
                    distinct_id: distinctId,
                    event: '$identify',
                    properties,
                }),
            };
            this.enqueue('identify', payload, options);
        });
    }
    async identifyStatelessImmediate(distinctId, properties, options) {
        const payload = {
            ...this.buildPayload({
                distinct_id: distinctId,
                event: '$identify',
                properties,
            }),
        };
        await this.sendImmediate('identify', payload, options);
    }
    captureStateless(distinctId, event, properties, options) {
        this.wrap(() => {
            const payload = this.buildPayload({ distinct_id: distinctId, event, properties });
            this.enqueue('capture', payload, options);
        });
    }
    async captureStatelessImmediate(distinctId, event, properties, options) {
        const payload = this.buildPayload({ distinct_id: distinctId, event, properties });
        await this.sendImmediate('capture', payload, options);
    }
    aliasStateless(alias, distinctId, properties, options) {
        this.wrap(() => {
            const payload = this.buildPayload({
                event: '$create_alias',
                distinct_id: distinctId,
                properties: {
                    ...(properties || {}),
                    distinct_id: distinctId,
                    alias,
                },
            });
            this.enqueue('alias', payload, options);
        });
    }
    async aliasStatelessImmediate(alias, distinctId, properties, options) {
        const payload = this.buildPayload({
            event: '$create_alias',
            distinct_id: distinctId,
            properties: {
                ...(properties || {}),
                distinct_id: distinctId,
                alias,
            },
        });
        await this.sendImmediate('alias', payload, options);
    }
    /***
     *** GROUPS
     ***/
    groupIdentifyStateless(groupType, groupKey, groupProperties, options, distinctId, eventProperties) {
        this.wrap(() => {
            const payload = this.buildPayload({
                distinct_id: distinctId || `$${groupType}_${groupKey}`,
                event: '$groupidentify',
                properties: {
                    $group_type: groupType,
                    $group_key: groupKey,
                    $group_set: groupProperties || {},
                    ...(eventProperties || {}),
                },
            });
            this.enqueue('capture', payload, options);
        });
    }
    async getRemoteConfig() {
        await this._initPromise;
        let host = this.host;
        if (host === 'https://us.i.posthog.com') {
            host = 'https://us-assets.i.posthog.com';
        }
        else if (host === 'https://eu.i.posthog.com') {
            host = 'https://eu-assets.i.posthog.com';
        }
        const url = `${host}/array/${this.apiKey}/config`;
        const fetchOptions = {
            method: 'GET',
            headers: { ...this.getCustomHeaders(), 'Content-Type': 'application/json' },
        };
        // Don't retry remote config API calls
        return this.fetchWithRetry(url, fetchOptions, { retryCount: 0 }, this.remoteConfigRequestTimeoutMs)
            .then((response) => response.json())
            .catch((error) => {
            this._logger.error('Remote config could not be loaded', error);
            this._events.emit('error', error);
            return undefined;
        });
    }
    /***
     *** FEATURE FLAGS
     ***/
    async getFlags(distinctId, groups = {}, personProperties = {}, groupProperties = {}, extraPayload = {}, fetchConfig = true) {
        await this._initPromise;
        const configParam = fetchConfig ? '&config=true' : '';
        const url = `${this.host}/flags/?v=2${configParam}`;
        const requestData = {
            token: this.apiKey,
            distinct_id: distinctId,
            groups,
            person_properties: personProperties,
            group_properties: groupProperties,
            ...extraPayload,
        };
        // Add evaluation environments if configured
        if (this.evaluationEnvironments && this.evaluationEnvironments.length > 0) {
            requestData.evaluation_environments = this.evaluationEnvironments;
        }
        const fetchOptions = {
            method: 'POST',
            headers: { ...this.getCustomHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
        };
        this._logger.info('Flags URL', url);
        // Don't retry /flags API calls
        return this.fetchWithRetry(url, fetchOptions, { retryCount: 0 }, this.featureFlagsRequestTimeoutMs)
            .then((response) => response.json())
            .then((response) => normalizeFlagsResponse(response))
            .catch((error) => {
            this._events.emit('error', error);
            return undefined;
        });
    }
    async getFeatureFlagStateless(key, distinctId, groups = {}, personProperties = {}, groupProperties = {}, disableGeoip) {
        await this._initPromise;
        const flagDetailResponse = await this.getFeatureFlagDetailStateless(key, distinctId, groups, personProperties, groupProperties, disableGeoip);
        if (flagDetailResponse === undefined) {
            // If we haven't loaded flags yet, or errored out, we respond with undefined
            return {
                response: undefined,
                requestId: undefined,
            };
        }
        let response = getFeatureFlagValue(flagDetailResponse.response);
        if (response === undefined) {
            // For cases where the flag is unknown, return false
            response = false;
        }
        // If we have flags we either return the value (true or string) or false
        return {
            response,
            requestId: flagDetailResponse.requestId,
        };
    }
    async getFeatureFlagDetailStateless(key, distinctId, groups = {}, personProperties = {}, groupProperties = {}, disableGeoip) {
        await this._initPromise;
        const flagsResponse = await this.getFeatureFlagDetailsStateless(distinctId, groups, personProperties, groupProperties, disableGeoip, [key]);
        if (flagsResponse === undefined) {
            return undefined;
        }
        const featureFlags = flagsResponse.flags;
        const flagDetail = featureFlags[key];
        return {
            response: flagDetail,
            requestId: flagsResponse.requestId,
        };
    }
    async getFeatureFlagPayloadStateless(key, distinctId, groups = {}, personProperties = {}, groupProperties = {}, disableGeoip) {
        await this._initPromise;
        const payloads = await this.getFeatureFlagPayloadsStateless(distinctId, groups, personProperties, groupProperties, disableGeoip, [key]);
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
    async getFeatureFlagPayloadsStateless(distinctId, groups = {}, personProperties = {}, groupProperties = {}, disableGeoip, flagKeysToEvaluate) {
        await this._initPromise;
        const payloads = (await this.getFeatureFlagsAndPayloadsStateless(distinctId, groups, personProperties, groupProperties, disableGeoip, flagKeysToEvaluate)).payloads;
        return payloads;
    }
    async getFeatureFlagsStateless(distinctId, groups = {}, personProperties = {}, groupProperties = {}, disableGeoip, flagKeysToEvaluate) {
        await this._initPromise;
        return await this.getFeatureFlagsAndPayloadsStateless(distinctId, groups, personProperties, groupProperties, disableGeoip, flagKeysToEvaluate);
    }
    async getFeatureFlagsAndPayloadsStateless(distinctId, groups = {}, personProperties = {}, groupProperties = {}, disableGeoip, flagKeysToEvaluate) {
        await this._initPromise;
        const featureFlagDetails = await this.getFeatureFlagDetailsStateless(distinctId, groups, personProperties, groupProperties, disableGeoip, flagKeysToEvaluate);
        if (!featureFlagDetails) {
            return {
                flags: undefined,
                payloads: undefined,
                requestId: undefined,
            };
        }
        return {
            flags: featureFlagDetails.featureFlags,
            payloads: featureFlagDetails.featureFlagPayloads,
            requestId: featureFlagDetails.requestId,
        };
    }
    async getFeatureFlagDetailsStateless(distinctId, groups = {}, personProperties = {}, groupProperties = {}, disableGeoip, flagKeysToEvaluate) {
        await this._initPromise;
        const extraPayload = {};
        if (disableGeoip ?? this.disableGeoip) {
            extraPayload['geoip_disable'] = true;
        }
        if (flagKeysToEvaluate) {
            extraPayload['flag_keys_to_evaluate'] = flagKeysToEvaluate;
        }
        const flagsResponse = await this.getFlags(distinctId, groups, personProperties, groupProperties, extraPayload);
        if (flagsResponse === undefined) {
            // We probably errored out, so return undefined
            return undefined;
        }
        // if there's an error on the flagsResponse, log a console error, but don't throw an error
        if (flagsResponse.errorsWhileComputingFlags) {
            console.error('[FEATURE FLAGS] Error while computing feature flags, some flags may be missing or incorrect. Learn more at https://posthog.com/docs/feature-flags/best-practices');
        }
        // Add check for quota limitation on feature flags
        if (flagsResponse.quotaLimited?.includes(QuotaLimitedFeature.FeatureFlags)) {
            console.warn('[FEATURE FLAGS] Feature flags quota limit exceeded - feature flags unavailable. Learn more about billing limits at https://posthog.com/docs/billing/limits-alerts');
            return {
                flags: {},
                featureFlags: {},
                featureFlagPayloads: {},
                requestId: flagsResponse?.requestId,
            };
        }
        return flagsResponse;
    }
    /***
     *** SURVEYS
     ***/
    async getSurveysStateless() {
        await this._initPromise;
        if (this.disableSurveys === true) {
            this._logger.info('Loading surveys is disabled.');
            return [];
        }
        const url = `${this.host}/api/surveys/?token=${this.apiKey}`;
        const fetchOptions = {
            method: 'GET',
            headers: { ...this.getCustomHeaders(), 'Content-Type': 'application/json' },
        };
        const response = await this.fetchWithRetry(url, fetchOptions)
            .then((response) => {
            if (response.status !== 200 || !response.json) {
                const msg = `Surveys API could not be loaded: ${response.status}`;
                const error = new Error(msg);
                this._logger.error(error);
                this._events.emit('error', new Error(msg));
                return undefined;
            }
            return response.json();
        })
            .catch((error) => {
            this._logger.error('Surveys API could not be loaded', error);
            this._events.emit('error', error);
            return undefined;
        });
        const newSurveys = response?.surveys;
        if (newSurveys) {
            this._logger.info('Surveys fetched from API: ', JSON.stringify(newSurveys));
        }
        return newSurveys ?? [];
    }
    /***
     *** SUPER PROPERTIES
     ***/
    _props;
    get props() {
        if (!this._props) {
            this._props = this.getPersistedProperty(PostHogPersistedProperty.Props);
        }
        return this._props || {};
    }
    set props(val) {
        this._props = val;
    }
    async register(properties) {
        this.wrap(() => {
            this.props = {
                ...this.props,
                ...properties,
            };
            this.setPersistedProperty(PostHogPersistedProperty.Props, this.props);
        });
    }
    async unregister(property) {
        this.wrap(() => {
            delete this.props[property];
            this.setPersistedProperty(PostHogPersistedProperty.Props, this.props);
        });
    }
    /***
     *** QUEUEING AND FLUSHING
     ***/
    enqueue(type, _message, options) {
        this.wrap(() => {
            if (this.optedOut) {
                this._events.emit(type, `Library is disabled. Not sending event. To re-enable, call posthog.optIn()`);
                return;
            }
            const message = this.prepareMessage(type, _message, options);
            const queue = this.getPersistedProperty(PostHogPersistedProperty.Queue) || [];
            if (queue.length >= this.maxQueueSize) {
                queue.shift();
                this._logger.info('Queue is full, the oldest event is dropped.');
            }
            queue.push({ message });
            this.setPersistedProperty(PostHogPersistedProperty.Queue, queue);
            this._events.emit(type, message);
            // Flush queued events if we meet the flushAt length
            if (queue.length >= this.flushAt) {
                this.flushBackground();
            }
            if (this.flushInterval && !this._flushTimer) {
                this._flushTimer = safeSetTimeout(() => this.flushBackground(), this.flushInterval);
            }
        });
    }
    async sendImmediate(type, _message, options) {
        if (this.disabled) {
            this._logger.warn('The client is disabled');
            return;
        }
        if (!this._isInitialized) {
            await this._initPromise;
        }
        if (this.optedOut) {
            this._events.emit(type, `Library is disabled. Not sending event. To re-enable, call posthog.optIn()`);
            return;
        }
        const data = {
            api_key: this.apiKey,
            batch: [this.prepareMessage(type, _message, options)],
            sent_at: currentISOTime(),
        };
        if (this.historicalMigration) {
            data.historical_migration = true;
        }
        const payload = JSON.stringify(data);
        const url = `${this.host}/batch/`;
        const gzippedPayload = !this.disableCompression ? await gzipCompress(payload, this.isDebug) : null;
        const fetchOptions = {
            method: 'POST',
            headers: {
                ...this.getCustomHeaders(),
                'Content-Type': 'application/json',
                ...(gzippedPayload !== null && { 'Content-Encoding': 'gzip' }),
            },
            body: gzippedPayload || payload,
        };
        try {
            await this.fetchWithRetry(url, fetchOptions);
        }
        catch (err) {
            this._events.emit('error', err);
        }
    }
    prepareMessage(type, _message, options) {
        const message = {
            ..._message,
            type: type,
            library: this.getLibraryId(),
            library_version: this.getLibraryVersion(),
            timestamp: options?.timestamp ? options?.timestamp : currentISOTime(),
            uuid: options?.uuid ? options.uuid : uuidv7(),
        };
        const addGeoipDisableProperty = options?.disableGeoip ?? this.disableGeoip;
        if (addGeoipDisableProperty) {
            if (!message.properties) {
                message.properties = {};
            }
            message['properties']['$geoip_disable'] = true;
        }
        if (message.distinctId) {
            message.distinct_id = message.distinctId;
            delete message.distinctId;
        }
        return message;
    }
    clearFlushTimer() {
        if (this._flushTimer) {
            clearTimeout(this._flushTimer);
            this._flushTimer = undefined;
        }
    }
    /**
     * Helper for flushing the queue in the background
     * Avoids unnecessary promise errors
     */
    flushBackground() {
        void this.flush().catch(async (err) => {
            await logFlushError(err);
        });
    }
    /**
     * Flushes the queue of pending events.
     *
     * This function will return a promise that will resolve when the flush is complete,
     * or reject if there was an error (for example if the server or network is down).
     *
     * If there is already a flush in progress, this function will wait for that flush to complete.
     *
     * It's recommended to do error handling in the callback of the promise.
     *
     * {@label Initialization}
     *
     * @example
     * ```js
     * // flush with error handling
     * posthog.flush().then(() => {
     *   console.log('Flush complete')
     * }).catch((err) => {
     *   console.error('Flush failed', err)
     * })
     * ```
     *
     * @public
     *
     * @throws PostHogFetchHttpError
     * @throws PostHogFetchNetworkError
     * @throws Error
     */
    async flush() {
        // Wait for the current flush operation to finish (regardless of success or failure), then try to flush again.
        // Use allSettled instead of finally to be defensive around flush throwing errors immediately rather than rejecting.
        // Use a custom allSettled implementation to avoid issues with patching Promise on RN
        const nextFlushPromise = allSettled([this.flushPromise]).then(() => {
            return this._flush();
        });
        this.flushPromise = nextFlushPromise;
        void this.addPendingPromise(nextFlushPromise);
        allSettled([nextFlushPromise]).then(() => {
            // If there are no others waiting to flush, clear the promise.
            // We don't strictly need to do this, but it could make debugging easier
            if (this.flushPromise === nextFlushPromise) {
                this.flushPromise = null;
            }
        });
        return nextFlushPromise;
    }
    getCustomHeaders() {
        // Don't set the user agent if we're not on a browser. The latest spec allows
        // the User-Agent header (see https://fetch.spec.whatwg.org/#terminology-headers
        // and https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/setRequestHeader),
        // but browsers such as Chrome and Safari have not caught up.
        const customUserAgent = this.getCustomUserAgent();
        const headers = {};
        if (customUserAgent && customUserAgent !== '') {
            headers['User-Agent'] = customUserAgent;
        }
        return headers;
    }
    async _flush() {
        this.clearFlushTimer();
        await this._initPromise;
        let queue = this.getPersistedProperty(PostHogPersistedProperty.Queue) || [];
        if (!queue.length) {
            return;
        }
        const sentMessages = [];
        const originalQueueLength = queue.length;
        while (queue.length > 0 && sentMessages.length < originalQueueLength) {
            const batchItems = queue.slice(0, this.maxBatchSize);
            const batchMessages = batchItems.map((item) => item.message);
            const persistQueueChange = () => {
                const refreshedQueue = this.getPersistedProperty(PostHogPersistedProperty.Queue) || [];
                const newQueue = refreshedQueue.slice(batchItems.length);
                this.setPersistedProperty(PostHogPersistedProperty.Queue, newQueue);
                queue = newQueue;
            };
            const data = {
                api_key: this.apiKey,
                batch: batchMessages,
                sent_at: currentISOTime(),
            };
            if (this.historicalMigration) {
                data.historical_migration = true;
            }
            const payload = JSON.stringify(data);
            const url = `${this.host}/batch/`;
            const gzippedPayload = !this.disableCompression ? await gzipCompress(payload, this.isDebug) : null;
            const fetchOptions = {
                method: 'POST',
                headers: {
                    ...this.getCustomHeaders(),
                    'Content-Type': 'application/json',
                    ...(gzippedPayload !== null && { 'Content-Encoding': 'gzip' }),
                },
                body: gzippedPayload || payload,
            };
            const retryOptions = {
                retryCheck: (err) => {
                    // don't automatically retry on 413 errors, we want to reduce the batch size first
                    if (isPostHogFetchContentTooLargeError(err)) {
                        return false;
                    }
                    // otherwise, retry on network errors
                    return isPostHogFetchError(err);
                },
            };
            try {
                await this.fetchWithRetry(url, fetchOptions, retryOptions);
            }
            catch (err) {
                if (isPostHogFetchContentTooLargeError(err) && batchMessages.length > 1) {
                    // if we get a 413 error, we want to reduce the batch size and try again
                    this.maxBatchSize = Math.max(1, Math.floor(batchMessages.length / 2));
                    this._logger.warn(`Received 413 when sending batch of size ${batchMessages.length}, reducing batch size to ${this.maxBatchSize}`);
                    // do not persist the queue change, we want to retry the same batch
                    continue;
                }
                // depending on the error type, eg a malformed JSON or broken queue, it'll always return an error
                // and this will be an endless loop, in this case, if the error isn't a network issue, we always remove the items from the queue
                if (!(err instanceof PostHogFetchNetworkError)) {
                    persistQueueChange();
                }
                this._events.emit('error', err);
                throw err;
            }
            persistQueueChange();
            sentMessages.push(...batchMessages);
        }
        this._events.emit('flush', sentMessages);
    }
    async fetchWithRetry(url, options, retryOptions, requestTimeout) {
        ;
        AbortSignal.timeout ??= function timeout(ms) {
            const ctrl = new AbortController();
            setTimeout(() => ctrl.abort(), ms);
            return ctrl.signal;
        };
        const body = options.body ? options.body : '';
        let reqByteLength = -1;
        try {
            if (body instanceof Blob) {
                reqByteLength = body.size;
            }
            else {
                reqByteLength = Buffer.byteLength(body, STRING_FORMAT);
            }
        }
        catch {
            if (body instanceof Blob) {
                reqByteLength = body.size;
            }
            else {
                const encoded = new TextEncoder().encode(body);
                reqByteLength = encoded.length;
            }
        }
        return await retriable(async () => {
            let res = null;
            try {
                res = await this.fetch(url, {
                    signal: AbortSignal.timeout(requestTimeout ?? this.requestTimeout),
                    ...options,
                });
            }
            catch (e) {
                // fetch will only throw on network errors or on timeouts
                throw new PostHogFetchNetworkError(e);
            }
            // If we're in no-cors mode, we can't access the response status
            // We only throw on HTTP errors if we're not in no-cors mode
            // https://developer.mozilla.org/en-US/docs/Web/API/Request/mode#no-cors
            const isNoCors = options.mode === 'no-cors';
            if (!isNoCors && (res.status < 200 || res.status >= 400)) {
                throw new PostHogFetchHttpError(res, reqByteLength);
            }
            return res;
        }, { ...this._retryOptions, ...retryOptions });
    }
    async _shutdown(shutdownTimeoutMs = 30000) {
        // A little tricky - we want to have a max shutdown time and enforce it, even if that means we have some
        // dangling promises. We'll keep track of the timeout and resolve/reject based on that.
        await this._initPromise;
        let hasTimedOut = false;
        this.clearFlushTimer();
        const doShutdown = async () => {
            try {
                await this.promiseQueue.join();
                while (true) {
                    const queue = this.getPersistedProperty(PostHogPersistedProperty.Queue) || [];
                    if (queue.length === 0) {
                        break;
                    }
                    // flush again to make sure we send all events, some of which might've been added
                    // while we were waiting for the pending promises to resolve
                    // For example, see sendFeatureFlags in posthog-node/src/posthog-node.ts::capture
                    await this.flush();
                    if (hasTimedOut) {
                        break;
                    }
                }
            }
            catch (e) {
                if (!isPostHogFetchError(e)) {
                    throw e;
                }
                await logFlushError(e);
            }
        };
        return Promise.race([
            new Promise((_, reject) => {
                safeSetTimeout(() => {
                    this._logger.error('Timed out while shutting down PostHog');
                    hasTimedOut = true;
                    reject('Timeout while shutting down PostHog. Some events may not have been sent.');
                }, shutdownTimeoutMs);
            }),
            doShutdown(),
        ]);
    }
    /**
     * Shuts down the PostHog instance and ensures all events are sent.
     *
     * Call shutdown() once before the process exits to ensure that all events have been sent and all promises
     * have resolved. Do not use this function if you intend to keep using this PostHog instance after calling it.
     * Use flush() for per-request cleanup instead.
     *
     * {@label Initialization}
     *
     * @example
     * ```js
     * // shutdown before process exit
     * process.on('SIGINT', async () => {
     *   await posthog.shutdown()
     *   process.exit(0)
     * })
     * ```
     *
     * @public
     *
     * @param {number} [shutdownTimeoutMs=30000] Maximum time to wait for shutdown in milliseconds
     * @returns {Promise<void>} A promise that resolves when shutdown is complete
     */
    async shutdown(shutdownTimeoutMs = 30000) {
        if (this.shutdownPromise) {
            this._logger.warn('shutdown() called while already shutting down. shutdown() is meant to be called once before process exit - use flush() for per-request cleanup');
        }
        else {
            this.shutdownPromise = this._shutdown(shutdownTimeoutMs).finally(() => {
                this.shutdownPromise = null;
            });
        }
        return this.shutdownPromise;
    }
}
