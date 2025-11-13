// Re-export shared bot detection logic from @posthog/core
import { isBlockedUA as isBlockedUACore } from '@agrid/core';
export { DEFAULT_BLOCKED_UA_STRS, isBlockedUA } from '@agrid/core';
export const isLikelyBot = function (navigator, customBlockedUserAgents) {
    if (!navigator) {
        return false;
    }
    const ua = navigator.userAgent;
    if (ua) {
        if (isBlockedUACore(ua, customBlockedUserAgents)) {
            return true;
        }
    }
    try {
        // eslint-disable-next-line compat/compat
        const uaData = navigator === null || navigator === void 0 ? void 0 : navigator.userAgentData;
        if ((uaData === null || uaData === void 0 ? void 0 : uaData.brands) &&
            uaData.brands.some((brandObj) => isBlockedUACore(brandObj === null || brandObj === void 0 ? void 0 : brandObj.brand, customBlockedUserAgents))) {
            return true;
        }
    }
    catch {
        // ignore the error, we were using experimental browser features
    }
    return !!navigator.webdriver;
    // There's some more enhancements we could make in this area, e.g. it's possible to check if Chrome dev tools are
    // open, which will detect some bots that are trying to mask themselves and might get past the checks above.
    // However, this would give false positives for actual humans who have dev tools open.
    // We could also use the data in navigator.userAgentData.getHighEntropyValues() to detect bots, but we should wait
    // until this stops being experimental. The MDN docs imply that this might eventually require user permission.
    // See https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/getHighEntropyValues
    // It would be very bad if posthog-js caused a permission prompt to appear on every page load.
};
