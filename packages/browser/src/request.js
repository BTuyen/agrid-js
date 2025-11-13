import { each, find } from './utils';
import Config from './config';
import { Compression } from './types';
import { formDataToQuery } from './utils/request-utils';
import { logger } from './utils/logger';
import { AbortController, fetch, navigator, XMLHttpRequest } from './utils/globals';
import { gzipSync, strToU8 } from 'fflate';
import { _base64Encode } from './utils/encode-utils';
// eslint-disable-next-line compat/compat
export const SUPPORTS_REQUEST = !!XMLHttpRequest || !!fetch;
const CONTENT_TYPE_PLAIN = 'text/plain';
const CONTENT_TYPE_JSON = 'application/json';
const CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded';
const SIXTY_FOUR_KILOBYTES = 64 * 1024;
/*
 fetch will fail if we request keepalive with a body greater than 64kb
 sets the threshold lower than that so that
 any overhead doesn't push over the threshold after checking here
*/
const KEEP_ALIVE_THRESHOLD = SIXTY_FOUR_KILOBYTES * 0.8;
/**
 * Extends a URL with additional query parameters
 * @param url - The URL to extend
 * @param params - The parameters to add
 * @param replace - When true (default), new params overwrite existing ones with same key. When false, existing params are preserved.
 * @returns The URL with extended parameters
 */
export const extendURLParams = (url, params, replace = true) => {
    var _a;
    const [baseUrl, search] = url.split('?');
    const newParams = { ...params };
    const updatedSearch = (_a = search === null || search === void 0 ? void 0 : search.split('&').map((pair) => {
        var _a;
        const [key, origValue] = pair.split('=');
        const value = replace ? ((_a = newParams[key]) !== null && _a !== void 0 ? _a : origValue) : origValue;
        delete newParams[key];
        return `${key}=${value}`;
    })) !== null && _a !== void 0 ? _a : [];
    const remaining = formDataToQuery(newParams);
    if (remaining) {
        updatedSearch.push(remaining);
    }
    return `${baseUrl}?${updatedSearch.join('&')}`;
};
export const jsonStringify = (data, space) => {
    // With plain JSON.stringify, we get an exception when a property is a BigInt. This has caused problems for some users,
    // see https://github.com/PostHog/posthog-js/issues/1440
    // To work around this, we convert BigInts to strings before stringifying the data. This is not ideal, as we lose
    // information that this was originally a number, but given ClickHouse doesn't support BigInts, the customer
    // would not be able to operate on these numerically anyway.
    return JSON.stringify(data, (_, value) => (typeof value === 'bigint' ? value.toString() : value), space);
};
const encodeToDataString = (data) => {
    return 'data=' + encodeURIComponent(typeof data === 'string' ? data : jsonStringify(data));
};
const encodePostData = ({ data, compression }) => {
    if (!data) {
        return;
    }
    if (compression === Compression.GZipJS) {
        const gzipData = gzipSync(strToU8(jsonStringify(data)), { mtime: 0 });
        const blob = new Blob([gzipData], { type: CONTENT_TYPE_PLAIN });
        return {
            contentType: CONTENT_TYPE_PLAIN,
            body: blob,
            estimatedSize: blob.size,
        };
    }
    if (compression === Compression.Base64) {
        const b64data = _base64Encode(jsonStringify(data));
        const encodedBody = encodeToDataString(b64data);
        return {
            contentType: CONTENT_TYPE_FORM,
            body: encodedBody,
            estimatedSize: new Blob([encodedBody]).size,
        };
    }
    const jsonBody = jsonStringify(data);
    return {
        contentType: CONTENT_TYPE_JSON,
        body: jsonBody,
        estimatedSize: new Blob([jsonBody]).size,
    };
};
const xhr = (options) => {
    var _a;
    const req = new XMLHttpRequest();
    req.open(options.method || 'GET', options.url, true);
    const { contentType, body } = (_a = encodePostData(options)) !== null && _a !== void 0 ? _a : {};
    each(options.headers, function (headerValue, headerName) {
        req.setRequestHeader(headerName, headerValue);
    });
    if (contentType) {
        req.setRequestHeader('Content-Type', contentType);
    }
    if (options.timeout) {
        req.timeout = options.timeout;
    }
    if (!options.disableXHRCredentials) {
        // send the ph_optout cookie
        // withCredentials cannot be modified until after calling .open on Android and Mobile Safari
        req.withCredentials = true;
    }
    req.onreadystatechange = () => {
        var _a;
        // XMLHttpRequest.DONE == 4, except in safari 4
        if (req.readyState === 4) {
            const response = {
                statusCode: req.status,
                text: req.responseText,
            };
            if (req.status === 200) {
                try {
                    response.json = JSON.parse(req.responseText);
                }
                catch {
                    // logger.error(e)
                }
            }
            (_a = options.callback) === null || _a === void 0 ? void 0 : _a.call(options, response);
        }
    };
    req.send(body);
};
const _fetch = (options) => {
    var _a;
    const { contentType, body, estimatedSize } = (_a = encodePostData(options)) !== null && _a !== void 0 ? _a : {};
    // eslint-disable-next-line compat/compat
    const headers = new Headers();
    each(options.headers, function (headerValue, headerName) {
        headers.append(headerName, headerValue);
    });
    if (contentType) {
        headers.append('Content-Type', contentType);
    }
    const url = options.url;
    let aborter = null;
    if (AbortController) {
        const controller = new AbortController();
        aborter = {
            signal: controller.signal,
            timeout: setTimeout(() => controller.abort(), options.timeout),
        };
    }
    fetch(url, {
        method: (options === null || options === void 0 ? void 0 : options.method) || 'GET',
        headers,
        // if body is greater than 64kb, then fetch with keepalive will error
        // see 8:10:5 at https://fetch.spec.whatwg.org/#http-network-or-cache-fetch,
        // but we do want to set keepalive sometimes as it can  help with success
        // when e.g. a page is being closed
        // so let's get the best of both worlds and only set keepalive for POST requests
        // where the body is less than 64kb
        // NB this is fetch keepalive and not http keepalive
        keepalive: options.method === 'POST' && (estimatedSize || 0) < KEEP_ALIVE_THRESHOLD,
        body,
        signal: aborter === null || aborter === void 0 ? void 0 : aborter.signal,
        ...options.fetchOptions,
    })
        .then((response) => {
        return response.text().then((responseText) => {
            var _a;
            const res = {
                statusCode: response.status,
                text: responseText,
            };
            if (response.status === 200) {
                try {
                    res.json = JSON.parse(responseText);
                }
                catch (e) {
                    logger.error(e);
                }
            }
            (_a = options.callback) === null || _a === void 0 ? void 0 : _a.call(options, res);
        });
    })
        .catch((error) => {
        var _a;
        logger.error(error);
        (_a = options.callback) === null || _a === void 0 ? void 0 : _a.call(options, { statusCode: 0, text: error });
    })
        .finally(() => (aborter ? clearTimeout(aborter.timeout) : null));
    return;
};
const _sendBeacon = (options) => {
    // beacon documentation https://w3c.github.io/beacon/
    // beacons format the message and use the type property
    var _a;
    const url = extendURLParams(options.url, {
        beacon: '1',
    });
    try {
        const { contentType, body } = (_a = encodePostData(options)) !== null && _a !== void 0 ? _a : {};
        // sendBeacon requires a blob so we convert it
        const sendBeaconBody = typeof body === 'string' ? new Blob([body], { type: contentType }) : body;
        navigator.sendBeacon(url, sendBeaconBody);
    }
    catch {
        // send beacon is a best-effort, fire-and-forget mechanism on page unload,
        // we don't want to throw errors here
    }
};
const AVAILABLE_TRANSPORTS = [];
// We add the transports in order of preference
if (fetch) {
    AVAILABLE_TRANSPORTS.push({
        transport: 'fetch',
        method: _fetch,
    });
}
if (XMLHttpRequest) {
    AVAILABLE_TRANSPORTS.push({
        transport: 'XHR',
        method: xhr,
    });
}
if (navigator === null || navigator === void 0 ? void 0 : navigator.sendBeacon) {
    AVAILABLE_TRANSPORTS.push({
        transport: 'sendBeacon',
        method: _sendBeacon,
    });
}
// This is the entrypoint. It takes care of sanitizing the options and then calls the appropriate request method.
export const request = (_options) => {
    var _a, _b, _c;
    // Clone the options so we don't modify the original object
    const options = { ..._options };
    options.timeout = options.timeout || 60000;
    options.url = extendURLParams(options.url, {
        _: new Date().getTime().toString(),
        ver: Config.LIB_VERSION,
        compression: options.compression,
    });
    const transport = (_a = options.transport) !== null && _a !== void 0 ? _a : 'fetch';
    const availableTransports = AVAILABLE_TRANSPORTS.filter((t) => !options.disableTransport || !t.transport || !options.disableTransport.includes(t.transport));
    const transportMethod = (_c = (_b = find(availableTransports, (t) => t.transport === transport)) === null || _b === void 0 ? void 0 : _b.method) !== null && _c !== void 0 ? _c : availableTransports[0].method;
    if (!transportMethod) {
        throw new Error('No available transport method');
    }
    transportMethod(options);
};
