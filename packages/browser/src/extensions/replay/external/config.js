import { isFunction, isNullish, isString, isUndefined } from '@agrid/core';
import { convertToURL } from '../../../utils/request-utils';
import { logger } from '../../../utils/logger';
import { shouldCaptureValue } from '../../../autocapture-utils';
import { each } from '../../../utils';
const LOGGER_PREFIX = '[SessionRecording]';
const REDACTED = 'redacted';
export const defaultNetworkOptions = {
    initiatorTypes: [
        'audio',
        'beacon',
        'body',
        'css',
        'early-hint',
        'embed',
        'fetch',
        'frame',
        'iframe',
        'icon',
        'image',
        'img',
        'input',
        'link',
        'navigation',
        'object',
        'ping',
        'script',
        'track',
        'video',
        'xmlhttprequest',
    ],
    maskRequestFn: (data) => data,
    recordHeaders: false,
    recordBody: false,
    recordInitialRequests: false,
    recordPerformance: false,
    performanceEntryTypeToObserve: [
        // 'event', // This is too noisy as it covers all browser events
        'first-input',
        // 'mark', // Mark is used too liberally. We would need to filter for specific marks
        // 'measure', // Measure is used too liberally. We would need to filter for specific measures
        'navigation',
        'paint',
        'resource',
    ],
    payloadSizeLimitBytes: 1000000,
    payloadHostDenyList: [
        '.lr-ingest.io',
        '.ingest.sentry.io',
        '.clarity.ms',
        // NB no leading dot here
        'analytics.google.com',
        'bam.nr-data.net',
    ],
};
const HEADER_DENY_LIST = [
    'authorization',
    'x-forwarded-for',
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-real-ip',
    'remote-addr',
    'forwarded',
    'proxy-authorization',
    'x-csrf-token',
    'x-csrftoken',
    'x-xsrf-token',
];
const PAYLOAD_CONTENT_DENY_LIST = [
    'password',
    'secret',
    'passwd',
    'api_key',
    'apikey',
    'auth',
    'credentials',
    'mysql_pwd',
    'privatekey',
    'private_key',
    'token',
];
// we always remove headers on the deny list because we never want to capture this sensitive data
const removeAuthorizationHeader = (data) => {
    const headers = data.requestHeaders;
    if (!isNullish(headers)) {
        each(Object.keys(headers !== null && headers !== void 0 ? headers : {}), (header) => {
            if (HEADER_DENY_LIST.includes(header.toLowerCase())) {
                headers[header] = REDACTED;
            }
        });
    }
    return data;
};
const POSTHOG_PATHS_TO_IGNORE = ['/s/', '/e/', '/i/'];
// want to ignore posthog paths when capturing requests, or we can get trapped in a loop
// because calls to PostHog would be reported using a call to PostHog which would be reported....
const ignorePostHogPaths = (data, apiHostConfig) => {
    var _a;
    const url = convertToURL(data.name);
    // we need to account for api host config as e.g. pathname could be /ingest/s/ and we want to ignore that
    let replaceValue = apiHostConfig.indexOf('http') === 0 ? (_a = convertToURL(apiHostConfig)) === null || _a === void 0 ? void 0 : _a.pathname : apiHostConfig;
    if (replaceValue === '/') {
        replaceValue = '';
    }
    const pathname = url === null || url === void 0 ? void 0 : url.pathname.replace(replaceValue || '', '');
    if (url && pathname && POSTHOG_PATHS_TO_IGNORE.some((path) => pathname.indexOf(path) === 0)) {
        return undefined;
    }
    return data;
};
function estimateBytes(payload) {
    return new Blob([payload]).size;
}
function enforcePayloadSizeLimit(payload, headers, limit, description) {
    if (isNullish(payload)) {
        return payload;
    }
    let requestContentLength = (headers === null || headers === void 0 ? void 0 : headers['content-length']) || estimateBytes(payload);
    if (isString(requestContentLength)) {
        requestContentLength = parseInt(requestContentLength);
    }
    if (requestContentLength > limit) {
        return LOGGER_PREFIX + ` ${description} body too large to record (${requestContentLength} bytes)`;
    }
    return payload;
}
// people can have arbitrarily large payloads on their site, but we don't want to ingest them
const limitPayloadSize = (options) => {
    var _a;
    // the smallest of 1MB or the specified limit if there is one
    const limit = Math.min(1000000, (_a = options.payloadSizeLimitBytes) !== null && _a !== void 0 ? _a : 1000000);
    return (data) => {
        if (data === null || data === void 0 ? void 0 : data.requestBody) {
            data.requestBody = enforcePayloadSizeLimit(data.requestBody, data.requestHeaders, limit, 'Request');
        }
        if (data === null || data === void 0 ? void 0 : data.responseBody) {
            data.responseBody = enforcePayloadSizeLimit(data.responseBody, data.responseHeaders, limit, 'Response');
        }
        return data;
    };
};
function scrubPayload(payload, label) {
    if (isNullish(payload)) {
        return payload;
    }
    let scrubbed = payload;
    if (!shouldCaptureValue(scrubbed, false)) {
        scrubbed = LOGGER_PREFIX + ' ' + label + ' body ' + REDACTED;
    }
    each(PAYLOAD_CONTENT_DENY_LIST, (text) => {
        if ((scrubbed === null || scrubbed === void 0 ? void 0 : scrubbed.length) && (scrubbed === null || scrubbed === void 0 ? void 0 : scrubbed.indexOf(text)) !== -1) {
            scrubbed = LOGGER_PREFIX + ' ' + label + ' body ' + REDACTED + ' as might contain: ' + text;
        }
    });
    return scrubbed;
}
function scrubPayloads(capturedRequest) {
    if (isUndefined(capturedRequest)) {
        return undefined;
    }
    capturedRequest.requestBody = scrubPayload(capturedRequest.requestBody, 'Request');
    capturedRequest.responseBody = scrubPayload(capturedRequest.responseBody, 'Response');
    return capturedRequest;
}
/**
 *  whether a maskRequestFn is provided or not,
 *  we ensure that we remove the denied header from requests
 *  we _never_ want to record that header by accident
 *  if someone complains then we'll add an opt-in to let them override it
 */
export const buildNetworkRequestOptions = (instanceConfig, remoteNetworkOptions) => {
    const config = {
        payloadSizeLimitBytes: defaultNetworkOptions.payloadSizeLimitBytes,
        performanceEntryTypeToObserve: [...defaultNetworkOptions.performanceEntryTypeToObserve],
        payloadHostDenyList: [
            ...(remoteNetworkOptions.payloadHostDenyList || []),
            ...defaultNetworkOptions.payloadHostDenyList,
        ],
    };
    // client can always disable despite remote options
    const canRecordHeaders = instanceConfig.session_recording.recordHeaders === false ? false : remoteNetworkOptions.recordHeaders;
    const canRecordBody = instanceConfig.session_recording.recordBody === false ? false : remoteNetworkOptions.recordBody;
    const canRecordPerformance = instanceConfig.capture_performance === false ? false : remoteNetworkOptions.recordPerformance;
    const payloadLimiter = limitPayloadSize(config);
    const enforcedCleaningFn = (d) => payloadLimiter(ignorePostHogPaths(removeAuthorizationHeader(d), instanceConfig.api_host));
    const hasDeprecatedMaskFunction = isFunction(instanceConfig.session_recording.maskNetworkRequestFn);
    if (hasDeprecatedMaskFunction && isFunction(instanceConfig.session_recording.maskCapturedNetworkRequestFn)) {
        logger.warn('Both `maskNetworkRequestFn` and `maskCapturedNetworkRequestFn` are defined. `maskNetworkRequestFn` will be ignored.');
    }
    if (hasDeprecatedMaskFunction) {
        instanceConfig.session_recording.maskCapturedNetworkRequestFn = (data) => {
            const cleanedURL = instanceConfig.session_recording.maskNetworkRequestFn({ url: data.name });
            return {
                ...data,
                name: cleanedURL === null || cleanedURL === void 0 ? void 0 : cleanedURL.url,
            };
        };
    }
    config.maskRequestFn = isFunction(instanceConfig.session_recording.maskCapturedNetworkRequestFn)
        ? (data) => {
            var _a, _b, _c;
            const cleanedRequest = enforcedCleaningFn(data);
            return cleanedRequest
                ? ((_c = (_b = (_a = instanceConfig.session_recording).maskCapturedNetworkRequestFn) === null || _b === void 0 ? void 0 : _b.call(_a, cleanedRequest)) !== null && _c !== void 0 ? _c : undefined)
                : undefined;
        }
        : (data) => scrubPayloads(enforcedCleaningFn(data));
    return {
        ...defaultNetworkOptions,
        ...config,
        recordHeaders: canRecordHeaders,
        recordBody: canRecordBody,
        recordPerformance: canRecordPerformance,
        recordInitialRequests: canRecordPerformance,
    };
};
