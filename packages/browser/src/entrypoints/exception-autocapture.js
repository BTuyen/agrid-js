import { assignableWindow, window } from '../utils/globals';
import { createLogger } from '../utils/logger';
import { buildErrorPropertiesBuilder } from '../posthog-exceptions';
const logger = createLogger('[ExceptionAutocapture]');
const errorPropertiesBuilder = buildErrorPropertiesBuilder();
function errorToProperties({ event, error }) {
    return errorPropertiesBuilder.buildFromUnknown(error || event, {
        mechanism: {
            handled: false,
        },
    });
}
const wrapOnError = (captureFn) => {
    const win = window;
    if (!win) {
        logger.info('window not available, cannot wrap onerror');
    }
    const originalOnError = win.onerror;
    win.onerror = function (...args) {
        var _a;
        const errorProperties = errorToProperties({ event: args[0], error: args[4] });
        captureFn(errorProperties);
        return (_a = originalOnError === null || originalOnError === void 0 ? void 0 : originalOnError(...args)) !== null && _a !== void 0 ? _a : false;
    };
    win.onerror.__POSTHOG_INSTRUMENTED__ = true;
    return () => {
        var _a;
        (_a = win.onerror) === null || _a === void 0 ? true : delete _a.__POSTHOG_INSTRUMENTED__;
        win.onerror = originalOnError;
    };
};
const wrapUnhandledRejection = (captureFn) => {
    const win = window;
    if (!win) {
        logger.info('window not available, cannot wrap onUnhandledRejection');
    }
    const originalOnUnhandledRejection = win.onunhandledrejection;
    win.onunhandledrejection = function (ev) {
        var _a;
        const errorProperties = errorToProperties({ event: ev });
        captureFn(errorProperties);
        return (_a = originalOnUnhandledRejection === null || originalOnUnhandledRejection === void 0 ? void 0 : originalOnUnhandledRejection.apply(win, [ev])) !== null && _a !== void 0 ? _a : false;
    };
    win.onunhandledrejection.__POSTHOG_INSTRUMENTED__ = true;
    return () => {
        var _a;
        (_a = win.onunhandledrejection) === null || _a === void 0 ? true : delete _a.__POSTHOG_INSTRUMENTED__;
        win.onunhandledrejection = originalOnUnhandledRejection;
    };
};
const wrapConsoleError = (captureFn) => {
    const con = console;
    if (!con) {
        logger.info('console not available, cannot wrap console.error');
    }
    const originalConsoleError = con.error;
    con.error = function (...args) {
        const event = args.join(' ');
        const error = args.find((arg) => arg instanceof Error);
        const errorProperties = errorToProperties({ error, event });
        captureFn(errorProperties);
        return originalConsoleError === null || originalConsoleError === void 0 ? void 0 : originalConsoleError(...args);
    };
    con.error.__POSTHOG_INSTRUMENTED__ = true;
    return () => {
        var _a;
        (_a = con.error) === null || _a === void 0 ? true : delete _a.__POSTHOG_INSTRUMENTED__;
        con.error = originalConsoleError;
    };
};
const posthogErrorWrappingFunctions = {
    wrapOnError,
    wrapUnhandledRejection,
    wrapConsoleError,
};
assignableWindow.__PosthogExtensions__ = assignableWindow.__PosthogExtensions__ || {};
assignableWindow.__PosthogExtensions__.errorWrappingFunctions = posthogErrorWrappingFunctions;
// we used to put these on window, and now we put them on __PosthogExtensions__
// but that means that old clients which lazily load this extension are looking in the wrong place
// yuck,
// so we also put them directly on the window
// when 1.161.1 is the oldest version seen in production we can remove this
assignableWindow.posthogErrorWrappingFunctions = posthogErrorWrappingFunctions;
export default posthogErrorWrappingFunctions;
