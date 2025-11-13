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
async function retriable(fn, props) {
    let lastError = null;
    for (let i = 0; i < props.retryCount + 1; i++) {
        if (i > 0) {
            // don't wait when it's the last try
            await new Promise((r) => setTimeout(r, props.retryDelay));
        }
        try {
            const res = await fn();
            return res;
        }
        catch (e) {
            lastError = e;
            if (!props.retryCheck(e)) {
                throw e;
            }
        }
    }
    throw lastError;
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
    const t = setTimeout(fn, timeout);
    // We unref if available to prevent Node.js hanging on exit
    (t === null || t === void 0 ? void 0 : t.unref) && (t === null || t === void 0 ? void 0 : t.unref());
    return t;
}
// NOTE: We opt for this slightly imperfect check as the global "Promise" object can get mutated in certain environments
const isPromise = (obj) => {
    return obj && typeof obj.then === 'function';
};
exports.isPromise = isPromise;
const isError = (x) => {
    return x instanceof Error;
};
exports.isError = isError;
function getFetch() {
    return typeof fetch !== 'undefined' ? fetch : typeof globalThis.fetch !== 'undefined' ? globalThis.fetch : undefined;
}
function allSettled(promises) {
    return Promise.all(promises.map((p) => (p !== null && p !== void 0 ? p : Promise.resolve()).then((value) => ({ status: 'fulfilled', value }), (reason) => ({ status: 'rejected', reason }))));
}
//# sourceMappingURL=index.js.map