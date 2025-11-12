"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.PostHogCoreStateless = exports.QuotaLimitedFeature = exports.maybeAdd = void 0;
exports.logFlushError = logFlushError;
var eventemitter_1 = require("./eventemitter");
var featureFlagUtils_1 = require("./featureFlagUtils");
var gzip_1 = require("./gzip");
var logger_1 = require("./logger");
var types_1 = require("./types");
var utils_1 = require("./utils");
var uuidv7_1 = require("./vendor/uuidv7");
var PostHogFetchHttpError = /** @class */ (function (_super) {
    __extends(PostHogFetchHttpError, _super);
    function PostHogFetchHttpError(response, reqByteLength) {
        var _this = _super.call(this, 'HTTP error while fetching PostHog: status=' + response.status + ', reqByteLength=' + reqByteLength) || this;
        _this.response = response;
        _this.reqByteLength = reqByteLength;
        _this.name = 'PostHogFetchHttpError';
        return _this;
    }
    Object.defineProperty(PostHogFetchHttpError.prototype, "status", {
        get: function () {
            return this.response.status;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PostHogFetchHttpError.prototype, "text", {
        get: function () {
            return this.response.text();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PostHogFetchHttpError.prototype, "json", {
        get: function () {
            return this.response.json();
        },
        enumerable: false,
        configurable: true
    });
    return PostHogFetchHttpError;
}(Error));
var PostHogFetchNetworkError = /** @class */ (function (_super) {
    __extends(PostHogFetchNetworkError, _super);
    function PostHogFetchNetworkError(error) {
        // TRICKY: "cause" is a newer property but is just ignored otherwise. Cast to any to ignore the type issue.
        // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
        // @ts-ignore
        var _this = _super.call(this, 'Network error while fetching PostHog', error instanceof Error ? { cause: error } : {}) || this;
        _this.error = error;
        _this.name = 'PostHogFetchNetworkError';
        return _this;
    }
    return PostHogFetchNetworkError;
}(Error));
var maybeAdd = function (key, value) {
    var _a;
    return value !== undefined ? (_a = {}, _a[key] = value, _a) : {};
};
exports.maybeAdd = maybeAdd;
function logFlushError(err) {
    return __awaiter(this, void 0, void 0, function () {
        var text, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(err instanceof PostHogFetchHttpError)) return [3 /*break*/, 5];
                    text = '';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, err.text];
                case 2:
                    text = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4:
                    console.error("Error while flushing PostHog: message=".concat(err.message, ", response body=").concat(text), err);
                    return [3 /*break*/, 6];
                case 5:
                    console.error('Error while flushing PostHog', err);
                    _b.label = 6;
                case 6: return [2 /*return*/, Promise.resolve()];
            }
        });
    });
}
function isPostHogFetchError(err) {
    return typeof err === 'object' && (err instanceof PostHogFetchHttpError || err instanceof PostHogFetchNetworkError);
}
function isPostHogFetchContentTooLargeError(err) {
    return typeof err === 'object' && err instanceof PostHogFetchHttpError && err.status === 413;
}
var QuotaLimitedFeature;
(function (QuotaLimitedFeature) {
    QuotaLimitedFeature["FeatureFlags"] = "feature_flags";
    QuotaLimitedFeature["Recordings"] = "recordings";
})(QuotaLimitedFeature || (exports.QuotaLimitedFeature = QuotaLimitedFeature = {}));
var PostHogCoreStateless = /** @class */ (function () {
    function PostHogCoreStateless(apiKey, options) {
        if (options === void 0) { options = {}; }
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        this.flushPromise = null;
        this.shutdownPromise = null;
        this.promiseQueue = new utils_1.PromiseQueue();
        // internal
        this._events = new eventemitter_1.SimpleEventEmitter();
        this._isInitialized = false;
        (0, utils_1.assert)(apiKey, "You must pass your PostHog project's api key.");
        this.apiKey = apiKey;
        this.host = (0, utils_1.removeTrailingSlash)(options.host || 'https://us.i.posthog.com');
        this.flushAt = options.flushAt ? Math.max(options.flushAt, 1) : 20;
        this.maxBatchSize = Math.max(this.flushAt, (_a = options.maxBatchSize) !== null && _a !== void 0 ? _a : 100);
        this.maxQueueSize = Math.max(this.flushAt, (_b = options.maxQueueSize) !== null && _b !== void 0 ? _b : 1000);
        this.flushInterval = (_c = options.flushInterval) !== null && _c !== void 0 ? _c : 10000;
        this.preloadFeatureFlags = (_d = options.preloadFeatureFlags) !== null && _d !== void 0 ? _d : true;
        // If enable is explicitly set to false we override the optout
        this.defaultOptIn = (_e = options.defaultOptIn) !== null && _e !== void 0 ? _e : true;
        this.disableSurveys = (_f = options.disableSurveys) !== null && _f !== void 0 ? _f : false;
        this._retryOptions = {
            retryCount: (_g = options.fetchRetryCount) !== null && _g !== void 0 ? _g : 3,
            retryDelay: (_h = options.fetchRetryDelay) !== null && _h !== void 0 ? _h : 3000, // 3 seconds
            retryCheck: isPostHogFetchError,
        };
        this.requestTimeout = (_j = options.requestTimeout) !== null && _j !== void 0 ? _j : 10000; // 10 seconds
        this.featureFlagsRequestTimeoutMs = (_k = options.featureFlagsRequestTimeoutMs) !== null && _k !== void 0 ? _k : 3000; // 3 seconds
        this.remoteConfigRequestTimeoutMs = (_l = options.remoteConfigRequestTimeoutMs) !== null && _l !== void 0 ? _l : 3000; // 3 seconds
        this.disableGeoip = (_m = options.disableGeoip) !== null && _m !== void 0 ? _m : true;
        this.disabled = (_o = options.disabled) !== null && _o !== void 0 ? _o : false;
        this.historicalMigration = (_p = options === null || options === void 0 ? void 0 : options.historicalMigration) !== null && _p !== void 0 ? _p : false;
        this.evaluationEnvironments = options === null || options === void 0 ? void 0 : options.evaluationEnvironments;
        // Init promise allows the derived class to block calls until it is ready
        this._initPromise = Promise.resolve();
        this._isInitialized = true;
        this._logger = (0, logger_1.createLogger)('[PostHog]', this.logMsgIfDebug.bind(this));
        this.disableCompression = !(0, gzip_1.isGzipSupported)() || ((_q = options === null || options === void 0 ? void 0 : options.disableCompression) !== null && _q !== void 0 ? _q : false);
    }
    PostHogCoreStateless.prototype.logMsgIfDebug = function (fn) {
        if (this.isDebug) {
            fn();
        }
    };
    PostHogCoreStateless.prototype.wrap = function (fn) {
        if (this.disabled) {
            this._logger.warn('The client is disabled');
            return;
        }
        if (this._isInitialized) {
            // NOTE: We could also check for the "opt in" status here...
            return fn();
        }
        this._initPromise.then(function () { return fn(); });
    };
    PostHogCoreStateless.prototype.getCommonEventProperties = function () {
        return {
            $lib: this.getLibraryId(),
            $lib_version: this.getLibraryVersion(),
        };
    };
    Object.defineProperty(PostHogCoreStateless.prototype, "optedOut", {
        get: function () {
            var _a;
            return (_a = this.getPersistedProperty(types_1.PostHogPersistedProperty.OptedOut)) !== null && _a !== void 0 ? _a : !this.defaultOptIn;
        },
        enumerable: false,
        configurable: true
    });
    PostHogCoreStateless.prototype.optIn = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.wrap(function () {
                    _this.setPersistedProperty(types_1.PostHogPersistedProperty.OptedOut, false);
                });
                return [2 /*return*/];
            });
        });
    };
    PostHogCoreStateless.prototype.optOut = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.wrap(function () {
                    _this.setPersistedProperty(types_1.PostHogPersistedProperty.OptedOut, true);
                });
                return [2 /*return*/];
            });
        });
    };
    PostHogCoreStateless.prototype.on = function (event, cb) {
        return this._events.on(event, cb);
    };
    /**
     * Enables or disables debug mode for detailed logging.
     *
     * @remarks
     * Debug mode logs all PostHog calls to the console for troubleshooting.
     * This is useful during development to understand what data is being sent.
     *
     * {@label Initialization}
     *
     * @example
     * ```js
     * // enable debug mode
     * posthog.debug(true)
     * ```
     *
     * @example
     * ```js
     * // disable debug mode
     * posthog.debug(false)
     * ```
     *
     * @public
     *
     * @param {boolean} [debug] If true, will enable debug mode.
     */
    PostHogCoreStateless.prototype.debug = function (enabled) {
        var _this = this;
        var _a;
        if (enabled === void 0) { enabled = true; }
        (_a = this.removeDebugCallback) === null || _a === void 0 ? void 0 : _a.call(this);
        if (enabled) {
            var removeDebugCallback_1 = this.on('*', function (event, payload) { return _this._logger.info(event, payload); });
            this.removeDebugCallback = function () {
                removeDebugCallback_1();
                _this.removeDebugCallback = undefined;
            };
        }
    };
    Object.defineProperty(PostHogCoreStateless.prototype, "isDebug", {
        get: function () {
            return !!this.removeDebugCallback;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PostHogCoreStateless.prototype, "isDisabled", {
        get: function () {
            return this.disabled;
        },
        enumerable: false,
        configurable: true
    });
    PostHogCoreStateless.prototype.buildPayload = function (payload) {
        return {
            distinct_id: payload.distinct_id,
            event: payload.event,
            properties: __assign(__assign({}, (payload.properties || {})), this.getCommonEventProperties()),
        };
    };
    PostHogCoreStateless.prototype.addPendingPromise = function (promise) {
        return this.promiseQueue.add(promise);
    };
    /***
     *** TRACKING
     ***/
    PostHogCoreStateless.prototype.identifyStateless = function (distinctId, properties, options) {
        var _this = this;
        this.wrap(function () {
            // The properties passed to identifyStateless are event properties.
            // To add person properties, pass in all person properties to the `$set` and `$set_once` keys.
            var payload = __assign({}, _this.buildPayload({
                distinct_id: distinctId,
                event: '$identify',
                properties: properties,
            }));
            _this.enqueue('identify', payload, options);
        });
    };
    PostHogCoreStateless.prototype.identifyStatelessImmediate = function (distinctId, properties, options) {
        return __awaiter(this, void 0, void 0, function () {
            var payload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = __assign({}, this.buildPayload({
                            distinct_id: distinctId,
                            event: '$identify',
                            properties: properties,
                        }));
                        return [4 /*yield*/, this.sendImmediate('identify', payload, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PostHogCoreStateless.prototype.captureStateless = function (distinctId, event, properties, options) {
        var _this = this;
        this.wrap(function () {
            var payload = _this.buildPayload({ distinct_id: distinctId, event: event, properties: properties });
            _this.enqueue('capture', payload, options);
        });
    };
    PostHogCoreStateless.prototype.captureStatelessImmediate = function (distinctId, event, properties, options) {
        return __awaiter(this, void 0, void 0, function () {
            var payload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = this.buildPayload({ distinct_id: distinctId, event: event, properties: properties });
                        return [4 /*yield*/, this.sendImmediate('capture', payload, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PostHogCoreStateless.prototype.aliasStateless = function (alias, distinctId, properties, options) {
        var _this = this;
        this.wrap(function () {
            var payload = _this.buildPayload({
                event: '$create_alias',
                distinct_id: distinctId,
                properties: __assign(__assign({}, (properties || {})), { distinct_id: distinctId, alias: alias }),
            });
            _this.enqueue('alias', payload, options);
        });
    };
    PostHogCoreStateless.prototype.aliasStatelessImmediate = function (alias, distinctId, properties, options) {
        return __awaiter(this, void 0, void 0, function () {
            var payload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = this.buildPayload({
                            event: '$create_alias',
                            distinct_id: distinctId,
                            properties: __assign(__assign({}, (properties || {})), { distinct_id: distinctId, alias: alias }),
                        });
                        return [4 /*yield*/, this.sendImmediate('alias', payload, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /***
     *** GROUPS
     ***/
    PostHogCoreStateless.prototype.groupIdentifyStateless = function (groupType, groupKey, groupProperties, options, distinctId, eventProperties) {
        var _this = this;
        this.wrap(function () {
            var payload = _this.buildPayload({
                distinct_id: distinctId || "$".concat(groupType, "_").concat(groupKey),
                event: '$groupidentify',
                properties: __assign({ $group_type: groupType, $group_key: groupKey, $group_set: groupProperties || {} }, (eventProperties || {})),
            });
            _this.enqueue('capture', payload, options);
        });
    };
    PostHogCoreStateless.prototype.getRemoteConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var host, url, fetchOptions;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        host = this.host;
                        if (host === 'https://us.i.posthog.com') {
                            host = 'https://us-assets.i.posthog.com';
                        }
                        else if (host === 'https://eu.i.posthog.com') {
                            host = 'https://eu-assets.i.posthog.com';
                        }
                        url = "".concat(host, "/array/").concat(this.apiKey, "/config");
                        fetchOptions = {
                            method: 'GET',
                            headers: __assign(__assign({}, this.getCustomHeaders()), { 'Content-Type': 'application/json' }),
                        };
                        // Don't retry remote config API calls
                        return [2 /*return*/, this.fetchWithRetry(url, fetchOptions, { retryCount: 0 }, this.remoteConfigRequestTimeoutMs)
                                .then(function (response) { return response.json(); })
                                .catch(function (error) {
                                _this._logger.error('Remote config could not be loaded', error);
                                _this._events.emit('error', error);
                                return undefined;
                            })];
                }
            });
        });
    };
    /***
     *** FEATURE FLAGS
     ***/
    PostHogCoreStateless.prototype.getFlags = function (distinctId_1) {
        return __awaiter(this, arguments, void 0, function (distinctId, groups, personProperties, groupProperties, extraPayload, fetchConfig) {
            var configParam, url, requestData, fetchOptions;
            var _this = this;
            if (groups === void 0) { groups = {}; }
            if (personProperties === void 0) { personProperties = {}; }
            if (groupProperties === void 0) { groupProperties = {}; }
            if (extraPayload === void 0) { extraPayload = {}; }
            if (fetchConfig === void 0) { fetchConfig = true; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        configParam = fetchConfig ? '&config=true' : '';
                        url = "".concat(this.host, "/flags/?v=2").concat(configParam);
                        requestData = __assign({ token: this.apiKey, distinct_id: distinctId, groups: groups, person_properties: personProperties, group_properties: groupProperties }, extraPayload);
                        // Add evaluation environments if configured
                        if (this.evaluationEnvironments && this.evaluationEnvironments.length > 0) {
                            requestData.evaluation_environments = this.evaluationEnvironments;
                        }
                        fetchOptions = {
                            method: 'POST',
                            headers: __assign(__assign({}, this.getCustomHeaders()), { 'Content-Type': 'application/json' }),
                            body: JSON.stringify(requestData),
                        };
                        this._logger.info('Flags URL', url);
                        // Don't retry /flags API calls
                        return [2 /*return*/, this.fetchWithRetry(url, fetchOptions, { retryCount: 0 }, this.featureFlagsRequestTimeoutMs)
                                .then(function (response) { return response.json(); })
                                .then(function (response) { return (0, featureFlagUtils_1.normalizeFlagsResponse)(response); })
                                .catch(function (error) {
                                _this._events.emit('error', error);
                                return undefined;
                            })];
                }
            });
        });
    };
    PostHogCoreStateless.prototype.getFeatureFlagStateless = function (key_1, distinctId_1) {
        return __awaiter(this, arguments, void 0, function (key, distinctId, groups, personProperties, groupProperties, disableGeoip) {
            var flagDetailResponse, response;
            if (groups === void 0) { groups = {}; }
            if (personProperties === void 0) { personProperties = {}; }
            if (groupProperties === void 0) { groupProperties = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getFeatureFlagDetailStateless(key, distinctId, groups, personProperties, groupProperties, disableGeoip)];
                    case 2:
                        flagDetailResponse = _a.sent();
                        if (flagDetailResponse === undefined) {
                            // If we haven't loaded flags yet, or errored out, we respond with undefined
                            return [2 /*return*/, {
                                    response: undefined,
                                    requestId: undefined,
                                }];
                        }
                        response = (0, featureFlagUtils_1.getFeatureFlagValue)(flagDetailResponse.response);
                        if (response === undefined) {
                            // For cases where the flag is unknown, return false
                            response = false;
                        }
                        // If we have flags we either return the value (true or string) or false
                        return [2 /*return*/, {
                                response: response,
                                requestId: flagDetailResponse.requestId,
                            }];
                }
            });
        });
    };
    PostHogCoreStateless.prototype.getFeatureFlagDetailStateless = function (key_1, distinctId_1) {
        return __awaiter(this, arguments, void 0, function (key, distinctId, groups, personProperties, groupProperties, disableGeoip) {
            var flagsResponse, featureFlags, flagDetail;
            if (groups === void 0) { groups = {}; }
            if (personProperties === void 0) { personProperties = {}; }
            if (groupProperties === void 0) { groupProperties = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getFeatureFlagDetailsStateless(distinctId, groups, personProperties, groupProperties, disableGeoip, [key])];
                    case 2:
                        flagsResponse = _a.sent();
                        if (flagsResponse === undefined) {
                            return [2 /*return*/, undefined];
                        }
                        featureFlags = flagsResponse.flags;
                        flagDetail = featureFlags[key];
                        return [2 /*return*/, {
                                response: flagDetail,
                                requestId: flagsResponse.requestId,
                            }];
                }
            });
        });
    };
    PostHogCoreStateless.prototype.getFeatureFlagPayloadStateless = function (key_1, distinctId_1) {
        return __awaiter(this, arguments, void 0, function (key, distinctId, groups, personProperties, groupProperties, disableGeoip) {
            var payloads, response;
            if (groups === void 0) { groups = {}; }
            if (personProperties === void 0) { personProperties = {}; }
            if (groupProperties === void 0) { groupProperties = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getFeatureFlagPayloadsStateless(distinctId, groups, personProperties, groupProperties, disableGeoip, [key])];
                    case 2:
                        payloads = _a.sent();
                        if (!payloads) {
                            return [2 /*return*/, undefined];
                        }
                        response = payloads[key];
                        // Undefined means a loading or missing data issue. Null means evaluation happened and there was no match
                        if (response === undefined) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, response];
                }
            });
        });
    };
    PostHogCoreStateless.prototype.getFeatureFlagPayloadsStateless = function (distinctId_1) {
        return __awaiter(this, arguments, void 0, function (distinctId, groups, personProperties, groupProperties, disableGeoip, flagKeysToEvaluate) {
            var payloads;
            if (groups === void 0) { groups = {}; }
            if (personProperties === void 0) { personProperties = {}; }
            if (groupProperties === void 0) { groupProperties = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getFeatureFlagsAndPayloadsStateless(distinctId, groups, personProperties, groupProperties, disableGeoip, flagKeysToEvaluate)];
                    case 2:
                        payloads = (_a.sent()).payloads;
                        return [2 /*return*/, payloads];
                }
            });
        });
    };
    PostHogCoreStateless.prototype.getFeatureFlagsStateless = function (distinctId_1) {
        return __awaiter(this, arguments, void 0, function (distinctId, groups, personProperties, groupProperties, disableGeoip, flagKeysToEvaluate) {
            if (groups === void 0) { groups = {}; }
            if (personProperties === void 0) { personProperties = {}; }
            if (groupProperties === void 0) { groupProperties = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getFeatureFlagsAndPayloadsStateless(distinctId, groups, personProperties, groupProperties, disableGeoip, flagKeysToEvaluate)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    PostHogCoreStateless.prototype.getFeatureFlagsAndPayloadsStateless = function (distinctId_1) {
        return __awaiter(this, arguments, void 0, function (distinctId, groups, personProperties, groupProperties, disableGeoip, flagKeysToEvaluate) {
            var featureFlagDetails;
            if (groups === void 0) { groups = {}; }
            if (personProperties === void 0) { personProperties = {}; }
            if (groupProperties === void 0) { groupProperties = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getFeatureFlagDetailsStateless(distinctId, groups, personProperties, groupProperties, disableGeoip, flagKeysToEvaluate)];
                    case 2:
                        featureFlagDetails = _a.sent();
                        if (!featureFlagDetails) {
                            return [2 /*return*/, {
                                    flags: undefined,
                                    payloads: undefined,
                                    requestId: undefined,
                                }];
                        }
                        return [2 /*return*/, {
                                flags: featureFlagDetails.featureFlags,
                                payloads: featureFlagDetails.featureFlagPayloads,
                                requestId: featureFlagDetails.requestId,
                            }];
                }
            });
        });
    };
    PostHogCoreStateless.prototype.getFeatureFlagDetailsStateless = function (distinctId_1) {
        return __awaiter(this, arguments, void 0, function (distinctId, groups, personProperties, groupProperties, disableGeoip, flagKeysToEvaluate) {
            var extraPayload, flagsResponse;
            var _a;
            if (groups === void 0) { groups = {}; }
            if (personProperties === void 0) { personProperties = {}; }
            if (groupProperties === void 0) { groupProperties = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _b.sent();
                        extraPayload = {};
                        if (disableGeoip !== null && disableGeoip !== void 0 ? disableGeoip : this.disableGeoip) {
                            extraPayload['geoip_disable'] = true;
                        }
                        if (flagKeysToEvaluate) {
                            extraPayload['flag_keys_to_evaluate'] = flagKeysToEvaluate;
                        }
                        return [4 /*yield*/, this.getFlags(distinctId, groups, personProperties, groupProperties, extraPayload)];
                    case 2:
                        flagsResponse = _b.sent();
                        if (flagsResponse === undefined) {
                            // We probably errored out, so return undefined
                            return [2 /*return*/, undefined];
                        }
                        // if there's an error on the flagsResponse, log a console error, but don't throw an error
                        if (flagsResponse.errorsWhileComputingFlags) {
                            console.error('[FEATURE FLAGS] Error while computing feature flags, some flags may be missing or incorrect. Learn more at https://posthog.com/docs/feature-flags/best-practices');
                        }
                        // Add check for quota limitation on feature flags
                        if ((_a = flagsResponse.quotaLimited) === null || _a === void 0 ? void 0 : _a.includes(QuotaLimitedFeature.FeatureFlags)) {
                            console.warn('[FEATURE FLAGS] Feature flags quota limit exceeded - feature flags unavailable. Learn more about billing limits at https://posthog.com/docs/billing/limits-alerts');
                            return [2 /*return*/, {
                                    flags: {},
                                    featureFlags: {},
                                    featureFlagPayloads: {},
                                    requestId: flagsResponse === null || flagsResponse === void 0 ? void 0 : flagsResponse.requestId,
                                }];
                        }
                        return [2 /*return*/, flagsResponse];
                }
            });
        });
    };
    /***
     *** SURVEYS
     ***/
    PostHogCoreStateless.prototype.getSurveysStateless = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, fetchOptions, response, newSurveys;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        if (this.disableSurveys === true) {
                            this._logger.info('Loading surveys is disabled.');
                            return [2 /*return*/, []];
                        }
                        url = "".concat(this.host, "/api/surveys/?token=").concat(this.apiKey);
                        fetchOptions = {
                            method: 'GET',
                            headers: __assign(__assign({}, this.getCustomHeaders()), { 'Content-Type': 'application/json' }),
                        };
                        return [4 /*yield*/, this.fetchWithRetry(url, fetchOptions)
                                .then(function (response) {
                                if (response.status !== 200 || !response.json) {
                                    var msg = "Surveys API could not be loaded: ".concat(response.status);
                                    var error = new Error(msg);
                                    _this._logger.error(error);
                                    _this._events.emit('error', new Error(msg));
                                    return undefined;
                                }
                                return response.json();
                            })
                                .catch(function (error) {
                                _this._logger.error('Surveys API could not be loaded', error);
                                _this._events.emit('error', error);
                                return undefined;
                            })];
                    case 2:
                        response = _a.sent();
                        newSurveys = response === null || response === void 0 ? void 0 : response.surveys;
                        if (newSurveys) {
                            this._logger.info('Surveys fetched from API: ', JSON.stringify(newSurveys));
                        }
                        return [2 /*return*/, newSurveys !== null && newSurveys !== void 0 ? newSurveys : []];
                }
            });
        });
    };
    Object.defineProperty(PostHogCoreStateless.prototype, "props", {
        get: function () {
            if (!this._props) {
                this._props = this.getPersistedProperty(types_1.PostHogPersistedProperty.Props);
            }
            return this._props || {};
        },
        set: function (val) {
            this._props = val;
        },
        enumerable: false,
        configurable: true
    });
    PostHogCoreStateless.prototype.register = function (properties) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.wrap(function () {
                    _this.props = __assign(__assign({}, _this.props), properties);
                    _this.setPersistedProperty(types_1.PostHogPersistedProperty.Props, _this.props);
                });
                return [2 /*return*/];
            });
        });
    };
    PostHogCoreStateless.prototype.unregister = function (property) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.wrap(function () {
                    delete _this.props[property];
                    _this.setPersistedProperty(types_1.PostHogPersistedProperty.Props, _this.props);
                });
                return [2 /*return*/];
            });
        });
    };
    /***
     *** QUEUEING AND FLUSHING
     ***/
    PostHogCoreStateless.prototype.enqueue = function (type, _message, options) {
        var _this = this;
        this.wrap(function () {
            if (_this.optedOut) {
                _this._events.emit(type, "Library is disabled. Not sending event. To re-enable, call posthog.optIn()");
                return;
            }
            var message = _this.prepareMessage(type, _message, options);
            var queue = _this.getPersistedProperty(types_1.PostHogPersistedProperty.Queue) || [];
            if (queue.length >= _this.maxQueueSize) {
                queue.shift();
                _this._logger.info('Queue is full, the oldest event is dropped.');
            }
            queue.push({ message: message });
            _this.setPersistedProperty(types_1.PostHogPersistedProperty.Queue, queue);
            _this._events.emit(type, message);
            // Flush queued events if we meet the flushAt length
            if (queue.length >= _this.flushAt) {
                _this.flushBackground();
            }
            if (_this.flushInterval && !_this._flushTimer) {
                _this._flushTimer = (0, utils_1.safeSetTimeout)(function () { return _this.flushBackground(); }, _this.flushInterval);
            }
        });
    };
    PostHogCoreStateless.prototype.sendImmediate = function (type, _message, options) {
        return __awaiter(this, void 0, void 0, function () {
            var data, payload, url, gzippedPayload, _a, fetchOptions, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.disabled) {
                            this._logger.warn('The client is disabled');
                            return [2 /*return*/];
                        }
                        if (!!this._isInitialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._initPromise];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        if (this.optedOut) {
                            this._events.emit(type, "Library is disabled. Not sending event. To re-enable, call posthog.optIn()");
                            return [2 /*return*/];
                        }
                        data = {
                            api_key: this.apiKey,
                            batch: [this.prepareMessage(type, _message, options)],
                            sent_at: (0, utils_1.currentISOTime)(),
                        };
                        if (this.historicalMigration) {
                            data.historical_migration = true;
                        }
                        payload = JSON.stringify(data);
                        url = "".concat(this.host, "/batch/");
                        if (!!this.disableCompression) return [3 /*break*/, 4];
                        return [4 /*yield*/, (0, gzip_1.gzipCompress)(payload, this.isDebug)];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = null;
                        _b.label = 5;
                    case 5:
                        gzippedPayload = _a;
                        fetchOptions = {
                            method: 'POST',
                            headers: __assign(__assign(__assign({}, this.getCustomHeaders()), { 'Content-Type': 'application/json' }), (gzippedPayload !== null && { 'Content-Encoding': 'gzip' })),
                            body: gzippedPayload || payload,
                        };
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this.fetchWithRetry(url, fetchOptions)];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        err_1 = _b.sent();
                        this._events.emit('error', err_1);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    PostHogCoreStateless.prototype.prepareMessage = function (type, _message, options) {
        var _a;
        var message = __assign(__assign({}, _message), { type: type, library: this.getLibraryId(), library_version: this.getLibraryVersion(), timestamp: (options === null || options === void 0 ? void 0 : options.timestamp) ? options === null || options === void 0 ? void 0 : options.timestamp : (0, utils_1.currentISOTime)(), uuid: (options === null || options === void 0 ? void 0 : options.uuid) ? options.uuid : (0, uuidv7_1.uuidv7)() });
        var addGeoipDisableProperty = (_a = options === null || options === void 0 ? void 0 : options.disableGeoip) !== null && _a !== void 0 ? _a : this.disableGeoip;
        if (addGeoipDisableProperty) {
            if (!message.properties) {
                message.properties = {};
            }
            message['properties']['$geoip_disable'] = true;
        }
        if (message.distinctId) {
            message.distinct_id = message.distinctId;
            delete message.distinctId;
        }
        return message;
    };
    PostHogCoreStateless.prototype.clearFlushTimer = function () {
        if (this._flushTimer) {
            clearTimeout(this._flushTimer);
            this._flushTimer = undefined;
        }
    };
    /**
     * Helper for flushing the queue in the background
     * Avoids unnecessary promise errors
     */
    PostHogCoreStateless.prototype.flushBackground = function () {
        var _this = this;
        void this.flush().catch(function (err) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, logFlushError(err)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Flushes the queue of pending events.
     *
     * This function will return a promise that will resolve when the flush is complete,
     * or reject if there was an error (for example if the server or network is down).
     *
     * If there is already a flush in progress, this function will wait for that flush to complete.
     *
     * It's recommended to do error handling in the callback of the promise.
     *
     * {@label Initialization}
     *
     * @example
     * ```js
     * // flush with error handling
     * posthog.flush().then(() => {
     *   console.log('Flush complete')
     * }).catch((err) => {
     *   console.error('Flush failed', err)
     * })
     * ```
     *
     * @public
     *
     * @throws PostHogFetchHttpError
     * @throws PostHogFetchNetworkError
     * @throws Error
     */
    PostHogCoreStateless.prototype.flush = function () {
        return __awaiter(this, void 0, void 0, function () {
            var nextFlushPromise;
            var _this = this;
            return __generator(this, function (_a) {
                nextFlushPromise = (0, utils_1.allSettled)([this.flushPromise]).then(function () {
                    return _this._flush();
                });
                this.flushPromise = nextFlushPromise;
                void this.addPendingPromise(nextFlushPromise);
                (0, utils_1.allSettled)([nextFlushPromise]).then(function () {
                    // If there are no others waiting to flush, clear the promise.
                    // We don't strictly need to do this, but it could make debugging easier
                    if (_this.flushPromise === nextFlushPromise) {
                        _this.flushPromise = null;
                    }
                });
                return [2 /*return*/, nextFlushPromise];
            });
        });
    };
    PostHogCoreStateless.prototype.getCustomHeaders = function () {
        // Don't set the user agent if we're not on a browser. The latest spec allows
        // the User-Agent header (see https://fetch.spec.whatwg.org/#terminology-headers
        // and https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/setRequestHeader),
        // but browsers such as Chrome and Safari have not caught up.
        var customUserAgent = this.getCustomUserAgent();
        var headers = {};
        if (customUserAgent && customUserAgent !== '') {
            headers['User-Agent'] = customUserAgent;
        }
        return headers;
    };
    PostHogCoreStateless.prototype._flush = function () {
        return __awaiter(this, void 0, void 0, function () {
            var queue, sentMessages, originalQueueLength, _loop_1, this_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.clearFlushTimer();
                        return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        queue = this.getPersistedProperty(types_1.PostHogPersistedProperty.Queue) || [];
                        if (!queue.length) {
                            return [2 /*return*/];
                        }
                        sentMessages = [];
                        originalQueueLength = queue.length;
                        _loop_1 = function () {
                            var batchItems, batchMessages, persistQueueChange, data, payload, url, gzippedPayload, _b, fetchOptions, retryOptions, err_2;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        batchItems = queue.slice(0, this_1.maxBatchSize);
                                        batchMessages = batchItems.map(function (item) { return item.message; });
                                        persistQueueChange = function () {
                                            var refreshedQueue = _this.getPersistedProperty(types_1.PostHogPersistedProperty.Queue) || [];
                                            var newQueue = refreshedQueue.slice(batchItems.length);
                                            _this.setPersistedProperty(types_1.PostHogPersistedProperty.Queue, newQueue);
                                            queue = newQueue;
                                        };
                                        data = {
                                            api_key: this_1.apiKey,
                                            batch: batchMessages,
                                            sent_at: (0, utils_1.currentISOTime)(),
                                        };
                                        if (this_1.historicalMigration) {
                                            data.historical_migration = true;
                                        }
                                        payload = JSON.stringify(data);
                                        url = "".concat(this_1.host, "/batch/");
                                        if (!!this_1.disableCompression) return [3 /*break*/, 2];
                                        return [4 /*yield*/, (0, gzip_1.gzipCompress)(payload, this_1.isDebug)];
                                    case 1:
                                        _b = _c.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        _b = null;
                                        _c.label = 3;
                                    case 3:
                                        gzippedPayload = _b;
                                        fetchOptions = {
                                            method: 'POST',
                                            headers: __assign(__assign(__assign({}, this_1.getCustomHeaders()), { 'Content-Type': 'application/json' }), (gzippedPayload !== null && { 'Content-Encoding': 'gzip' })),
                                            body: gzippedPayload || payload,
                                        };
                                        retryOptions = {
                                            retryCheck: function (err) {
                                                // don't automatically retry on 413 errors, we want to reduce the batch size first
                                                if (isPostHogFetchContentTooLargeError(err)) {
                                                    return false;
                                                }
                                                // otherwise, retry on network errors
                                                return isPostHogFetchError(err);
                                            },
                                        };
                                        _c.label = 4;
                                    case 4:
                                        _c.trys.push([4, 6, , 7]);
                                        return [4 /*yield*/, this_1.fetchWithRetry(url, fetchOptions, retryOptions)];
                                    case 5:
                                        _c.sent();
                                        return [3 /*break*/, 7];
                                    case 6:
                                        err_2 = _c.sent();
                                        if (isPostHogFetchContentTooLargeError(err_2) && batchMessages.length > 1) {
                                            // if we get a 413 error, we want to reduce the batch size and try again
                                            this_1.maxBatchSize = Math.max(1, Math.floor(batchMessages.length / 2));
                                            this_1._logger.warn("Received 413 when sending batch of size ".concat(batchMessages.length, ", reducing batch size to ").concat(this_1.maxBatchSize));
                                            return [2 /*return*/, "continue"];
                                        }
                                        // depending on the error type, eg a malformed JSON or broken queue, it'll always return an error
                                        // and this will be an endless loop, in this case, if the error isn't a network issue, we always remove the items from the queue
                                        if (!(err_2 instanceof PostHogFetchNetworkError)) {
                                            persistQueueChange();
                                        }
                                        this_1._events.emit('error', err_2);
                                        throw err_2;
                                    case 7:
                                        persistQueueChange();
                                        sentMessages.push.apply(sentMessages, __spreadArray([], __read(batchMessages), false));
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _a.label = 2;
                    case 2:
                        if (!(queue.length > 0 && sentMessages.length < originalQueueLength)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 2];
                    case 4:
                        this._events.emit('flush', sentMessages);
                        return [2 /*return*/];
                }
            });
        });
    };
    PostHogCoreStateless.prototype.fetchWithRetry = function (url, options, retryOptions, requestTimeout) {
        return __awaiter(this, void 0, void 0, function () {
            var body, reqByteLength, encoded;
            var _this = this;
            var _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        ;
                        (_a = (_b = AbortSignal).timeout) !== null && _a !== void 0 ? _a : (_b.timeout = function timeout(ms) {
                            var ctrl = new AbortController();
                            setTimeout(function () { return ctrl.abort(); }, ms);
                            return ctrl.signal;
                        });
                        body = options.body ? options.body : '';
                        reqByteLength = -1;
                        try {
                            if (body instanceof Blob) {
                                reqByteLength = body.size;
                            }
                            else {
                                reqByteLength = Buffer.byteLength(body, utils_1.STRING_FORMAT);
                            }
                        }
                        catch (_d) {
                            if (body instanceof Blob) {
                                reqByteLength = body.size;
                            }
                            else {
                                encoded = new TextEncoder().encode(body);
                                reqByteLength = encoded.length;
                            }
                        }
                        return [4 /*yield*/, (0, utils_1.retriable)(function () { return __awaiter(_this, void 0, void 0, function () {
                                var res, e_1, isNoCors;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            res = null;
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, this.fetch(url, __assign({ signal: AbortSignal.timeout(requestTimeout !== null && requestTimeout !== void 0 ? requestTimeout : this.requestTimeout) }, options))];
                                        case 2:
                                            res = _a.sent();
                                            return [3 /*break*/, 4];
                                        case 3:
                                            e_1 = _a.sent();
                                            // fetch will only throw on network errors or on timeouts
                                            throw new PostHogFetchNetworkError(e_1);
                                        case 4:
                                            isNoCors = options.mode === 'no-cors';
                                            if (!isNoCors && (res.status < 200 || res.status >= 400)) {
                                                throw new PostHogFetchHttpError(res, reqByteLength);
                                            }
                                            return [2 /*return*/, res];
                                    }
                                });
                            }); }, __assign(__assign({}, this._retryOptions), retryOptions))];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
    PostHogCoreStateless.prototype._shutdown = function () {
        return __awaiter(this, arguments, void 0, function (shutdownTimeoutMs) {
            var hasTimedOut, doShutdown;
            var _this = this;
            if (shutdownTimeoutMs === void 0) { shutdownTimeoutMs = 30000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // A little tricky - we want to have a max shutdown time and enforce it, even if that means we have some
                    // dangling promises. We'll keep track of the timeout and resolve/reject based on that.
                    return [4 /*yield*/, this._initPromise];
                    case 1:
                        // A little tricky - we want to have a max shutdown time and enforce it, even if that means we have some
                        // dangling promises. We'll keep track of the timeout and resolve/reject based on that.
                        _a.sent();
                        hasTimedOut = false;
                        this.clearFlushTimer();
                        doShutdown = function () { return __awaiter(_this, void 0, void 0, function () {
                            var queue, e_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 5, , 7]);
                                        return [4 /*yield*/, this.promiseQueue.join()];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2:
                                        if (!true) return [3 /*break*/, 4];
                                        queue = this.getPersistedProperty(types_1.PostHogPersistedProperty.Queue) || [];
                                        if (queue.length === 0) {
                                            return [3 /*break*/, 4];
                                        }
                                        // flush again to make sure we send all events, some of which might've been added
                                        // while we were waiting for the pending promises to resolve
                                        // For example, see sendFeatureFlags in posthog-node/src/posthog-node.ts::capture
                                        return [4 /*yield*/, this.flush()];
                                    case 3:
                                        // flush again to make sure we send all events, some of which might've been added
                                        // while we were waiting for the pending promises to resolve
                                        // For example, see sendFeatureFlags in posthog-node/src/posthog-node.ts::capture
                                        _a.sent();
                                        if (hasTimedOut) {
                                            return [3 /*break*/, 4];
                                        }
                                        return [3 /*break*/, 2];
                                    case 4: return [3 /*break*/, 7];
                                    case 5:
                                        e_2 = _a.sent();
                                        if (!isPostHogFetchError(e_2)) {
                                            throw e_2;
                                        }
                                        return [4 /*yield*/, logFlushError(e_2)];
                                    case 6:
                                        _a.sent();
                                        return [3 /*break*/, 7];
                                    case 7: return [2 /*return*/];
                                }
                            });
                        }); };
                        return [2 /*return*/, Promise.race([
                                new Promise(function (_, reject) {
                                    (0, utils_1.safeSetTimeout)(function () {
                                        _this._logger.error('Timed out while shutting down PostHog');
                                        hasTimedOut = true;
                                        reject('Timeout while shutting down PostHog. Some events may not have been sent.');
                                    }, shutdownTimeoutMs);
                                }),
                                doShutdown(),
                            ])];
                }
            });
        });
    };
    /**
     * Shuts down the PostHog instance and ensures all events are sent.
     *
     * Call shutdown() once before the process exits to ensure that all events have been sent and all promises
     * have resolved. Do not use this function if you intend to keep using this PostHog instance after calling it.
     * Use flush() for per-request cleanup instead.
     *
     * {@label Initialization}
     *
     * @example
     * ```js
     * // shutdown before process exit
     * process.on('SIGINT', async () => {
     *   await posthog.shutdown()
     *   process.exit(0)
     * })
     * ```
     *
     * @public
     *
     * @param {number} [shutdownTimeoutMs=30000] Maximum time to wait for shutdown in milliseconds
     * @returns {Promise<void>} A promise that resolves when shutdown is complete
     */
    PostHogCoreStateless.prototype.shutdown = function () {
        return __awaiter(this, arguments, void 0, function (shutdownTimeoutMs) {
            var _this = this;
            if (shutdownTimeoutMs === void 0) { shutdownTimeoutMs = 30000; }
            return __generator(this, function (_a) {
                if (this.shutdownPromise) {
                    this._logger.warn('shutdown() called while already shutting down. shutdown() is meant to be called once before process exit - use flush() for per-request cleanup');
                }
                else {
                    this.shutdownPromise = this._shutdown(shutdownTimeoutMs).finally(function () {
                        _this.shutdownPromise = null;
                    });
                }
                return [2 /*return*/, this.shutdownPromise];
            });
        });
    };
    return PostHogCoreStateless;
}());
exports.PostHogCoreStateless = PostHogCoreStateless;
//# sourceMappingURL=posthog-core-stateless.js.map