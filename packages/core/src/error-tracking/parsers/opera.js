"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opera11StackLineParser = exports.opera10StackLineParser = void 0;
var base_1 = require("./base");
var opera10Regex = / line (\d+).*script (?:in )?(\S+)(?:: in function (\S+))?$/i;
var opera10StackLineParser = function (line) {
    var parts = opera10Regex.exec(line);
    return parts ? (0, base_1.createFrame)(parts[2], parts[3] || base_1.UNKNOWN_FUNCTION, +parts[1]) : undefined;
};
exports.opera10StackLineParser = opera10StackLineParser;
// export const opera10StackLineParser: StackLineParser = [OPERA10_PRIORITY, opera10]
var opera11Regex = / line (\d+), column (\d+)\s*(?:in (?:<anonymous function: ([^>]+)>|([^)]+))\(.*\))? in (.*):\s*$/i;
var opera11StackLineParser = function (line) {
    var parts = opera11Regex.exec(line);
    return parts ? (0, base_1.createFrame)(parts[5], parts[3] || parts[4] || base_1.UNKNOWN_FUNCTION, +parts[1], +parts[2]) : undefined;
};
exports.opera11StackLineParser = opera11StackLineParser;
//# sourceMappingURL=opera.js.map