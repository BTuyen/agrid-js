"use strict";
// Portions of this file are derived from getsentry/sentry-javascript by Software, Inc. dba Sentry
// Licensed under the MIT License
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeStackLineParser = exports.opera11StackLineParser = exports.opera10StackLineParser = exports.geckoStackLineParser = exports.winjsStackLineParser = exports.chromeStackLineParser = void 0;
exports.reverseAndStripFrames = reverseAndStripFrames;
exports.createStackParser = createStackParser;
const base_1 = require("./base");
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
const WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
const STACKTRACE_FRAME_LIMIT = 50;
function reverseAndStripFrames(stack) {
    if (!stack.length) {
        return [];
    }
    const localStack = Array.from(stack);
    localStack.reverse();
    return localStack.slice(0, STACKTRACE_FRAME_LIMIT).map((frame) => ({
        ...frame,
        filename: frame.filename || getLastStackFrame(localStack).filename,
        function: frame.function || base_1.UNKNOWN_FUNCTION,
    }));
}
function getLastStackFrame(arr) {
    return arr[arr.length - 1] || {};
}
function createStackParser(...parsers) {
    // const sortedParsers = parsers.sort((a, b) => a[0] - b[0]).map((p) => p[1])
    return (stack, skipFirstLines = 0) => {
        const frames = [];
        const lines = stack.split('\n');
        for (let i = skipFirstLines; i < lines.length; i++) {
            const line = lines[i];
            // Ignore lines over 1kb as they are unlikely to be stack frames.
            // Many of the regular expressions use backtracking which results in run time that increases exponentially with
            // input size. Huge strings can result in hangs/Denial of Service:
            // https://github.com/getsentry/sentry-javascript/issues/2286
            if (line.length > 1024) {
                continue;
            }
            // https://github.com/getsentry/sentry-javascript/issues/5459
            // Remove webpack (error: *) wrappers
            const cleanedLine = WEBPACK_ERROR_REGEXP.test(line) ? line.replace(WEBPACK_ERROR_REGEXP, '$1') : line;
            // https://github.com/getsentry/sentry-javascript/issues/7813
            // Skip Error: lines
            if (cleanedLine.match(/\S*Error: /)) {
                continue;
            }
            for (const parser of parsers) {
                const frame = parser(cleanedLine);
                if (frame) {
                    frames.push(frame);
                    break;
                }
            }
            if (frames.length >= STACKTRACE_FRAME_LIMIT) {
                break;
            }
        }
        return reverseAndStripFrames(frames);
    };
}
//# sourceMappingURL=index.js.map