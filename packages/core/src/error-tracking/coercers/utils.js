"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncate = truncate;
exports.extractExceptionKeysForMessage = extractExceptionKeysForMessage;
function truncate(str, max) {
    if (max === void 0) { max = 0; }
    if (typeof str !== 'string' || max === 0) {
        return str;
    }
    return str.length <= max ? str : "".concat(str.slice(0, max), "...");
}
/**
 * Given any captured exception, extract its keys and create a sorted
 * and truncated list that will be used inside the event message.
 * eg. `Non-error exception captured with keys: foo, bar, baz`
 */
function extractExceptionKeysForMessage(err, maxLength) {
    if (maxLength === void 0) { maxLength = 40; }
    var keys = Object.keys(err);
    keys.sort();
    if (!keys.length) {
        return '[object has no keys]';
    }
    for (var i = keys.length; i > 0; i--) {
        var serialized = keys.slice(0, i).join(', ');
        if (serialized.length > maxLength) {
            continue;
        }
        if (i === keys.length) {
            return serialized;
        }
        return serialized.length <= maxLength ? serialized : "".concat(serialized.slice(0, maxLength), "...");
    }
    return '';
}
//# sourceMappingURL=utils.js.map