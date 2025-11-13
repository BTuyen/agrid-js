function hostnameFromURL(url) {
    try {
        if (typeof url === 'string') {
            return new URL(url).hostname;
        }
        if ('url' in url) {
            return new URL(url.url).hostname;
        }
        return url.hostname;
    }
    catch {
        return null;
    }
}
export function isHostOnDenyList(url, options) {
    var _a;
    const hostname = hostnameFromURL(url);
    const defaultNotDenied = { hostname, isHostDenied: false };
    if (!((_a = options.payloadHostDenyList) === null || _a === void 0 ? void 0 : _a.length) || !(hostname === null || hostname === void 0 ? void 0 : hostname.trim().length)) {
        return defaultNotDenied;
    }
    for (const deny of options.payloadHostDenyList) {
        if (hostname.endsWith(deny)) {
            return { hostname, isHostDenied: true };
        }
    }
    return defaultNotDenied;
}
