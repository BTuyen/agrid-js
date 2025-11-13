"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSafariExtensionDetails = void 0;
const base_1 = require("./base");
/**
 * Safari web extensions, starting version unknown, can produce "frames-only" stacktraces.
 * What it means, is that instead of format like:
 *
 * Error: wat
 *   at function@url:row:col
 *   at function@url:row:col
 *   at function@url:row:col
 *
 * it produces something like:
 *
 *   function@url:row:col
 *   function@url:row:col
 *   function@url:row:col
 *
 * Because of that, it won't be captured by `chrome` RegExp and will fall into `Gecko` branch.
 * This function is extracted so that we can use it in both places without duplicating the logic.
 * Unfortunately "just" changing RegExp is too complicated now and making it pass all tests
 * and fix this case seems like an impossible, or at least way too time-consuming task.
 */
const extractSafariExtensionDetails = (func, filename) => {
    const isSafariExtension = func.indexOf('safari-extension') !== -1;
    const isSafariWebExtension = func.indexOf('safari-web-extension') !== -1;
    return isSafariExtension || isSafariWebExtension
        ? [
            func.indexOf('@') !== -1 ? func.split('@')[0] : base_1.UNKNOWN_FUNCTION,
            isSafariExtension ? `safari-extension:${filename}` : `safari-web-extension:${filename}`,
        ]
        : [func, filename];
};
exports.extractSafariExtensionDetails = extractSafariExtensionDetails;
//# sourceMappingURL=safari.js.map