"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BucketedRateLimiter = void 0;
const number_utils_1 = require("./number-utils");
const ONE_DAY_IN_MS = 86400000;
class BucketedRateLimiter {
    constructor(options) {
        this._buckets = {};
        this._onBucketRateLimited = options._onBucketRateLimited;
        this._bucketSize = (0, number_utils_1.clampToRange)(options.bucketSize, 0, 100, options._logger);
        this._refillRate = (0, number_utils_1.clampToRange)(options.refillRate, 0, this._bucketSize, options._logger);
        this._refillInterval = (0, number_utils_1.clampToRange)(options.refillInterval, 0, ONE_DAY_IN_MS, options._logger);
    }
    _applyRefill(bucket, now) {
        const elapsedMs = now - bucket.lastAccess;
        const refillIntervals = Math.floor(elapsedMs / this._refillInterval);
        if (refillIntervals > 0) {
            const tokensToAdd = refillIntervals * this._refillRate;
            bucket.tokens = Math.min(bucket.tokens + tokensToAdd, this._bucketSize);
            bucket.lastAccess = bucket.lastAccess + refillIntervals * this._refillInterval;
        }
    }
    consumeRateLimit(key) {
        var _a;
        const now = Date.now();
        const keyStr = String(key);
        let bucket = this._buckets[keyStr];
        if (!bucket) {
            bucket = { tokens: this._bucketSize, lastAccess: now };
            this._buckets[keyStr] = bucket;
        }
        else {
            this._applyRefill(bucket, now);
        }
        if (bucket.tokens === 0) {
            return true;
        }
        bucket.tokens--;
        if (bucket.tokens === 0) {
            (_a = this._onBucketRateLimited) === null || _a === void 0 ? void 0 : _a.call(this, key);
        }
        return bucket.tokens === 0;
    }
    stop() {
        this._buckets = {};
    }
}
exports.BucketedRateLimiter = BucketedRateLimiter;
//# sourceMappingURL=bucketed-rate-limiter.js.map