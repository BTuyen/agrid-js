"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opera11StackLineParser = exports.opera10StackLineParser = void 0;
const base_1 = require("./base");
const opera10Regex = / line (\d+).*script (?:in )?(\S+)(?:: in function (\S+))?$/i;
const opera10StackLineParser = (line) => {
    const parts = opera10Regex.exec(line);
    return parts ? (0, base_1.createFrame)(parts[2], parts[3] || base_1.UNKNOWN_FUNCTION, +parts[1]) : undefined;
};
exports.opera10StackLineParser = opera10StackLineParser;
// export const opera10StackLineParser: StackLineParser = [OPERA10_PRIORITY, opera10]
const opera11Regex = / line (\d+), column (\d+)\s*(?:in (?:<anonymous function: ([^>]+)>|([^)]+))\(.*\))? in (.*):\s*$/i;
const opera11StackLineParser = (line) => {
    const parts = opera11Regex.exec(line);
    return parts ? (0, base_1.createFrame)(parts[5], parts[3] || parts[4] || base_1.UNKNOWN_FUNCTION, +parts[1], +parts[2]) : undefined;
};
exports.opera11StackLineParser = opera11StackLineParser;
//# sourceMappingURL=opera.js.map