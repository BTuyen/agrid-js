"use strict";
// Portions of this file are derived from getsentry/sentry-javascript by Software, Inc. dba Sentry
// Licensed under the MIT License
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeStackLineParser = exports.opera11StackLineParser = exports.opera10StackLineParser = exports.geckoStackLineParser = exports.winjsStackLineParser = exports.chromeStackLineParser = void 0;
exports.reverseAndStripFrames = reverseAndStripFrames;
exports.createStackParser = createStackParser;
var base_1 = require("./base");
var chrome_1 = require("./chrome");
Object.defineProperty(exports, "chromeStackLineParser", { enumerable: true, get: function () { return chrome_1.chromeStackLineParser; } });
var winjs_1 = require("./winjs");
Object.defineProperty(exports, "winjsStackLineParser", { enumerable: true, get: function () { return winjs_1.winjsStackLineParser; } });
var gecko_1 = require("./gecko");
Object.defineProperty(exports, "geckoStackLineParser", { enumerable: true, get: function () { return gecko_1.geckoStackLineParser; } });
var opera_1 = require("./opera");
Object.defineProperty(exports, "opera10StackLineParser", { enumerable: true, get: function () { return opera_1.opera10StackLineParser; } });
Object.defineProperty(exports, "opera11StackLineParser", { enumerable: true, get: function () { return opera_1.opera11StackLineParser; } });
var node_1 = require("./node");
Object.defineProperty(exports, "nodeStackLineParser", { enumerable: true, get: function () { return node_1.nodeStackLineParser; } });
var WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
var STACKTRACE_FRAME_LIMIT = 50;
function reverseAndStripFrames(stack) {
    if (!stack.length) {
        return [];
    }
    var localStack = Array.from(stack);
    localStack.reverse();
    return localStack.slice(0, STACKTRACE_FRAME_LIMIT).map(function (frame) { return (__assign(__assign({}, frame), { filename: frame.filename || getLastStackFrame(localStack).filename, function: frame.function || base_1.UNKNOWN_FUNCTION })); });
}
function getLastStackFrame(arr) {
    return arr[arr.length - 1] || {};
}
function createStackParser() {
    // const sortedParsers = parsers.sort((a, b) => a[0] - b[0]).map((p) => p[1])
    var parsers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parsers[_i] = arguments[_i];
    }
    return function (stack, skipFirstLines) {
        var e_1, _a;
        if (skipFirstLines === void 0) { skipFirstLines = 0; }
        var frames = [];
        var lines = stack.split('\n');
        for (var i = skipFirstLines; i < lines.length; i++) {
            var line = lines[i];
            // Ignore lines over 1kb as they are unlikely to be stack frames.
            // Many of the regular expressions use backtracking which results in run time that increases exponentially with
            // input size. Huge strings can result in hangs/Denial of Service:
            // https://github.com/getsentry/sentry-javascript/issues/2286
            if (line.length > 1024) {
                continue;
            }
            // https://github.com/getsentry/sentry-javascript/issues/5459
            // Remove webpack (error: *) wrappers
            var cleanedLine = WEBPACK_ERROR_REGEXP.test(line) ? line.replace(WEBPACK_ERROR_REGEXP, '$1') : line;
            // https://github.com/getsentry/sentry-javascript/issues/7813
            // Skip Error: lines
            if (cleanedLine.match(/\S*Error: /)) {
                continue;
            }
            try {
                for (var parsers_1 = (e_1 = void 0, __values(parsers)), parsers_1_1 = parsers_1.next(); !parsers_1_1.done; parsers_1_1 = parsers_1.next()) {
                    var parser = parsers_1_1.value;
                    var frame = parser(cleanedLine);
                    if (frame) {
                        frames.push(frame);
                        break;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (parsers_1_1 && !parsers_1_1.done && (_a = parsers_1.return)) _a.call(parsers_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (frames.length >= STACKTRACE_FRAME_LIMIT) {
                break;
            }
        }
        return reverseAndStripFrames(frames);
    };
}
//# sourceMappingURL=index.js.map