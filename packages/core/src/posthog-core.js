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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostHogCore = void 0;
var featureFlagUtils_1 = require("./featureFlagUtils");
var types_1 = require("./types");
var posthog_core_stateless_1 = require("./posthog-core-stateless");
var uuidv7_1 = require("./vendor/uuidv7");
var utils_1 = require("./utils");
var PostHogCore = /** @class */ (function (_super) {
    __extends(PostHogCore, _super);
    function PostHogCore(apiKey, options) {
        var _this = this;
        var _a, _b, _c, _d;
        // Default for stateful mode is to not disable geoip. Only override if explicitly set
        var disableGeoipOption = (_a = options === null || options === void 0 ? void 0 : options.disableGeoip) !== null && _a !== void 0 ? _a : false;
        // Default for stateful mode is to timeout at 10s. Only override if explicitly set
        var featureFlagsRequestTimeoutMs = (_b = options === null || options === void 0 ? void 0 : options.featureFlagsRequestTimeoutMs) !== null && _b !== void 0 ? _b : 10000; // 10 seconds
        _this = _super.call(this, apiKey, __assign(__assign({}, options), { disableGeoip: disableGeoipOption, featureFlagsRequestTimeoutMs: featureFlagsRequestTimeoutMs })) || this;
        _this.flagCallReported = {};
        _this._sessionMaxLengthSeconds = 24 * 60 * 60; // 24 hours
        _this.sessionProps = {};
        _this.sendFeatureFlagEvent = (_c = options === null || options === void 0 ? void 0 : options.sendFeatureFlagEvent) !== null && _c !== void 0 ? _c : true;
        _this._sessionExpirationTimeSeconds = (_d = options === null || options === void 0 ? void 0 : options.sessionExpirationTimeSeconds) !== null && _d !== void 0 ? _d : 1800; // 30 minutes
        return _this;
    }
    PostHogCore.prototype.setupBootstrap = function (options) {
        var _a;
        var bootstrap = options === null || options === void 0 ? void 0 : options.bootstrap;
        if (!bootstrap) {
            return;
        }
        // bootstrap options are only set if no persisted values are found
        // this is to prevent overwriting existing values
        if (bootstrap.distinctId) {
            if (bootstrap.isIdentifiedId) {
                var distinctId = this.getPersistedProperty(types_1.PostHogPersistedProperty.DistinctId);
                if (!distinctId) {
                    this.setPersistedProperty(types_1.PostHogPersistedProperty.DistinctId, bootstrap.distinctId);
                }
            }
            else {
                var anonymousId = this.getPersistedProperty(types_1.PostHogPersistedProperty.AnonymousId);
                if (!anonymousId) {
                    this.setPersistedProperty(types_1.PostHogPersistedProperty.AnonymousId, bootstrap.distinctId);
                }
            }
        }
        var bootstrapFeatureFlags = bootstrap.featureFlags;
        var bootstrapFeatureFlagPayloads = (_a = bootstrap.featureFlagPayloads) !== null && _a !== void 0 ? _a : {};
        if (bootstrapFeatureFlags && Object.keys(bootstrapFeatureFlags).length) {
            var normalizedBootstrapFeatureFlagDetails = (0, featureFlagUtils_1.createFlagsResponseFromFlagsAndPayloads)(bootstrapFeatureFlags, bootstrapFeatureFlagPayloads);
            if (Object.keys(normalizedBootstrapFeatureFlagDetails.flags).length > 0) {
                this.setBootstrappedFeatureFlagDetails(normalizedBootstrapFeatureFlagDetails);
                var currentFeatureFlagDetails = this.getKnownFeatureFlagDetails() || { flags: {}, requestId: undefined };
                var newFeatureFlagDetails = {
                    flags: __assign(__assign({}, normalizedBootstrapFeatureFlagDetails.flags), currentFeatureFlagDetails.flags),
                    requestId: normalizedBootstrapFeatureFlagDetails.requestId,
                };
                this.setKnownFeatureFlagDetails(newFeatureFlagDetails);
            }
        }
    };
    PostHogCore.prototype.clearProps = function () {
        this.props = undefined;
        this.sessionProps = {};
        this.flagCallReported = {};
    };
    PostHogCore.prototype.on = function (event, cb) {
        return this._events.on(event, cb);
    };
    PostHogCore.prototype.reset = function (propertiesToKeep) {
        var _this = this;
        this.wrap(function () {
            var e_1, _a;
            var allPropertiesToKeep = __spreadArray([types_1.PostHogPersistedProperty.Queue], __read((propertiesToKeep || [])), false);
            // clean up props
            _this.clearProps();
            try {
                for (var _b = __values(Object.keys(types_1.PostHogPersistedProperty)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var key = _c.value;
                    if (!allPropertiesToKeep.includes(types_1.PostHogPersistedProperty[key])) {
                        _this.setPersistedProperty(types_1.PostHogPersistedProperty[key], null);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            _this.reloadFeatureFlags();
        });
    };
    PostHogCore.prototype.getCommonEventProperties = function () {
        var e_2, _a;
        var featureFlags = this.getFeatureFlags();
        var featureVariantProperties = {};
        if (featureFlags) {
            try {
                for (var _b = __values(Object.entries(featureFlags)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), feature = _d[0], variant = _d[1];
                    featureVariantProperties["$feature/".concat(feature)] = variant;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        return __assign(__assign(__assign({}, (0, posthog_core_stateless_1.maybeAdd)('$active_feature_flags', featureFlags ? Object.keys(featureFlags) : undefined)), featureVariantProperties), _super.prototype.getCommonEventProperties.call(this));
    };
    PostHogCore.prototype.enrichProperties = function (properties) {
        return __assign(__assign(__assign(__assign(__assign({}, this.props), this.sessionProps), (properties || {})), this.getCommonEventProperties()), { $session_id: this.getSessionId() });
    };
    /**
     * Returns the current session_id.
     *
     * @remarks
     * This should only be used for informative purposes.
     * Any actual internal use case for the session_id should be handled by the sessionManager.
     *
     * @public
     *
     * @returns The stored session ID for the current session. This may be an empty string if the client is not yet fully initialized.
     */
    PostHogCore.prototype.getSessionId = function () {
        if (!this._isInitialized) {
            return '';
        }
        var sessionId = this.getPersistedProperty(types_1.PostHogPersistedProperty.SessionId);
        var sessionLastTimestamp = this.getPersistedProperty(types_1.PostHogPersistedProperty.SessionLastTimestamp) || 0;
        var sessionStartTimestamp = this.getPersistedProperty(types_1.PostHogPersistedProperty.SessionStartTimestamp) || 0;
        var now = Date.now();
        var sessionLastDif = now - sessionLastTimestamp;
        var sessionStartDif = now - sessionStartTimestamp;
        if (!sessionId ||
            sessionLastDif > this._sessionExpirationTimeSeconds * 1000 ||
            sessionStartDif > this._sessionMaxLengthSeconds * 1000) {
            sessionId = (0, uuidv7_1.uuidv7)();
            this.setPersistedProperty(types_1.PostHogPersistedProperty.SessionId, sessionId);
            this.setPersistedProperty(types_1.PostHogPersistedProperty.SessionStartTimestamp, now);
        }
        this.setPersistedProperty(types_1.PostHogPersistedProperty.SessionLastTimestamp, now);
        return sessionId;
    };
    PostHogCore.prototype.resetSessionId = function () {
        var _this = this;
        this.wrap(function () {
            _this.setPersistedProperty(types_1.PostHogPersistedProperty.SessionId, null);
            _this.setPersistedProperty(types_1.PostHogPersistedProperty.SessionLastTimestamp, null);
            _this.setPersistedProperty(types_1.PostHogPersistedProperty.SessionStartTimestamp, null);
        });
    };
    /**
     * Returns the current anonymous ID.
     *
     * This is the ID assigned to users before they are identified. It's used to track
     * anonymous users and link them to identified users when they sign up.
     *
     * {@label Identification}
     *
     * @example
     * ```js
     * // get the anonymous ID
     * const anonId = posthog.getAnonymousId()
     * console.log('Anonymous ID:', anonId)
     * ```
     *
     * @public
     *
     * @returns {string} The stored anonymous ID. This may be an empty string if the client is not yet fully initialized.
     */
    PostHogCore.prototype.getAnonymousId = function () {
        if (!this._isInitialized) {
            return '';
        }
        var anonId = this.getPersistedProperty(types_1.PostHogPersistedProperty.AnonymousId);
        if (!anonId) {
            anonId = (0, uuidv7_1.uuidv7)();
            this.setPersistedProperty(types_1.PostHogPersistedProperty.AnonymousId, anonId);
        }
        return anonId;
    };
    /**
     * * @returns {string} The stored distinct ID. This may be an empty string if the client is not yet fully initialized.
     */
    PostHogCore.prototype.getDistinctId = function () {
        if (!this._isInitialized) {
            return '';
        }
        return this.getPersistedProperty(types_1.PostHogPersistedProperty.DistinctId) || this.getAnonymousId();
    };
    PostHogCore.prototype.registerForSession = function (properties) {
        this.sessionProps = __assign(__assign({}, this.sessionProps), properties);
    };
    PostHogCore.prototype.unregisterForSession = function (property) {
        delete this.sessionProps[property];
    };
    /***
     *** TRACKING
     ***/
    PostHogCore.prototype.identify = function (distinctId, properties, options) {
        var _this = this;
        this.wrap(function () {
            var previousDistinctId = _this.getDistinctId();
            distinctId = distinctId || previousDistinctId;
            if (properties === null || properties === void 0 ? void 0 : properties.$groups) {
                _this.groups(properties.$groups);
            }
            // promote $set and $set_once to top level
            var userPropsOnce = properties === null || properties === void 0 ? void 0 : properties.$set_once;
            properties === null || properties === void 0 ? true : delete properties.$set_once;
            // if no $set is provided we assume all properties are $set
            var userProps = (properties === null || properties === void 0 ? void 0 : properties.$set) || properties;
            var allProperties = _this.enrichProperties(__assign(__assign({ $anon_distinct_id: _this.getAnonymousId() }, (0, posthog_core_stateless_1.maybeAdd)('$set', userProps)), (0, posthog_core_stateless_1.maybeAdd)('$set_once', userPropsOnce)));
            if (distinctId !== previousDistinctId) {
                // We keep the AnonymousId to be used by flags calls and identify to link the previousId
                _this.setPersistedProperty(types_1.PostHogPersistedProperty.AnonymousId, previousDistinctId);
                _this.setPersistedProperty(types_1.PostHogPersistedProperty.DistinctId, distinctId);
                _this.reloadFeatureFlags();
            }
            _super.prototype.identifyStateless.call(_this, distinctId, allProperties, options);
        });
    };
    PostHogCore.prototype.capture = function (event, properties, options) {
        var _this = this;
        this.wrap(function () {
            var distinctId = _this.getDistinctId();
            if (properties === null || properties === void 0 ? void 0 : properties.$groups) {
                _this.groups(properties.$groups);
            }
            var allProperties = _this.enrichProperties(properties);
            _super.prototype.captureStateless.call(_this, distinctId, event, allProperties, options);
        });
    };
    PostHogCore.prototype.alias = function (alias) {
        var _this = this;
        this.wrap(function () {
            var distinctId = _this.getDistinctId();
            var allProperties = _this.enrichProperties({});
            _super.prototype.aliasStateless.call(_this, alias, distinctId, allProperties);
        });
    };
    PostHogCore.prototype.autocapture = function (eventType, elements, properties, options) {
        var _this = this;
        if (properties === void 0) { properties = {}; }
        this.wrap(function () {
            var distinctId = _this.getDistinctId();
            var payload = {
                distinct_id: distinctId,
                event: '$autocapture',
                properties: __assign(__assign({}, _this.enrichProperties(properties)), { $event_type: eventType, $elements: elements }),
            };
            _this.enqueue('autocapture', payload, options);
        });
    };
    /***
     *** GROUPS
     ***/
    PostHogCore.prototype.groups = function (groups) {
        var _this = this;
        this.wrap(function () {
            // Get persisted groups
            var existingGroups = _this.props.$groups || {};
            _this.register({
                $groups: __assign(__assign({}, existingGroups), groups),
            });
            if (Object.keys(groups).find(function (type) { return existingGroups[type] !== groups[type]; })) {
                _this.reloadFeatureFlags();
            }
        });
    };
    PostHogCore.prototype.group = function (groupType, groupKey, groupProperties, options) {
        var _this = this;
        this.wrap(function () {
            var _a;
            _this.groups((_a = {},
                _a[groupType] = groupKey,
                _a));
            if (groupProperties) {
                _this.groupIdentify(groupType, groupKey, groupProperties, options);
            }
        });
    };
    PostHogCore.prototype.groupIdentify = function (groupType, groupKey, groupProperties, options) {
        var _this = this;
        this.wrap(function () {
            var distinctId = _this.getDistinctId();
            var eventProperties = _this.enrichProperties({});
            _super.prototype.groupIdentifyStateless.call(_this, groupType, groupKey, groupProperties, options, distinctId, eventProperties);
        });
    };
    /***
     * PROPERTIES
     ***/
    PostHogCore.prototype.setPersonPropertiesForFlags = function (properties) {
        var _this = this;
        this.wrap(function () {
            // Get persisted person properties
            var existingProperties = _this.getPersistedProperty(types_1.PostHogPersistedProperty.PersonProperties) || {};
            _this.setPersistedProperty(types_1.PostHogPersistedProperty.PersonProperties, __assign(__assign({}, existingProperties), properties));
        });
    };
    PostHogCore.prototype.resetPersonPropertiesForFlags = function () {
        var _this = this;
        this.wrap(function () {
            _this.setPersistedProperty(types_1.PostHogPersistedProperty.PersonProperties, null);
        });
    };
    PostHogCore.prototype.setGroupPropertiesForFlags = function (properties) {
        var _this = this;
        this.wrap(function () {
            // Get persisted group properties
            var existingProperties = _this.getPersistedProperty(types_1.PostHogPersistedProperty.GroupProperties) ||
                {};
            if (Object.keys(existingProperties).length !== 0) {
                Object.keys(existingProperties).forEach(function (groupType) {
                    existingProperties[groupType] = __assign(__assign({}, existingProperties[groupType]), properties[groupType]);
                    delete properties[groupType];
                });
            }
            _this.setPersistedProperty(types_1.PostHogPersistedProperty.GroupProperties, __assign(__assign({}, existingProperties), properties));
        });
    };
    PostHogCore.prototype.resetGroupPropertiesForFlags = function () {
        var _this = this;
        this.wrap(function () {
            _this.setPersistedProperty(types_1.PostHogPersistedProperty.GroupProperties, null);
        });
    };
    PostHogCore.prototype.remoteConfigAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        if (this._remoteConfigResponsePromise) {
                            return [2 /*return*/, this._remoteConfigResponsePromise];
                        }
                        return [2 /*return*/, this._remoteConfigAsync()];
                }
            });
        });
    };
    /***
     *** FEATURE FLAGS
     ***/
    PostHogCore.prototype.flagsAsync = function () {
        return __awaiter(this, arguments, void 0, function (sendAnonDistinctId, fetchConfig) {
            if (sendAnonDistinctId === void 0) { sendAnonDistinctId = true; }
            if (fetchConfig === void 0) { fetchConfig = true; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._initPromise];
                    case 1:
                        _a.sent();
                        if (this._flagsResponsePromise) {
                            return [2 /*return*/, this._flagsResponsePromise];
                        }
                        return [2 /*return*/, this._flagsAsync(sendAnonDistinctId, fetchConfig)];
                }
            });
        });
    };
    PostHogCore.prototype.cacheSessionReplay = function (source, response) {
        var sessionReplay = response === null || response === void 0 ? void 0 : response.sessionRecording;
        if (sessionReplay) {
            this.setPersistedProperty(types_1.PostHogPersistedProperty.SessionReplay, sessionReplay);
            this._logger.info("Session replay config from ".concat(source, ": "), JSON.stringify(sessionReplay));
        }
        else if (typeof sessionReplay === 'boolean' && sessionReplay === false) {
            // if session replay is disabled, we don't need to cache it
            // we need to check for this because the response might be undefined (/flags does not return sessionRecording yet)
            this._logger.info("Session replay config from ".concat(source, " disabled."));
            this.setPersistedProperty(types_1.PostHogPersistedProperty.SessionReplay, null);
        }
    };
    PostHogCore.prototype._remoteConfigAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this._remoteConfigResponsePromise = this._initPromise
                    .then(function () {
                    var remoteConfig = _this.getPersistedProperty(types_1.PostHogPersistedProperty.RemoteConfig);
                    _this._logger.info('Cached remote config: ', JSON.stringify(remoteConfig));
                    return _super.prototype.getRemoteConfig.call(_this).then(function (response) {
                        var _a;
                        if (response) {
                            var remoteConfigWithoutSurveys = __assign({}, response);
                            delete remoteConfigWithoutSurveys.surveys;
                            _this._logger.info('Fetched remote config: ', JSON.stringify(remoteConfigWithoutSurveys));
                            if (_this.disableSurveys === false) {
                                var surveys = response.surveys;
                                var hasSurveys = true;
                                if (!Array.isArray(surveys)) {
                                    // If surveys is not an array, it means there are no surveys (its a boolean instead)
                                    _this._logger.info('There are no surveys.');
                                    hasSurveys = false;
                                }
                                else {
                                    _this._logger.info('Surveys fetched from remote config: ', JSON.stringify(surveys));
                                }
                                if (hasSurveys) {
                                    _this.setPersistedProperty(types_1.PostHogPersistedProperty.Surveys, surveys);
                                }
                                else {
                                    _this.setPersistedProperty(types_1.PostHogPersistedProperty.Surveys, null);
                                }
                            }
                            else {
                                _this.setPersistedProperty(types_1.PostHogPersistedProperty.Surveys, null);
                            }
                            // we cache the surveys in its own storage key
                            _this.setPersistedProperty(types_1.PostHogPersistedProperty.RemoteConfig, remoteConfigWithoutSurveys);
                            _this.cacheSessionReplay('remote config', response);
                            // we only dont load flags if the remote config has no feature flags
                            if (response.hasFeatureFlags === false) {
                                // resetting flags to empty object
                                _this.setKnownFeatureFlagDetails({ flags: {} });
                                _this._logger.warn('Remote config has no feature flags, will not load feature flags.');
                            }
                            else if (_this.preloadFeatureFlags !== false) {
                                _this.reloadFeatureFlags();
                            }
                            if (!((_a = response.supportedCompression) === null || _a === void 0 ? void 0 : _a.includes(types_1.Compression.GZipJS))) {
                                _this.disableCompression = true;
                            }
                            remoteConfig = response;
                        }
                        return remoteConfig;
                    });
                })
                    .finally(function () {
                    _this._remoteConfigResponsePromise = undefined;
                });
                return [2 /*return*/, this._remoteConfigResponsePromise];
            });
        });
    };
    PostHogCore.prototype._flagsAsync = function () {
        return __awaiter(this, arguments, void 0, function (sendAnonDistinctId, fetchConfig) {
            var _this = this;
            if (sendAnonDistinctId === void 0) { sendAnonDistinctId = true; }
            if (fetchConfig === void 0) { fetchConfig = true; }
            return __generator(this, function (_a) {
                this._flagsResponsePromise = this._initPromise
                    .then(function () { return __awaiter(_this, void 0, void 0, function () {
                    var distinctId, groups, personProperties, groupProperties, extraProperties, res, newFeatureFlagDetails, currentFlagDetails;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                distinctId = this.getDistinctId();
                                groups = this.props.$groups || {};
                                personProperties = this.getPersistedProperty(types_1.PostHogPersistedProperty.PersonProperties) || {};
                                groupProperties = this.getPersistedProperty(types_1.PostHogPersistedProperty.GroupProperties) ||
                                    {};
                                extraProperties = {
                                    $anon_distinct_id: sendAnonDistinctId ? this.getAnonymousId() : undefined,
                                };
                                return [4 /*yield*/, _super.prototype.getFlags.call(this, distinctId, groups, personProperties, groupProperties, extraProperties, fetchConfig)
                                    // Add check for quota limitation on feature flags
                                ];
                            case 1:
                                res = _b.sent();
                                // Add check for quota limitation on feature flags
                                if ((_a = res === null || res === void 0 ? void 0 : res.quotaLimited) === null || _a === void 0 ? void 0 : _a.includes(posthog_core_stateless_1.QuotaLimitedFeature.FeatureFlags)) {
                                    // Unset all feature flags by setting to null
                                    this.setKnownFeatureFlagDetails(null);
                                    console.warn('[FEATURE FLAGS] Feature flags quota limit exceeded - unsetting all flags. Learn more about billing limits at https://posthog.com/docs/billing/limits-alerts');
                                    return [2 /*return*/, res];
                                }
                                if (res === null || res === void 0 ? void 0 : res.featureFlags) {
                                    // clear flag call reported if we have new flags since they might have changed
                                    if (this.sendFeatureFlagEvent) {
                                        this.flagCallReported = {};
                                    }
                                    newFeatureFlagDetails = res;
                                    if (res.errorsWhileComputingFlags) {
                                        currentFlagDetails = this.getKnownFeatureFlagDetails();
                                        this._logger.info('Cached feature flags: ', JSON.stringify(currentFlagDetails));
                                        newFeatureFlagDetails = __assign(__assign({}, res), { flags: __assign(__assign({}, currentFlagDetails === null || currentFlagDetails === void 0 ? void 0 : currentFlagDetails.flags), res.flags) });
                                    }
                                    this.setKnownFeatureFlagDetails(newFeatureFlagDetails);
                                    // Mark that we hit the /flags endpoint so we can capture this in the $feature_flag_called event
                                    this.setPersistedProperty(types_1.PostHogPersistedProperty.FlagsEndpointWasHit, true);
                                    this.cacheSessionReplay('flags', res);
                                }
                                return [2 /*return*/, res];
                        }
                    });
                }); })
                    .finally(function () {
                    _this._flagsResponsePromise = undefined;
                });
                return [2 /*return*/, this._flagsResponsePromise];
            });
        });
    };
    // We only store the flags and request id in the feature flag details storage key
    PostHogCore.prototype.setKnownFeatureFlagDetails = function (flagsResponse) {
        var _this = this;
        this.wrap(function () {
            var _a;
            _this.setPersistedProperty(types_1.PostHogPersistedProperty.FeatureFlagDetails, flagsResponse);
            _this._events.emit('featureflags', (0, featureFlagUtils_1.getFlagValuesFromFlags)((_a = flagsResponse === null || flagsResponse === void 0 ? void 0 : flagsResponse.flags) !== null && _a !== void 0 ? _a : {}));
        });
    };
    PostHogCore.prototype.getKnownFeatureFlagDetails = function () {
        var storedDetails = this.getPersistedProperty(types_1.PostHogPersistedProperty.FeatureFlagDetails);
        if (!storedDetails) {
            // Rebuild from the stored feature flags and feature flag payloads
            var featureFlags = this.getPersistedProperty(types_1.PostHogPersistedProperty.FeatureFlags);
            var featureFlagPayloads = this.getPersistedProperty(types_1.PostHogPersistedProperty.FeatureFlagPayloads);
            if (featureFlags === undefined && featureFlagPayloads === undefined) {
                return undefined;
            }
            return (0, featureFlagUtils_1.createFlagsResponseFromFlagsAndPayloads)(featureFlags !== null && featureFlags !== void 0 ? featureFlags : {}, featureFlagPayloads !== null && featureFlagPayloads !== void 0 ? featureFlagPayloads : {});
        }
        return (0, featureFlagUtils_1.normalizeFlagsResponse)(storedDetails);
    };
    PostHogCore.prototype.getKnownFeatureFlags = function () {
        var featureFlagDetails = this.getKnownFeatureFlagDetails();
        if (!featureFlagDetails) {
            return undefined;
        }
        return (0, featureFlagUtils_1.getFlagValuesFromFlags)(featureFlagDetails.flags);
    };
    PostHogCore.prototype.getKnownFeatureFlagPayloads = function () {
        var featureFlagDetails = this.getKnownFeatureFlagDetails();
        if (!featureFlagDetails) {
            return undefined;
        }
        return (0, featureFlagUtils_1.getPayloadsFromFlags)(featureFlagDetails.flags);
    };
    PostHogCore.prototype.getBootstrappedFeatureFlagDetails = function () {
        var details = this.getPersistedProperty(types_1.PostHogPersistedProperty.BootstrapFeatureFlagDetails);
        if (!details) {
            return undefined;
        }
        return details;
    };
    PostHogCore.prototype.setBootstrappedFeatureFlagDetails = function (details) {
        this.setPersistedProperty(types_1.PostHogPersistedProperty.BootstrapFeatureFlagDetails, details);
    };
    PostHogCore.prototype.getBootstrappedFeatureFlags = function () {
        var details = this.getBootstrappedFeatureFlagDetails();
        if (!details) {
            return undefined;
        }
        return (0, featureFlagUtils_1.getFlagValuesFromFlags)(details.flags);
    };
    PostHogCore.prototype.getBootstrappedFeatureFlagPayloads = function () {
        var details = this.getBootstrappedFeatureFlagDetails();
        if (!details) {
            return undefined;
        }
        return (0, featureFlagUtils_1.getPayloadsFromFlags)(details.flags);
    };
    PostHogCore.prototype.getFeatureFlag = function (key) {
        var _a, _b, _c, _d, _e, _f, _g;
        var details = this.getFeatureFlagDetails();
        if (!details) {
            // If we haven't loaded flags yet, or errored out, we respond with undefined
            return undefined;
        }
        var featureFlag = details.flags[key];
        var response = (0, featureFlagUtils_1.getFeatureFlagValue)(featureFlag);
        if (response === undefined) {
            // For cases where the flag is unknown, return false
            response = false;
        }
        if (this.sendFeatureFlagEvent && !this.flagCallReported[key]) {
            var bootstrappedResponse = (_a = this.getBootstrappedFeatureFlags()) === null || _a === void 0 ? void 0 : _a[key];
            var bootstrappedPayload = (_b = this.getBootstrappedFeatureFlagPayloads()) === null || _b === void 0 ? void 0 : _b[key];
            this.flagCallReported[key] = true;
            this.capture('$feature_flag_called', __assign(__assign(__assign(__assign(__assign(__assign(__assign({ $feature_flag: key, $feature_flag_response: response }, (0, posthog_core_stateless_1.maybeAdd)('$feature_flag_id', (_c = featureFlag === null || featureFlag === void 0 ? void 0 : featureFlag.metadata) === null || _c === void 0 ? void 0 : _c.id)), (0, posthog_core_stateless_1.maybeAdd)('$feature_flag_version', (_d = featureFlag === null || featureFlag === void 0 ? void 0 : featureFlag.metadata) === null || _d === void 0 ? void 0 : _d.version)), (0, posthog_core_stateless_1.maybeAdd)('$feature_flag_reason', (_f = (_e = featureFlag === null || featureFlag === void 0 ? void 0 : featureFlag.reason) === null || _e === void 0 ? void 0 : _e.description) !== null && _f !== void 0 ? _f : (_g = featureFlag === null || featureFlag === void 0 ? void 0 : featureFlag.reason) === null || _g === void 0 ? void 0 : _g.code)), (0, posthog_core_stateless_1.maybeAdd)('$feature_flag_bootstrapped_response', bootstrappedResponse)), (0, posthog_core_stateless_1.maybeAdd)('$feature_flag_bootstrapped_payload', bootstrappedPayload)), { 
                // If we haven't yet received a response from the /flags endpoint, we must have used the bootstrapped value
                $used_bootstrap_value: !this.getPersistedProperty(types_1.PostHogPersistedProperty.FlagsEndpointWasHit) }), (0, posthog_core_stateless_1.maybeAdd)('$feature_flag_request_id', details.requestId)));
        }
        // If we have flags we either return the value (true or string) or false
        return response;
    };
    PostHogCore.prototype.getFeatureFlagPayload = function (key) {
        var payloads = this.getFeatureFlagPayloads();
        if (!payloads) {
            return undefined;
        }
        var response = payloads[key];
        // Undefined means a loading or missing data issue. Null means evaluation happened and there was no match
        if (response === undefined) {
            return null;
        }
        return response;
    };
    PostHogCore.prototype.getFeatureFlagPayloads = function () {
        var _a;
        return (_a = this.getFeatureFlagDetails()) === null || _a === void 0 ? void 0 : _a.featureFlagPayloads;
    };
    PostHogCore.prototype.getFeatureFlags = function () {
        var _a;
        // NOTE: We don't check for _initPromise here as the function is designed to be
        // callable before the state being loaded anyways
        return (_a = this.getFeatureFlagDetails()) === null || _a === void 0 ? void 0 : _a.featureFlags;
    };
    PostHogCore.prototype.getFeatureFlagDetails = function () {
        var _a;
        // NOTE: We don't check for _initPromise here as the function is designed to be
        // callable before the state being loaded anyways
        var details = this.getKnownFeatureFlagDetails();
        var overriddenFlags = this.getPersistedProperty(types_1.PostHogPersistedProperty.OverrideFeatureFlags);
        if (!overriddenFlags) {
            return details;
        }
        details = details !== null && details !== void 0 ? details : { featureFlags: {}, featureFlagPayloads: {}, flags: {} };
        var flags = (_a = details.flags) !== null && _a !== void 0 ? _a : {};
        for (var key in overriddenFlags) {
            if (!overriddenFlags[key]) {
                delete flags[key];
            }
            else {
                flags[key] = (0, featureFlagUtils_1.updateFlagValue)(flags[key], overriddenFlags[key]);
            }
        }
        var result = __assign(__assign({}, details), { flags: flags });
        return (0, featureFlagUtils_1.normalizeFlagsResponse)(result);
    };
    PostHogCore.prototype.getFeatureFlagsAndPayloads = function () {
        var flags = this.getFeatureFlags();
        var payloads = this.getFeatureFlagPayloads();
        return {
            flags: flags,
            payloads: payloads,
        };
    };
    PostHogCore.prototype.isFeatureEnabled = function (key) {
        var response = this.getFeatureFlag(key);
        if (response === undefined) {
            return undefined;
        }
        return !!response;
    };
    // Used when we want to trigger the reload but we don't care about the result
    PostHogCore.prototype.reloadFeatureFlags = function (options) {
        var _this = this;
        this.flagsAsync(true)
            .then(function (res) {
            var _a;
            (_a = options === null || options === void 0 ? void 0 : options.cb) === null || _a === void 0 ? void 0 : _a.call(options, undefined, res === null || res === void 0 ? void 0 : res.featureFlags);
        })
            .catch(function (e) {
            var _a;
            (_a = options === null || options === void 0 ? void 0 : options.cb) === null || _a === void 0 ? void 0 : _a.call(options, e, undefined);
            if (!(options === null || options === void 0 ? void 0 : options.cb)) {
                _this._logger.info('Error reloading feature flags', e);
            }
        });
    };
    PostHogCore.prototype.reloadRemoteConfigAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.remoteConfigAsync()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    PostHogCore.prototype.reloadFeatureFlagsAsync = function (sendAnonDistinctId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.flagsAsync(sendAnonDistinctId !== null && sendAnonDistinctId !== void 0 ? sendAnonDistinctId : true)];
                    case 1: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.featureFlags];
                }
            });
        });
    };
    PostHogCore.prototype.onFeatureFlags = function (cb) {
        var _this = this;
        return this.on('featureflags', function () { return __awaiter(_this, void 0, void 0, function () {
            var flags;
            return __generator(this, function (_a) {
                flags = this.getFeatureFlags();
                if (flags) {
                    cb(flags);
                }
                return [2 /*return*/];
            });
        }); });
    };
    PostHogCore.prototype.onFeatureFlag = function (key, cb) {
        var _this = this;
        return this.on('featureflags', function () { return __awaiter(_this, void 0, void 0, function () {
            var flagResponse;
            return __generator(this, function (_a) {
                flagResponse = this.getFeatureFlag(key);
                if (flagResponse !== undefined) {
                    cb(flagResponse);
                }
                return [2 /*return*/];
            });
        }); });
    };
    PostHogCore.prototype.overrideFeatureFlag = function (flags) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.wrap(function () {
                    if (flags === null) {
                        return _this.setPersistedProperty(types_1.PostHogPersistedProperty.OverrideFeatureFlags, null);
                    }
                    return _this.setPersistedProperty(types_1.PostHogPersistedProperty.OverrideFeatureFlags, flags);
                });
                return [2 /*return*/];
            });
        });
    };
    /**
     * Capture a caught exception manually
     *
     * {@label Error tracking}
     *
     * @public
     *
     * @example
     * ```js
     * // Capture a caught exception
     * try {
     *   // something that might throw
     * } catch (error) {
     *   posthog.captureException(error)
     * }
     * ```
     *
     * @example
     * ```js
     * // With additional properties
     * posthog.captureException(error, {
     *   customProperty: 'value',
     *   anotherProperty: ['I', 'can be a list'],
     *   ...
     * })
     * ```
     *
     * @param {Error} error The error to capture
     * @param {Object} [additionalProperties] Any additional properties to add to the error event
     * @returns {CaptureResult} The result of the capture
     */
    PostHogCore.prototype.captureException = function (error, additionalProperties) {
        var properties = __assign({ $exception_level: 'error', $exception_list: [
                {
                    type: (0, utils_1.isPlainError)(error) ? error.name : 'Error',
                    value: (0, utils_1.isPlainError)(error) ? error.message : error,
                    mechanism: {
                        handled: true,
                        synthetic: false,
                    },
                },
            ] }, additionalProperties);
        this.capture('$exception', properties);
    };
    /**
     * Capture written user feedback for a LLM trace. Numeric values are converted to strings.
     *
     * {@label LLM analytics}
     *
     * @public
     *
     * @param traceId The trace ID to capture feedback for.
     * @param userFeedback The feedback to capture.
     */
    PostHogCore.prototype.captureTraceFeedback = function (traceId, userFeedback) {
        this.capture('$ai_feedback', {
            $ai_feedback_text: userFeedback,
            $ai_trace_id: String(traceId),
        });
    };
    /**
     * Capture a metric for a LLM trace. Numeric values are converted to strings.
     *
     * {@label LLM analytics}
     *
     * @public
     *
     * @param traceId The trace ID to capture the metric for.
     * @param metricName The name of the metric to capture.
     * @param metricValue The value of the metric to capture.
     */
    PostHogCore.prototype.captureTraceMetric = function (traceId, metricName, metricValue) {
        this.capture('$ai_metric', {
            $ai_metric_name: metricName,
            $ai_metric_value: String(metricValue),
            $ai_trace_id: String(traceId),
        });
    };
    return PostHogCore;
}(posthog_core_stateless_1.PostHogCoreStateless));
exports.PostHogCore = PostHogCore;
//# sourceMappingURL=posthog-core.js.map