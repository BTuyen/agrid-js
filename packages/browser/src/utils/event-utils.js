import { convertToURL, getQueryParam, maskQueryParams } from './request-utils';
import { isNull, stripLeadingDollar } from '@agrid/core';
import Config from '../config';
import { each, extend, extendArray, stripEmptyProperties } from './index';
import { document, location, userAgent, window } from './globals';
import { detectBrowser, detectBrowserVersion, detectDevice, detectDeviceType, detectOS } from './user-agent-utils';
import { cookieStore } from '../storage';
const URL_REGEX_PREFIX = 'https?://(.*)';
// CAMPAIGN_PARAMS and EVENT_TO_PERSON_PROPERTIES should be kept in sync with
// https://github.com/PostHog/posthog/blob/master/plugin-server/src/utils/db/utils.ts#L60
// The list of campaign parameters that could be considered personal data under e.g. GDPR.
// These can be masked in URLs and properties before being sent to posthog.
export const PERSONAL_DATA_CAMPAIGN_PARAMS = [
    'gclid', // google ads
    'gclsrc', // google ads 360
    'dclid', // google display ads
    'gbraid', // google ads, web to app
    'wbraid', // google ads, app to web
    'fbclid', // facebook
    'msclkid', // microsoft
    'twclid', // twitter
    'li_fat_id', // linkedin
    'igshid', // instagram
    'ttclid', // tiktok
    'rdt_cid', // reddit
    'epik', // pinterest
    'qclid', // quora
    'sccid', // snapchat
    'irclid', // impact
    '_kx', // klaviyo
];
export const CAMPAIGN_PARAMS = extendArray([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gad_source', // google ads source
    'mc_cid', // mailchimp campaign id
], PERSONAL_DATA_CAMPAIGN_PARAMS);
export const EVENT_TO_PERSON_PROPERTIES = [
    // mobile params
    '$app_build',
    '$app_name',
    '$app_namespace',
    '$app_version',
    // web params
    '$browser',
    '$browser_version',
    '$device_type',
    '$current_url',
    '$pathname',
    '$os',
    '$os_name', // $os_name is a special case, it's treated as an alias of $os!
    '$os_version',
    '$referring_domain',
    '$referrer',
    '$screen_height',
    '$screen_width',
    '$viewport_height',
    '$viewport_width',
    '$raw_user_agent',
];
export const MASKED = '<masked>';
// Campaign params that can be read from the cookie store
export const COOKIE_CAMPAIGN_PARAMS = [
    'li_fat_id', // linkedin
];
export function getCampaignParams(customTrackedParams, maskPersonalDataProperties, customPersonalDataProperties) {
    if (!document) {
        return {};
    }
    const paramsToMask = maskPersonalDataProperties
        ? extendArray([], PERSONAL_DATA_CAMPAIGN_PARAMS, customPersonalDataProperties || [])
        : [];
    // Initially get campaign params from the URL
    const urlCampaignParams = _getCampaignParamsFromUrl(maskQueryParams(document.URL, paramsToMask, MASKED), customTrackedParams);
    // But we can also get some of them from the cookie store
    // For example: https://learn.microsoft.com/en-us/linkedin/marketing/conversions/enabling-first-party-cookies?view=li-lms-2025-05#reading-li_fat_id-from-cookies
    const cookieCampaignParams = _getCampaignParamsFromCookie();
    // Prefer the values found in the urlCampaignParams if possible
    // `extend` will override the values if found in the second argument
    return extend(cookieCampaignParams, urlCampaignParams);
}
function _getCampaignParamsFromUrl(url, customParams) {
    const campaign_keywords = CAMPAIGN_PARAMS.concat(customParams || []);
    const params = {};
    each(campaign_keywords, function (kwkey) {
        const kw = getQueryParam(url, kwkey);
        params[kwkey] = kw ? kw : null;
    });
    return params;
}
function _getCampaignParamsFromCookie() {
    const params = {};
    each(COOKIE_CAMPAIGN_PARAMS, function (kwkey) {
        const kw = cookieStore._get(kwkey);
        params[kwkey] = kw ? kw : null;
    });
    return params;
}
function _getSearchEngine(referrer) {
    if (!referrer) {
        return null;
    }
    else {
        if (referrer.search(URL_REGEX_PREFIX + 'google.([^/?]*)') === 0) {
            return 'google';
        }
        else if (referrer.search(URL_REGEX_PREFIX + 'bing.com') === 0) {
            return 'bing';
        }
        else if (referrer.search(URL_REGEX_PREFIX + 'yahoo.com') === 0) {
            return 'yahoo';
        }
        else if (referrer.search(URL_REGEX_PREFIX + 'duckduckgo.com') === 0) {
            return 'duckduckgo';
        }
        else {
            return null;
        }
    }
}
function _getSearchInfoFromReferrer(referrer) {
    const search = _getSearchEngine(referrer);
    const param = search != 'yahoo' ? 'q' : 'p';
    const ret = {};
    if (!isNull(search)) {
        ret['$search_engine'] = search;
        const keyword = document ? getQueryParam(document.referrer, param) : '';
        if (keyword.length) {
            ret['ph_keyword'] = keyword;
        }
    }
    return ret;
}
export function getSearchInfo() {
    const referrer = document === null || document === void 0 ? void 0 : document.referrer;
    if (!referrer) {
        return {};
    }
    return _getSearchInfoFromReferrer(referrer);
}
export function getBrowserLanguage() {
    return (navigator.language || // Any modern browser
        navigator.userLanguage // IE11
    );
}
export function getBrowserLanguagePrefix() {
    const lang = getBrowserLanguage();
    return typeof lang === 'string' ? lang.split('-')[0] : undefined;
}
export function getReferrer() {
    return (document === null || document === void 0 ? void 0 : document.referrer) || '$direct';
}
export function getReferringDomain() {
    var _a;
    if (!(document === null || document === void 0 ? void 0 : document.referrer)) {
        return '$direct';
    }
    return ((_a = convertToURL(document.referrer)) === null || _a === void 0 ? void 0 : _a.host) || '$direct';
}
export function getReferrerInfo() {
    return {
        $referrer: getReferrer(),
        $referring_domain: getReferringDomain(),
    };
}
export function getPersonInfo(maskPersonalDataProperties, customPersonalDataProperties) {
    const paramsToMask = maskPersonalDataProperties
        ? extendArray([], PERSONAL_DATA_CAMPAIGN_PARAMS, customPersonalDataProperties || [])
        : [];
    const url = location === null || location === void 0 ? void 0 : location.href.substring(0, 1000);
    // we're being a bit more economical with bytes here because this is stored in the cookie
    return {
        r: getReferrer().substring(0, 1000),
        u: url ? maskQueryParams(url, paramsToMask, MASKED) : undefined,
    };
}
export function getPersonPropsFromInfo(info) {
    var _a;
    const { r: referrer, u: url } = info;
    const referring_domain = referrer == null ? undefined : referrer == '$direct' ? '$direct' : (_a = convertToURL(referrer)) === null || _a === void 0 ? void 0 : _a.host;
    const props = {
        $referrer: referrer,
        $referring_domain: referring_domain,
    };
    if (url) {
        props['$current_url'] = url;
        const location = convertToURL(url);
        props['$host'] = location === null || location === void 0 ? void 0 : location.host;
        props['$pathname'] = location === null || location === void 0 ? void 0 : location.pathname;
        const campaignParams = _getCampaignParamsFromUrl(url);
        extend(props, campaignParams);
    }
    if (referrer) {
        const searchInfo = _getSearchInfoFromReferrer(referrer);
        extend(props, searchInfo);
    }
    return props;
}
export function getInitialPersonPropsFromInfo(info) {
    const personProps = getPersonPropsFromInfo(info);
    const props = {};
    each(personProps, function (val, key) {
        props[`$initial_${stripLeadingDollar(key)}`] = val;
    });
    return props;
}
export function getTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    catch {
        return undefined;
    }
}
export function getTimezoneOffset() {
    try {
        return new Date().getTimezoneOffset();
    }
    catch {
        return undefined;
    }
}
export function getEventProperties(maskPersonalDataProperties, customPersonalDataProperties) {
    if (!userAgent) {
        return {};
    }
    const paramsToMask = maskPersonalDataProperties
        ? extendArray([], PERSONAL_DATA_CAMPAIGN_PARAMS, customPersonalDataProperties || [])
        : [];
    const [os_name, os_version] = detectOS(userAgent);
    return extend(stripEmptyProperties({
        $os: os_name,
        $os_version: os_version,
        $browser: detectBrowser(userAgent, navigator.vendor),
        $device: detectDevice(userAgent),
        $device_type: detectDeviceType(userAgent),
        $timezone: getTimezone(),
        $timezone_offset: getTimezoneOffset(),
    }), {
        $current_url: maskQueryParams(location === null || location === void 0 ? void 0 : location.href, paramsToMask, MASKED),
        $host: location === null || location === void 0 ? void 0 : location.host,
        $pathname: location === null || location === void 0 ? void 0 : location.pathname,
        $raw_user_agent: userAgent.length > 1000 ? userAgent.substring(0, 997) + '...' : userAgent,
        $browser_version: detectBrowserVersion(userAgent, navigator.vendor),
        $browser_language: getBrowserLanguage(),
        $browser_language_prefix: getBrowserLanguagePrefix(),
        $screen_height: window === null || window === void 0 ? void 0 : window.screen.height,
        $screen_width: window === null || window === void 0 ? void 0 : window.screen.width,
        $viewport_height: window === null || window === void 0 ? void 0 : window.innerHeight,
        $viewport_width: window === null || window === void 0 ? void 0 : window.innerWidth,
        $lib: 'web',
        $lib_version: Config.LIB_VERSION,
        $insert_id: Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10),
        $time: Date.now() / 1000, // epoch time in seconds
    });
}
