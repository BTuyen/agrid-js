import { assignableWindow, window } from '../../utils/globals';
import { createLogger } from '../../utils/logger';
import { EXCEPTION_CAPTURE_ENABLED_SERVER_SIDE } from '../../constants';
import { isUndefined, BucketedRateLimiter, isObject } from '@agrid/core';
const logger = createLogger('[ExceptionAutocapture]');
export class ExceptionObserver {
    constructor(instance) {
        var _a, _b, _c;
        this._startCapturing = () => {
            var _a;
            if (!window || !this.isEnabled || !((_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.errorWrappingFunctions)) {
                return;
            }
            const wrapOnError = assignableWindow.__PosthogExtensions__.errorWrappingFunctions.wrapOnError;
            const wrapUnhandledRejection = assignableWindow.__PosthogExtensions__.errorWrappingFunctions.wrapUnhandledRejection;
            const wrapConsoleError = assignableWindow.__PosthogExtensions__.errorWrappingFunctions.wrapConsoleError;
            try {
                if (!this._unwrapOnError && this._config.capture_unhandled_errors) {
                    this._unwrapOnError = wrapOnError(this.captureException.bind(this));
                }
                if (!this._unwrapUnhandledRejection && this._config.capture_unhandled_rejections) {
                    this._unwrapUnhandledRejection = wrapUnhandledRejection(this.captureException.bind(this));
                }
                if (!this._unwrapConsoleError && this._config.capture_console_errors) {
                    this._unwrapConsoleError = wrapConsoleError(this.captureException.bind(this));
                }
            }
            catch (e) {
                logger.error('failed to start', e);
                this._stopCapturing();
            }
        };
        this._instance = instance;
        this._remoteEnabled = !!((_a = this._instance.persistence) === null || _a === void 0 ? void 0 : _a.props[EXCEPTION_CAPTURE_ENABLED_SERVER_SIDE]);
        this._config = this._requiredConfig();
        // by default captures ten exceptions before rate limiting by exception type
        // refills at a rate of one token / 10 second period
        // e.g. will capture 1 exception rate limited exception every 10 seconds until burst ends
        this._rateLimiter = new BucketedRateLimiter({
            refillRate: (_b = this._instance.config.error_tracking.__exceptionRateLimiterRefillRate) !== null && _b !== void 0 ? _b : 1,
            bucketSize: (_c = this._instance.config.error_tracking.__exceptionRateLimiterBucketSize) !== null && _c !== void 0 ? _c : 10,
            refillInterval: 10000, // ten seconds in milliseconds,
            _logger: logger,
        });
        this.startIfEnabled();
    }
    _requiredConfig() {
        const providedConfig = this._instance.config.capture_exceptions;
        let config = {
            capture_unhandled_errors: false,
            capture_unhandled_rejections: false,
            capture_console_errors: false,
        };
        if (isObject(providedConfig)) {
            config = { ...config, ...providedConfig };
        }
        else if (isUndefined(providedConfig) ? this._remoteEnabled : providedConfig) {
            config = { ...config, capture_unhandled_errors: true, capture_unhandled_rejections: true };
        }
        return config;
    }
    get isEnabled() {
        return (this._config.capture_console_errors ||
            this._config.capture_unhandled_errors ||
            this._config.capture_unhandled_rejections);
    }
    startIfEnabled() {
        if (this.isEnabled) {
            logger.info('enabled');
            this._loadScript(this._startCapturing);
        }
    }
    _loadScript(cb) {
        var _a, _b, _c;
        if ((_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.errorWrappingFunctions) {
            // already loaded
            cb();
        }
        (_c = (_b = assignableWindow.__PosthogExtensions__) === null || _b === void 0 ? void 0 : _b.loadExternalDependency) === null || _c === void 0 ? void 0 : _c.call(_b, this._instance, 'exception-autocapture', (err) => {
            if (err) {
                return logger.error('failed to load script', err);
            }
            cb();
        });
    }
    _stopCapturing() {
        var _a, _b, _c;
        (_a = this._unwrapOnError) === null || _a === void 0 ? void 0 : _a.call(this);
        this._unwrapOnError = undefined;
        (_b = this._unwrapUnhandledRejection) === null || _b === void 0 ? void 0 : _b.call(this);
        this._unwrapUnhandledRejection = undefined;
        (_c = this._unwrapConsoleError) === null || _c === void 0 ? void 0 : _c.call(this);
        this._unwrapConsoleError = undefined;
    }
    onRemoteConfig(response) {
        const autocaptureExceptionsResponse = response.autocaptureExceptions;
        // store this in-memory in case persistence is disabled
        this._remoteEnabled = !!autocaptureExceptionsResponse || false;
        this._config = this._requiredConfig();
        if (this._instance.persistence) {
            this._instance.persistence.register({
                [EXCEPTION_CAPTURE_ENABLED_SERVER_SIDE]: this._remoteEnabled,
            });
        }
        this.startIfEnabled();
    }
    captureException(errorProperties) {
        var _a, _b, _c;
        const exceptionType = (_c = (_b = (_a = errorProperties === null || errorProperties === void 0 ? void 0 : errorProperties.$exception_list) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.type) !== null && _c !== void 0 ? _c : 'Exception';
        const isRateLimited = this._rateLimiter.consumeRateLimit(exceptionType);
        if (isRateLimited) {
            logger.info('Skipping exception capture because of client rate limiting.', {
                exception: exceptionType,
            });
            return;
        }
        this._instance.exceptions.sendExceptionEvent(errorProperties);
    }
}
