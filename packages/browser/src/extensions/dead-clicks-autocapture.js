import { DEAD_CLICKS_ENABLED_SERVER_SIDE } from '../constants';
import { isBoolean, isObject } from '@agrid/core';
import { assignableWindow, document } from '../utils/globals';
import { createLogger } from '../utils/logger';
const logger = createLogger('[Dead Clicks]');
export const isDeadClicksEnabledForHeatmaps = () => {
    return true;
};
export const isDeadClicksEnabledForAutocapture = (instance) => {
    var _a;
    const isRemoteEnabled = !!((_a = instance.instance.persistence) === null || _a === void 0 ? void 0 : _a.get_property(DEAD_CLICKS_ENABLED_SERVER_SIDE));
    const clientConfig = instance.instance.config.capture_dead_clicks;
    return isBoolean(clientConfig) ? clientConfig : isRemoteEnabled;
};
export class DeadClicksAutocapture {
    get lazyLoadedDeadClicksAutocapture() {
        return this._lazyLoadedDeadClicksAutocapture;
    }
    constructor(instance, isEnabled, onCapture) {
        this.instance = instance;
        this.isEnabled = isEnabled;
        this.onCapture = onCapture;
        this.startIfEnabled();
    }
    onRemoteConfig(response) {
        if (this.instance.persistence) {
            this.instance.persistence.register({
                [DEAD_CLICKS_ENABLED_SERVER_SIDE]: response === null || response === void 0 ? void 0 : response.captureDeadClicks,
            });
        }
        this.startIfEnabled();
    }
    startIfEnabled() {
        if (this.isEnabled(this)) {
            this._loadScript(() => {
                this._start();
            });
        }
    }
    _loadScript(cb) {
        var _a, _b, _c;
        if ((_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.initDeadClicksAutocapture) {
            // already loaded
            cb();
        }
        (_c = (_b = assignableWindow.__PosthogExtensions__) === null || _b === void 0 ? void 0 : _b.loadExternalDependency) === null || _c === void 0 ? void 0 : _c.call(_b, this.instance, 'dead-clicks-autocapture', (err) => {
            if (err) {
                logger.error('failed to load script', err);
                return;
            }
            cb();
        });
    }
    _start() {
        var _a;
        if (!document) {
            logger.error('`document` not found. Cannot start.');
            return;
        }
        if (!this._lazyLoadedDeadClicksAutocapture &&
            ((_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.initDeadClicksAutocapture)) {
            const config = isObject(this.instance.config.capture_dead_clicks)
                ? this.instance.config.capture_dead_clicks
                : {};
            config.__onCapture = this.onCapture;
            this._lazyLoadedDeadClicksAutocapture = assignableWindow.__PosthogExtensions__.initDeadClicksAutocapture(this.instance, config);
            this._lazyLoadedDeadClicksAutocapture.start(document);
            logger.info(`starting...`);
        }
    }
    stop() {
        if (this._lazyLoadedDeadClicksAutocapture) {
            this._lazyLoadedDeadClicksAutocapture.stop();
            this._lazyLoadedDeadClicksAutocapture = undefined;
            logger.info(`stopping...`);
        }
    }
}
