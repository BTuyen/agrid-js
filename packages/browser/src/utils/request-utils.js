import { each } from './';
import { isArray, isFile, isUndefined } from '@agrid/core';
import { logger } from './logger';
import { document } from './globals';
const localDomains = ['localhost', '127.0.0.1'];
/**
 * IE11 doesn't support `new URL`
 * so we can create an anchor element and use that to parse the URL
 * there's a lot of overlap between HTMLHyperlinkElementUtils and URL
 * meaning useful properties like `pathname` are available on both
 */
export const convertToURL = (url) => {
    const location = document === null || document === void 0 ? void 0 : document.createElement('a');
    if (isUndefined(location)) {
        return null;
    }
    location.href = url;
    return location;
};
export const formDataToQuery = function (formdata, arg_separator = '&') {
    let use_val;
    let use_key;
    const tph_arr = [];
    each(formdata, function (val, key) {
        // the key might be literally the string undefined for e.g. if {undefined: 'something'}
        if (isUndefined(val) || isUndefined(key) || key === 'undefined') {
            return;
        }
        use_val = encodeURIComponent(isFile(val) ? val.name : val.toString());
        use_key = encodeURIComponent(key);
        tph_arr[tph_arr.length] = use_key + '=' + use_val;
    });
    return tph_arr.join(arg_separator);
};
// NOTE: Once we get rid of IE11/op_mini we can start using URLSearchParams
export const getQueryParam = function (url, param) {
    const withoutHash = url.split('#')[0] || '';
    // Split only on the first ? to sort problem out for those with multiple ?s
    // and then remove them
    const queryParams = withoutHash.split(/\?(.*)/)[1] || '';
    const cleanedQueryParams = queryParams.replace(/^\?+/g, '');
    const queryParts = cleanedQueryParams.split('&');
    let keyValuePair;
    for (let i = 0; i < queryParts.length; i++) {
        const parts = queryParts[i].split('=');
        if (parts[0] === param) {
            keyValuePair = parts;
            break;
        }
    }
    if (!isArray(keyValuePair) || keyValuePair.length < 2) {
        return '';
    }
    else {
        let result = keyValuePair[1];
        try {
            result = decodeURIComponent(result);
        }
        catch {
            logger.error('Skipping decoding for malformed query param: ' + result);
        }
        return result.replace(/\+/g, ' ');
    }
};
// replace any query params in the url with the provided mask value. Tries to keep the URL as instant as possible,
// including preserving malformed text in most cases
export const maskQueryParams = function (url, maskedParams, mask) {
    if (!url || !maskedParams || !maskedParams.length) {
        return url;
    }
    const splitHash = url.split('#');
    const withoutHash = splitHash[0] || '';
    const hash = splitHash[1];
    const splitQuery = withoutHash.split('?');
    const queryString = splitQuery[1];
    const urlWithoutQueryAndHash = splitQuery[0];
    const queryParts = (queryString || '').split('&');
    // use an array of strings rather than an object to preserve ordering and duplicates
    const paramStrings = [];
    for (let i = 0; i < queryParts.length; i++) {
        const keyValuePair = queryParts[i].split('=');
        if (!isArray(keyValuePair)) {
            continue;
        }
        else if (maskedParams.includes(keyValuePair[0])) {
            paramStrings.push(keyValuePair[0] + '=' + mask);
        }
        else {
            paramStrings.push(queryParts[i]);
        }
    }
    let result = urlWithoutQueryAndHash;
    if (queryString != null) {
        result += '?' + paramStrings.join('&');
    }
    if (hash != null) {
        result += '#' + hash;
    }
    return result;
};
export const _getHashParam = function (hash, param) {
    const matches = hash.match(new RegExp(param + '=([^&]*)'));
    return matches ? matches[1] : null;
};
export const isLocalhost = () => {
    return localDomains.includes(location.hostname);
};
