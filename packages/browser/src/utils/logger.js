import Config from '../config';
import { isUndefined } from '@agrid/core';
import { assignableWindow, window } from './globals';
const _createLogger = (prefix) => {
    const logger = {
        _log: (level, ...args) => {
            if (window &&
                (Config.DEBUG || assignableWindow.POSTHOG_DEBUG) &&
                !isUndefined(window.console) &&
                window.console) {
                const consoleLog = '__rrweb_original__' in window.console[level]
                    ? window.console[level]['__rrweb_original__']
                    : window.console[level];
                // eslint-disable-next-line no-console
                consoleLog(prefix, ...args);
            }
        },
        info: (...args) => {
            logger._log('log', ...args);
        },
        warn: (...args) => {
            logger._log('warn', ...args);
        },
        error: (...args) => {
            logger._log('error', ...args);
        },
        critical: (...args) => {
            // Critical errors are always logged to the console
            // eslint-disable-next-line no-console
            console.error(prefix, ...args);
        },
        uninitializedWarning: (methodName) => {
            logger.error(`You must initialize PostHog before calling ${methodName}`);
        },
        createLogger: (additionalPrefix) => _createLogger(`${prefix} ${additionalPrefix}`),
    };
    return logger;
};
export const logger = _createLogger('[PostHog.js]');
export const createLogger = logger.createLogger;
