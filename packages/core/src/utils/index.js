"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isError = exports.isPromise = exports.STRING_FORMAT = void 0;
exports.assert = assert;
exports.removeTrailingSlash = removeTrailingSlash;
exports.retriable = retriable;
exports.currentTimestamp = currentTimestamp;
exports.currentISOTime = currentISOTime;
exports.safeSetTimeout = safeSetTimeout;
exports.getFetch = getFetch;
exports.allSettled = allSettled;
__exportStar(require("./bot-detection"), exports);
__exportStar(require("./bucketed-rate-limiter"), exports);
__exportStar(require("./number-utils"), exports);
__exportStar(require("./string-utils"), exports);
__exportStar(require("./type-utils"), exports);
__exportStar(require("./promise-queue"), exports);
exports.STRING_FORMAT = 'utf8';
function assert(truthyValue, message) {
    if (!truthyValue || typeof truthyValue !== 'string' || isEmpty(truthyValue)) {
        throw new Error(message);
    }
}
function isEmpty(truthyValue) {
    if (truthyValue.trim().length === 0) {
        return true;
    }
    return false;
}
function removeTrailingSlash(url) {
    return url === null || url === void 0 ? void 0 : url.replace(/\/+$/, '');
}
function retriable(fn, props) {
    return __awaiter(this, void 0, void 0, function () {
        var lastError, i, res, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lastError = null;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < props.retryCount + 1)) return [3 /*break*/, 7];
                    if (!(i > 0)) return [3 /*break*/, 3];
                    // don't wait when it's the last try
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, props.retryDelay); })];
                case 2:
                    // don't wait when it's the last try
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, fn()];
                case 4:
                    res = _a.sent();
                    return [2 /*return*/, res];
                case 5:
                    e_1 = _a.sent();
                    lastError = e_1;
                    if (!props.retryCheck(e_1)) {
                        throw e_1;
                    }
                    return [3 /*break*/, 6];
                case 6:
                    i++;
                    return [3 /*break*/, 1];
                case 7: throw lastError;
            }
        });
    });
}
function currentTimestamp() {
    return new Date().getTime();
}
function currentISOTime() {
    return new Date().toISOString();
}
function safeSetTimeout(fn, timeout) {
    // NOTE: we use this so rarely that it is totally fine to do `safeSetTimeout(fn, 0)``
    // rather than setImmediate.
    var t = setTimeout(fn, timeout);
    // We unref if available to prevent Node.js hanging on exit
    (t === null || t === void 0 ? void 0 : t.unref) && (t === null || t === void 0 ? void 0 : t.unref());
    return t;
}
// NOTE: We opt for this slightly imperfect check as the global "Promise" object can get mutated in certain environments
var isPromise = function (obj) {
    return obj && typeof obj.then === 'function';
};
exports.isPromise = isPromise;
var isError = function (x) {
    return x instanceof Error;
};
exports.isError = isError;
function getFetch() {
    return typeof fetch !== 'undefined' ? fetch : typeof globalThis.fetch !== 'undefined' ? globalThis.fetch : undefined;
}
function allSettled(promises) {
    return Promise.all(promises.map(function (p) {
        return (p !== null && p !== void 0 ? p : Promise.resolve()).then(function (value) { return ({ status: 'fulfilled', value: value }); }, function (reason) { return ({ status: 'rejected', reason: reason }); });
    }));
}
//# sourceMappingURL=index.js.map