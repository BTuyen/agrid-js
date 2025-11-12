"use strict";
// gecko regex: `(?:bundle|\d+\.js)`: `bundle` is for react native, `\d+\.js` also but specifically for ram bundles because it
// generates filenames without a prefix like `file://` the filenames in the stacktrace are just 42.js
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geckoStackLineParser = void 0;
var base_1 = require("./base");
var safari_1 = require("./safari");
// We need this specific case for now because we want no other regex to match.
var geckoREgex = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i;
var geckoEvalRegex = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
var geckoStackLineParser = function (line) {
    var _a;
    var parts = geckoREgex.exec(line);
    if (parts) {
        var isEval = parts[3] && parts[3].indexOf(' > eval') > -1;
        if (isEval) {
            var subMatch = geckoEvalRegex.exec(parts[3]);
            if (subMatch) {
                // throw out eval line/column and use top-most line number
                parts[1] = parts[1] || 'eval';
                parts[3] = subMatch[1];
                parts[4] = subMatch[2];
                parts[5] = ''; // no column when eval
            }
        }
        var filename = parts[3];
        var func = parts[1] || base_1.UNKNOWN_FUNCTION;
        _a = __read((0, safari_1.extractSafariExtensionDetails)(func, filename), 2), func = _a[0], filename = _a[1];
        return (0, base_1.createFrame)(filename, func, parts[4] ? +parts[4] : undefined, parts[5] ? +parts[5] : undefined);
    }
    return;
};
exports.geckoStackLineParser = geckoStackLineParser;
//# sourceMappingURL=gecko.js.map