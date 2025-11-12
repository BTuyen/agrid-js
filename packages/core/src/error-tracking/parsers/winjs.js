"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.winjsStackLineParser = void 0;
var base_1 = require("./base");
var winjsRegex = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:[-a-z]+):.*?):(\d+)(?::(\d+))?\)?\s*$/i;
var winjsStackLineParser = function (line) {
    var parts = winjsRegex.exec(line);
    return parts
        ? (0, base_1.createFrame)(parts[2], parts[1] || base_1.UNKNOWN_FUNCTION, +parts[3], parts[4] ? +parts[4] : undefined)
        : undefined;
};
exports.winjsStackLineParser = winjsStackLineParser;
//# sourceMappingURL=winjs.js.map