"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._createLogger = void 0;
exports.createLogger = createLogger;
function createConsole(consoleLike) {
    if (consoleLike === void 0) { consoleLike = console; }
    var lockedMethods = {
        log: consoleLike.log.bind(consoleLike),
        warn: consoleLike.warn.bind(consoleLike),
        error: consoleLike.error.bind(consoleLike),
        debug: consoleLike.debug.bind(consoleLike),
    };
    return lockedMethods;
}
var _createLogger = function (prefix, maybeCall, consoleLike) {
    function _log(level) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        maybeCall(function () {
            var consoleMethod = consoleLike[level];
            consoleMethod.apply(void 0, __spreadArray([prefix], __read(args), false));
        });
    }
    var logger = {
        info: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _log.apply(void 0, __spreadArray(['log'], __read(args), false));
        },
        warn: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _log.apply(void 0, __spreadArray(['warn'], __read(args), false));
        },
        error: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _log.apply(void 0, __spreadArray(['error'], __read(args), false));
        },
        critical: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            // Critical errors are always logged to the console
            consoleLike['error'].apply(consoleLike, __spreadArray([prefix], __read(args), false));
        },
        createLogger: function (additionalPrefix) { return (0, exports._createLogger)("".concat(prefix, " ").concat(additionalPrefix), maybeCall, consoleLike); },
    };
    return logger;
};
exports._createLogger = _createLogger;
function createLogger(prefix, maybeCall) {
    return (0, exports._createLogger)(prefix, maybeCall, createConsole());
}
//# sourceMappingURL=logger.js.map