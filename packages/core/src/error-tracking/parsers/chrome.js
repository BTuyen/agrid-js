"use strict";
// This regex matches frames that have no function name (ie. are at the top level of a module).
// For example "at http://localhost:5000//script.js:1:126"
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
exports.chromeStackLineParser = void 0;
var base_1 = require("./base");
var safari_1 = require("./safari");
// Frames _with_ function names usually look as follows: "at commitLayoutEffects (react-dom.development.js:23426:1)"
var chromeRegexNoFnName = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i;
// This regex matches all the frames that have a function name.
var chromeRegex = /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
var chromeEvalRegex = /\((\S*)(?::(\d+))(?::(\d+))\)/;
// Chromium based browsers: Chrome, Brave, new Opera, new Edge
// We cannot call this variable `chrome` because it can conflict with global `chrome` variable in certain environments
// See: https://github.com/getsentry/sentry-javascript/issues/6880
var chromeStackLineParser = function (line) {
    // If the stack line has no function name, we need to parse it differently
    var noFnParts = chromeRegexNoFnName.exec(line);
    if (noFnParts) {
        var _a = __read(noFnParts, 4), filename = _a[1], line_1 = _a[2], col = _a[3];
        return (0, base_1.createFrame)(filename, base_1.UNKNOWN_FUNCTION, +line_1, +col);
    }
    var parts = chromeRegex.exec(line);
    if (parts) {
        var isEval = parts[2] && parts[2].indexOf('eval') === 0; // start of line
        if (isEval) {
            var subMatch = chromeEvalRegex.exec(parts[2]);
            if (subMatch) {
                // throw out eval line/column and use top-most line/column number
                parts[2] = subMatch[1]; // url
                parts[3] = subMatch[2]; // line
                parts[4] = subMatch[3]; // column
            }
        }
        // Kamil: One more hack won't hurt us right? Understanding and adding more rules on top of these regexps right now
        // would be way too time consuming. (TODO: Rewrite whole RegExp to be more readable)
        var _b = __read((0, safari_1.extractSafariExtensionDetails)(parts[1] || base_1.UNKNOWN_FUNCTION, parts[2]), 2), func = _b[0], filename = _b[1];
        return (0, base_1.createFrame)(filename, func, parts[3] ? +parts[3] : undefined, parts[4] ? +parts[4] : undefined);
    }
    return;
};
exports.chromeStackLineParser = chromeStackLineParser;
//# sourceMappingURL=chrome.js.map