"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BucketedRateLimiter = void 0;
var number_utils_1 = require("./number-utils");
var ONE_DAY_IN_MS = 86400000;
var BucketedRateLimiter = /** @class */ (function () {
    function BucketedRateLimiter(options) {
        this._buckets = {};
        this._onBucketRateLimited = options._onBucketRateLimited;
        this._bucketSize = (0, number_utils_1.clampToRange)(options.bucketSize, 0, 100, options._logger);
        this._refillRate = (0, number_utils_1.clampToRange)(options.refillRate, 0, this._bucketSize, options._logger);
        this._refillInterval = (0, number_utils_1.clampToRange)(options.refillInterval, 0, ONE_DAY_IN_MS, options._logger);
    }
    BucketedRateLimiter.prototype._applyRefill = function (bucket, now) {
        var elapsedMs = now - bucket.lastAccess;
        var refillIntervals = Math.floor(elapsedMs / this._refillInterval);
        if (refillIntervals > 0) {
            var tokensToAdd = refillIntervals * this._refillRate;
            bucket.tokens = Math.min(bucket.tokens + tokensToAdd, this._bucketSize);
            bucket.lastAccess = bucket.lastAccess + refillIntervals * this._refillInterval;
        }
    };
    BucketedRateLimiter.prototype.consumeRateLimit = function (key) {
        var _a;
        var now = Date.now();
        var keyStr = String(key);
        var bucket = this._buckets[keyStr];
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
    };
    BucketedRateLimiter.prototype.stop = function () {
        this._buckets = {};
    };
    return BucketedRateLimiter;
}());
exports.BucketedRateLimiter = BucketedRateLimiter;
//# sourceMappingURL=bucketed-rate-limiter.js.map