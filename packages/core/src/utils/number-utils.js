"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clampToRange = clampToRange;
var type_utils_1 = require("./type-utils");
/**
 * Clamps a value to a range.
 * @param value the value to clamp
 * @param min the minimum value
 * @param max the maximum value
 * @param label if provided then enables logging and prefixes all logs with labels
 * @param fallbackValue if provided then returns this value if the value is not a valid number
 */
function clampToRange(value, min, max, logger, fallbackValue) {
    if (min > max) {
        logger.warn('min cannot be greater than max.');
        min = max;
    }
    if (!(0, type_utils_1.isNumber)(value)) {
        logger.warn(' must be a number. using max or fallback. max: ' + max + ', fallback: ' + fallbackValue);
        return clampToRange(fallbackValue || max, min, max, logger);
    }
    else if (value > max) {
        logger.warn(' cannot be  greater than max: ' + max + '. Using max value instead.');
        return max;
    }
    else if (value < min) {
        logger.warn(' cannot be less than min: ' + min + '. Using min value instead.');
        return min;
    }
    else {
        return value;
    }
}
//# sourceMappingURL=number-utils.js.map