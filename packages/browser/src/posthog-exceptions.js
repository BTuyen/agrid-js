import { ERROR_TRACKING_CAPTURE_EXTENSION_EXCEPTIONS, ERROR_TRACKING_SUPPRESSION_RULES } from './constants';
import { createLogger } from './utils/logger';
import { propertyComparisons } from './utils/property-utils';
import { isString, isArray, ErrorTracking, isNullish } from '@agrid/core';
const logger = createLogger('[Error tracking]');
export function buildErrorPropertiesBuilder() {
    return new ErrorTracking.ErrorPropertiesBuilder([
        new ErrorTracking.DOMExceptionCoercer(),
        new ErrorTracking.PromiseRejectionEventCoercer(),
        new ErrorTracking.ErrorEventCoercer(),
        new ErrorTracking.ErrorCoercer(),
        new ErrorTracking.EventCoercer(),
        new ErrorTracking.ObjectCoercer(),
        new ErrorTracking.StringCoercer(),
        new ErrorTracking.PrimitiveCoercer(),
    ], [ErrorTracking.chromeStackLineParser, ErrorTracking.geckoStackLineParser]);
}
export class PostHogExceptions {
    constructor(instance) {
        var _a, _b;
        this._suppressionRules = [];
        this._errorPropertiesBuilder = buildErrorPropertiesBuilder();
        this._instance = instance;
        this._suppressionRules = (_b = (_a = this._instance.persistence) === null || _a === void 0 ? void 0 : _a.get_property(ERROR_TRACKING_SUPPRESSION_RULES)) !== null && _b !== void 0 ? _b : [];
    }
    onRemoteConfig(response) {
        var _a, _b, _c;
        const suppressionRules = (_b = (_a = response.errorTracking) === null || _a === void 0 ? void 0 : _a.suppressionRules) !== null && _b !== void 0 ? _b : [];
        const captureExtensionExceptions = (_c = response.errorTracking) === null || _c === void 0 ? void 0 : _c.captureExtensionExceptions;
        // store this in-memory in case persistence is disabled
        this._suppressionRules = suppressionRules;
        if (this._instance.persistence) {
            this._instance.persistence.register({
                [ERROR_TRACKING_SUPPRESSION_RULES]: this._suppressionRules,
                [ERROR_TRACKING_CAPTURE_EXTENSION_EXCEPTIONS]: captureExtensionExceptions,
            });
        }
    }
    get _captureExtensionExceptions() {
        var _a;
        const enabled_server_side = !!this._instance.get_property(ERROR_TRACKING_CAPTURE_EXTENSION_EXCEPTIONS);
        const enabled_client_side = this._instance.config.error_tracking.captureExtensionExceptions;
        return (_a = enabled_client_side !== null && enabled_client_side !== void 0 ? enabled_client_side : enabled_server_side) !== null && _a !== void 0 ? _a : false;
    }
    buildProperties(input, metadata) {
        return this._errorPropertiesBuilder.buildFromUnknown(input, {
            syntheticException: metadata === null || metadata === void 0 ? void 0 : metadata.syntheticException,
            mechanism: {
                handled: metadata === null || metadata === void 0 ? void 0 : metadata.handled,
            },
        });
    }
    sendExceptionEvent(properties) {
        const exceptionList = properties.$exception_list;
        if (this._isExceptionList(exceptionList)) {
            if (this._matchesSuppressionRule(exceptionList)) {
                logger.info('Skipping exception capture because a suppression rule matched');
                return;
            }
            if (!this._captureExtensionExceptions && this._isExtensionException(exceptionList)) {
                logger.info('Skipping exception capture because it was thrown by an extension');
                return;
            }
            if (!this._instance.config.error_tracking.__capturePostHogExceptions &&
                this._isPostHogException(exceptionList)) {
                logger.info('Skipping exception capture because it was thrown by the PostHog SDK');
                return;
            }
        }
        return this._instance.capture('$exception', properties, {
            _noTruncate: true,
            _batchKey: 'exceptionEvent',
        });
    }
    _matchesSuppressionRule(exceptionList) {
        if (exceptionList.length === 0) {
            return false;
        }
        const exceptionValues = exceptionList.reduce((acc, { type, value }) => {
            if (isString(type) && type.length > 0) {
                acc['$exception_types'].push(type);
            }
            if (isString(value) && value.length > 0) {
                acc['$exception_values'].push(value);
            }
            return acc;
        }, {
            $exception_types: [],
            $exception_values: [],
        });
        return this._suppressionRules.some((rule) => {
            const results = rule.values.map((v) => {
                var _a;
                const compare = propertyComparisons[v.operator];
                const targets = isArray(v.value) ? v.value : [v.value];
                const values = (_a = exceptionValues[v.key]) !== null && _a !== void 0 ? _a : [];
                return targets.length > 0 ? compare(targets, values) : false;
            });
            return rule.type === 'OR' ? results.some(Boolean) : results.every(Boolean);
        });
    }
    _isExtensionException(exceptionList) {
        const frames = exceptionList.flatMap((e) => { var _a, _b; return (_b = (_a = e.stacktrace) === null || _a === void 0 ? void 0 : _a.frames) !== null && _b !== void 0 ? _b : []; });
        return frames.some((f) => f.filename && f.filename.startsWith('chrome-extension://'));
    }
    _isPostHogException(exceptionList) {
        var _a, _b, _c, _d;
        if (exceptionList.length > 0) {
            const exception = exceptionList[0];
            const frames = (_b = (_a = exception.stacktrace) === null || _a === void 0 ? void 0 : _a.frames) !== null && _b !== void 0 ? _b : [];
            const lastFrame = frames[frames.length - 1];
            return (_d = (_c = lastFrame === null || lastFrame === void 0 ? void 0 : lastFrame.filename) === null || _c === void 0 ? void 0 : _c.includes('posthog.com/static')) !== null && _d !== void 0 ? _d : false;
        }
        return false;
    }
    _isExceptionList(candidate) {
        return !isNullish(candidate) && isArray(candidate);
    }
}
