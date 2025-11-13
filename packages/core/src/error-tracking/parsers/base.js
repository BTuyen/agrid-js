"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNKNOWN_FUNCTION = void 0;
exports.createFrame = createFrame;
const utils_1 = require("@/utils");
exports.UNKNOWN_FUNCTION = '?';
function createFrame(filename, func, lineno, colno) {
    const frame = {
        // TODO: should be a variable here
        platform: 'web:javascript',
        filename,
        function: func === '<anonymous>' ? exports.UNKNOWN_FUNCTION : func,
        in_app: true, // All browser frames are considered in_app
    };
    if (!(0, utils_1.isUndefined)(lineno)) {
        frame.lineno = lineno;
    }
    if (!(0, utils_1.isUndefined)(colno)) {
        frame.colno = colno;
    }
    return frame;
}
//# sourceMappingURL=base.js.map