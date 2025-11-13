function createConsole(consoleLike = console) {
    const lockedMethods = {
        log: consoleLike.log.bind(consoleLike),
        warn: consoleLike.warn.bind(consoleLike),
        error: consoleLike.error.bind(consoleLike),
        debug: consoleLike.debug.bind(consoleLike),
    };
    return lockedMethods;
}
export const _createLogger = (prefix, maybeCall, consoleLike) => {
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
        createLogger: (additionalPrefix) => _createLogger(`${prefix} ${additionalPrefix}`, maybeCall, consoleLike),
    };
    return logger;
};
export function createLogger(prefix, maybeCall) {
    return _createLogger(prefix, maybeCall, createConsole());
}
