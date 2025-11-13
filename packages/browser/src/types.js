export const COPY_AUTOCAPTURE_EVENT = '$copy_autocapture';
export var Compression;
(function (Compression) {
    Compression["GZipJS"] = "gzip-js";
    Compression["Base64"] = "base64";
})(Compression || (Compression = {}));
// levels originally copied from Sentry to work with the sentry integration
// and to avoid relying on a frequently changing @sentry/types dependency
// but provided as an array of literal types, so we can constrain the level below
export const severityLevels = ['fatal', 'error', 'warning', 'log', 'info', 'debug'];
