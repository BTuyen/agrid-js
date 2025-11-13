// Portions of this file are derived from getsentry/sentry-javascript by Software, Inc. dba Sentry
// Licensed under the MIT License
import { UNKNOWN_FUNCTION } from './base';
export { chromeStackLineParser } from './chrome';
export { winjsStackLineParser } from './winjs';
export { geckoStackLineParser } from './gecko';
export { opera10StackLineParser, opera11StackLineParser } from './opera';
export { nodeStackLineParser } from './node';
const WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
const STACKTRACE_FRAME_LIMIT = 50;
export function reverseAndStripFrames(stack) {
    if (!stack.length) {
        return [];
    }
    const localStack = Array.from(stack);
    localStack.reverse();
    return localStack.slice(0, STACKTRACE_FRAME_LIMIT).map((frame) => ({
        ...frame,
        filename: frame.filename || getLastStackFrame(localStack).filename,
        function: frame.function || UNKNOWN_FUNCTION,
    }));
}
function getLastStackFrame(arr) {
    return arr[arr.length - 1] || {};
}
export function createStackParser(...parsers) {
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
