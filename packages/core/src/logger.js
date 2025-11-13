"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._createLogger = void 0;
exports.createLogger = createLogger;
function createConsole(consoleLike = console) {
    const lockedMethods = {
        log: consoleLike.log.bind(consoleLike),
        warn: consoleLike.warn.bind(consoleLike),
        error: consoleLike.error.bind(consoleLike),
        debug: consoleLike.debug.bind(consoleLike),
    };
    return lockedMethods;
}
const _createLogger = (prefix, maybeCall, consoleLike) => {
    function _log(level, ...args) {
        maybeCall(() => {
            const consoleMethod = consoleLike[level];
            consoleMethod(prefix, ...args);
        });
    }
    const logger = {
        info: (...args) => {
            _log('log', ...args);
        },
        warn: (...args) => {
            _log('warn', ...args);
        },
        error: (...args) => {
            _log('error', ...args);
        },
        critical: (...args) => {
            // Critical errors are always logged to the console
            consoleLike['error'](prefix, ...args);
        },
        createLogger: (additionalPrefix) => (0, exports._createLogger)(`${prefix} ${additionalPrefix}`, maybeCall, consoleLike),
    };
    return logger;
};
exports._createLogger = _createLogger;
function createLogger(prefix, maybeCall) {
    return (0, exports._createLogger)(prefix, maybeCall, createConsole());
}
//# sourceMappingURL=logger.js.map