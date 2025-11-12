"use strict";
// Portions of this file are derived from getsentry/sentry-javascript by Software, Inc. dba Sentry
// Licensed under the MIT License
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReduceableCache = void 0;
/** A simple Least Recently Used map */
var ReduceableCache = /** @class */ (function () {
    function ReduceableCache(_maxSize) {
        this._maxSize = _maxSize;
        this._cache = new Map();
    }
    /** Get an entry or undefined if it was not in the cache. Re-inserts to update the recently used order */
    ReduceableCache.prototype.get = function (key) {
        var value = this._cache.get(key);
        if (value === undefined) {
            return undefined;
        }
        // Remove and re-insert to update the order
        this._cache.delete(key);
        this._cache.set(key, value);
        return value;
    };
    /** Insert an entry and evict an older entry if we've reached maxSize */
    ReduceableCache.prototype.set = function (key, value) {
        this._cache.set(key, value);
    };
    /** Remove an entry and return the entry if it was in the cache */
    ReduceableCache.prototype.reduce = function () {
        while (this._cache.size >= this._maxSize) {
            var value = this._cache.keys().next().value;
            if (value) {
                // keys() returns an iterator in insertion order so keys().next() gives us the oldest key
                this._cache.delete(value);
            }
        }
    };
    return ReduceableCache;
}());
exports.ReduceableCache = ReduceableCache;
//# sourceMappingURL=utils.js.map