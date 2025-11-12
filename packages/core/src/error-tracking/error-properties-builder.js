"use strict";
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
exports.ErrorPropertiesBuilder = void 0;
var utils_1 = require("@/utils");
var chunk_ids_1 = require("./chunk-ids");
var parsers_1 = require("./parsers");
var MAX_CAUSE_RECURSION = 4;
var ErrorPropertiesBuilder = /** @class */ (function () {
    function ErrorPropertiesBuilder(coercers, parsers, modifiers) {
        if (coercers === void 0) { coercers = []; }
        if (parsers === void 0) { parsers = []; }
        if (modifiers === void 0) { modifiers = []; }
        this.coercers = coercers;
        this.modifiers = modifiers;
        this.stackParser = parsers_1.createStackParser.apply(void 0, __spreadArray([], __read(parsers), false));
    }
    ErrorPropertiesBuilder.prototype.buildFromUnknown = function (input, hint) {
        if (hint === void 0) { hint = {}; }
        var providedMechanism = hint && hint.mechanism;
        var mechanism = providedMechanism || {
            handled: true,
            type: 'generic',
        };
        var coercingContext = this.buildCoercingContext(mechanism, hint, 0);
        var exceptionWithCause = coercingContext.apply(input);
        var parsingContext = this.buildParsingContext();
        var exceptionWithStack = this.parseStacktrace(exceptionWithCause, parsingContext);
        var exceptionList = this.convertToExceptionList(exceptionWithStack, mechanism);
        return {
            $exception_list: exceptionList,
            $exception_level: 'error',
        };
    };
    ErrorPropertiesBuilder.prototype.modifyFrames = function (exceptionList) {
        return __awaiter(this, void 0, void 0, function () {
            var exceptionList_1, exceptionList_1_1, exc, _a, e_1_1;
            var e_1, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, 6, 7]);
                        exceptionList_1 = __values(exceptionList), exceptionList_1_1 = exceptionList_1.next();
                        _c.label = 1;
                    case 1:
                        if (!!exceptionList_1_1.done) return [3 /*break*/, 4];
                        exc = exceptionList_1_1.value;
                        if (!(exc.stacktrace && exc.stacktrace.frames && (0, utils_1.isArray)(exc.stacktrace.frames))) return [3 /*break*/, 3];
                        _a = exc.stacktrace;
                        return [4 /*yield*/, this.applyModifiers(exc.stacktrace.frames)];
                    case 2:
                        _a.frames = _c.sent();
                        _c.label = 3;
                    case 3:
                        exceptionList_1_1 = exceptionList_1.next();
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        e_1_1 = _c.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 7];
                    case 6:
                        try {
                            if (exceptionList_1_1 && !exceptionList_1_1.done && (_b = exceptionList_1.return)) _b.call(exceptionList_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/, exceptionList];
                }
            });
        });
    };
    ErrorPropertiesBuilder.prototype.coerceFallback = function (ctx) {
        var _a;
        return {
            type: 'Error',
            value: 'Unknown error',
            stack: (_a = ctx.syntheticException) === null || _a === void 0 ? void 0 : _a.stack,
            synthetic: true,
        };
    };
    ErrorPropertiesBuilder.prototype.parseStacktrace = function (err, ctx) {
        var cause = undefined;
        if (err.cause != null) {
            cause = this.parseStacktrace(err.cause, ctx);
        }
        var stack = undefined;
        if (err.stack != '' && err.stack != null) {
            stack = this.applyChunkIds(this.stackParser(err.stack, err.synthetic ? 1 : 0), ctx.chunkIdMap);
        }
        return __assign(__assign({}, err), { cause: cause, stack: stack });
    };
    ErrorPropertiesBuilder.prototype.applyChunkIds = function (frames, chunkIdMap) {
        return frames.map(function (frame) {
            if (frame.filename && chunkIdMap) {
                frame.chunk_id = chunkIdMap[frame.filename];
            }
            return frame;
        });
    };
    ErrorPropertiesBuilder.prototype.applyCoercers = function (input, ctx) {
        var e_2, _a;
        try {
            for (var _b = __values(this.coercers), _c = _b.next(); !_c.done; _c = _b.next()) {
                var adapter = _c.value;
                if (adapter.match(input)) {
                    return adapter.coerce(input, ctx);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return this.coerceFallback(ctx);
    };
    ErrorPropertiesBuilder.prototype.applyModifiers = function (frames) {
        return __awaiter(this, void 0, void 0, function () {
            var newFrames, _a, _b, modifier, e_3_1;
            var e_3, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        newFrames = frames;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = __values(this.modifiers), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        modifier = _b.value;
                        return [4 /*yield*/, modifier(newFrames)];
                    case 3:
                        newFrames = _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_3_1 = _d.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/, newFrames];
                }
            });
        });
    };
    ErrorPropertiesBuilder.prototype.convertToExceptionList = function (exceptionWithStack, mechanism) {
        var _a, _b, _c;
        var currentException = {
            type: exceptionWithStack.type,
            value: exceptionWithStack.value,
            mechanism: {
                type: (_a = mechanism.type) !== null && _a !== void 0 ? _a : 'generic',
                handled: (_b = mechanism.handled) !== null && _b !== void 0 ? _b : true,
                synthetic: (_c = exceptionWithStack.synthetic) !== null && _c !== void 0 ? _c : false,
            },
        };
        if (exceptionWithStack.stack) {
            currentException.stacktrace = {
                type: 'raw',
                frames: exceptionWithStack.stack,
            };
        }
        var exceptionList = [currentException];
        if (exceptionWithStack.cause != null) {
            // Cause errors are necessarily handled
            exceptionList.push.apply(exceptionList, __spreadArray([], __read(this.convertToExceptionList(exceptionWithStack.cause, __assign(__assign({}, mechanism), { handled: true }))), false));
        }
        return exceptionList;
    };
    ErrorPropertiesBuilder.prototype.buildParsingContext = function () {
        var context = {
            chunkIdMap: (0, chunk_ids_1.getFilenameToChunkIdMap)(this.stackParser),
        };
        return context;
    };
    ErrorPropertiesBuilder.prototype.buildCoercingContext = function (mechanism, hint, depth) {
        var _this = this;
        if (depth === void 0) { depth = 0; }
        var coerce = function (input, depth) {
            if (depth <= MAX_CAUSE_RECURSION) {
                var ctx = _this.buildCoercingContext(mechanism, hint, depth);
                return _this.applyCoercers(input, ctx);
            }
            else {
                return undefined;
            }
        };
        var context = __assign(__assign({}, hint), { 
            // Do not propagate synthetic exception as it doesn't make sense
            syntheticException: depth == 0 ? hint.syntheticException : undefined, mechanism: mechanism, apply: function (input) {
                return coerce(input, depth);
            }, next: function (input) {
                return coerce(input, depth + 1);
            } });
        return context;
    };
    return ErrorPropertiesBuilder;
}());
exports.ErrorPropertiesBuilder = ErrorPropertiesBuilder;
//# sourceMappingURL=error-properties-builder.js.map