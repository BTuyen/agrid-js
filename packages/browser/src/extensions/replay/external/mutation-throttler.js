import { INCREMENTAL_SNAPSHOT_EVENT_TYPE, MUTATION_SOURCE_TYPE } from './sessionrecording-utils';
import { BucketedRateLimiter } from '@agrid/core';
import { logger } from '../../../utils/logger';
export class MutationThrottler {
    constructor(_rrweb, _options = {}) {
        var _a, _b;
        this._rrweb = _rrweb;
        this._options = _options;
        this._loggedTracker = {};
        this._onNodeRateLimited = (key) => {
            var _a, _b;
            if (!this._loggedTracker[key]) {
                this._loggedTracker[key] = true;
                const node = this._getNode(key);
                (_b = (_a = this._options).onBlockedNode) === null || _b === void 0 ? void 0 : _b.call(_a, key, node);
            }
        };
        this._getNodeOrRelevantParent = (id) => {
            // For some nodes we know they are part of a larger tree such as an SVG.
            // For those we want to block the entire node, not just the specific attribute
            const node = this._getNode(id);
            // Check if the node is an Element and then find the closest parent that is an SVG
            if ((node === null || node === void 0 ? void 0 : node.nodeName) !== 'svg' && node instanceof Element) {
                const closestSVG = node.closest('svg');
                if (closestSVG) {
                    return [this._rrweb.mirror.getId(closestSVG), closestSVG];
                }
            }
            return [id, node];
        };
        this._getNode = (id) => this._rrweb.mirror.getNode(id);
        this._numberOfChanges = (data) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return (((_b = (_a = data.removes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) +
                ((_d = (_c = data.attributes) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) +
                ((_f = (_e = data.texts) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0) +
                ((_h = (_g = data.adds) === null || _g === void 0 ? void 0 : _g.length) !== null && _h !== void 0 ? _h : 0));
        };
        this.throttleMutations = (event) => {
            if (event.type !== INCREMENTAL_SNAPSHOT_EVENT_TYPE || event.data.source !== MUTATION_SOURCE_TYPE) {
                return event;
            }
            const data = event.data;
            const initialMutationCount = this._numberOfChanges(data);
            if (data.attributes) {
                // Most problematic mutations come from attrs where the style or minor properties are changed rapidly
                data.attributes = data.attributes.filter((attr) => {
                    const [nodeId] = this._getNodeOrRelevantParent(attr.id);
                    const isRateLimited = this._rateLimiter.consumeRateLimit(nodeId);
                    if (isRateLimited) {
                        return false;
                    }
                    return attr;
                });
            }
            // Check if every part of the mutation is empty in which case there is nothing to do
            const mutationCount = this._numberOfChanges(data);
            if (mutationCount === 0 && initialMutationCount !== mutationCount) {
                // If we have modified the mutation count and the remaining count is 0, then we don't need the event.
                return;
            }
            return event;
        };
        this._rateLimiter = new BucketedRateLimiter({
            bucketSize: (_a = this._options.bucketSize) !== null && _a !== void 0 ? _a : 100,
            refillRate: (_b = this._options.refillRate) !== null && _b !== void 0 ? _b : 10,
            refillInterval: 1000, // one second
            _onBucketRateLimited: this._onNodeRateLimited,
            _logger: logger,
        });
    }
    reset() {
        this._loggedTracker = {};
    }
    stop() {
        this._rateLimiter.stop();
        this.reset();
    }
}
