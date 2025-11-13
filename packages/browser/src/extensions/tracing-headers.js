import { assignableWindow } from '../utils/globals';
import { createLogger } from '../utils/logger';
import { isUndefined } from '@agrid/core';
const logger = createLogger('[TracingHeaders]');
export class TracingHeaders {
    constructor(_instance) {
        this._instance = _instance;
        this._restoreXHRPatch = undefined;
        this._restoreFetchPatch = undefined;
        this._startCapturing = () => {
            var _a, _b, _c, _d;
            if (isUndefined(this._restoreXHRPatch)) {
                (_b = (_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.tracingHeadersPatchFns) === null || _b === void 0 ? void 0 : _b._patchXHR(this._instance.config.__add_tracing_headers || [], this._instance.get_distinct_id(), this._instance.sessionManager);
            }
            if (isUndefined(this._restoreFetchPatch)) {
                (_d = (_c = assignableWindow.__PosthogExtensions__) === null || _c === void 0 ? void 0 : _c.tracingHeadersPatchFns) === null || _d === void 0 ? void 0 : _d._patchFetch(this._instance.config.__add_tracing_headers || [], this._instance.get_distinct_id(), this._instance.sessionManager);
            }
        };
    }
    _loadScript(cb) {
        var _a, _b, _c;
        if ((_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.tracingHeadersPatchFns) {
            // already loaded
            cb();
        }
        (_c = (_b = assignableWindow.__PosthogExtensions__) === null || _b === void 0 ? void 0 : _b.loadExternalDependency) === null || _c === void 0 ? void 0 : _c.call(_b, this._instance, 'tracing-headers', (err) => {
            if (err) {
                return logger.error('failed to load script', err);
            }
            cb();
        });
    }
    startIfEnabledOrStop() {
        var _a, _b;
        if (this._instance.config.__add_tracing_headers) {
            this._loadScript(this._startCapturing);
        }
        else {
            (_a = this._restoreXHRPatch) === null || _a === void 0 ? void 0 : _a.call(this);
            (_b = this._restoreFetchPatch) === null || _b === void 0 ? void 0 : _b.call(this);
            // we don't want to call these twice so we reset them
            this._restoreXHRPatch = undefined;
            this._restoreFetchPatch = undefined;
        }
    }
}
