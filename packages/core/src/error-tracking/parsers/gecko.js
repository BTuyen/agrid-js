"use strict";
// gecko regex: `(?:bundle|\d+\.js)`: `bundle` is for react native, `\d+\.js` also but specifically for ram bundles because it
// generates filenames without a prefix like `file://` the filenames in the stacktrace are just 42.js
Object.defineProperty(exports, "__esModule", { value: true });
exports.geckoStackLineParser = void 0;
const base_1 = require("./base");
const safari_1 = require("./safari");
// We need this specific case for now because we want no other regex to match.
const geckoREgex = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i;
const geckoEvalRegex = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
const geckoStackLineParser = (line) => {
    const parts = geckoREgex.exec(line);
    if (parts) {
        const isEval = parts[3] && parts[3].indexOf(' > eval') > -1;
        if (isEval) {
            const subMatch = geckoEvalRegex.exec(parts[3]);
            if (subMatch) {
                // throw out eval line/column and use top-most line number
                parts[1] = parts[1] || 'eval';
                parts[3] = subMatch[1];
                parts[4] = subMatch[2];
                parts[5] = ''; // no column when eval
            }
        }
        let filename = parts[3];
        let func = parts[1] || base_1.UNKNOWN_FUNCTION;
        [func, filename] = (0, safari_1.extractSafariExtensionDetails)(func, filename);
        return (0, base_1.createFrame)(filename, func, parts[4] ? +parts[4] : undefined, parts[5] ? +parts[5] : undefined);
    }
    return;
};
exports.geckoStackLineParser = geckoStackLineParser;
//# sourceMappingURL=gecko.js.map