import { assignableWindow } from '../utils/globals';
import { createLogger } from '../utils/logger';
const logger = createLogger('[PostHog ExternalIntegrations]');
const MAPPED_INTEGRATIONS = {
    intercom: 'intercom-integration',
    crispChat: 'crisp-chat-integration',
};
export class ExternalIntegrations {
    constructor(_instance) {
        this._instance = _instance;
    }
    _loadScript(name, cb) {
        var _a, _b;
        (_b = (_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.loadExternalDependency) === null || _b === void 0 ? void 0 : _b.call(_a, this._instance, name, (err) => {
            if (err) {
                return logger.error('failed to load script', err);
            }
            cb();
        });
    }
    startIfEnabledOrStop() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        for (const [key, value] of Object.entries((_a = this._instance.config.integrations) !== null && _a !== void 0 ? _a : {})) {
            // if the integration is enabled, and not present, then load it
            if (value && !((_c = (_b = assignableWindow.__PosthogExtensions__) === null || _b === void 0 ? void 0 : _b.integrations) === null || _c === void 0 ? void 0 : _c[key])) {
                this._loadScript(MAPPED_INTEGRATIONS[key], () => {
                    var _a, _b, _c;
                    (_c = (_b = (_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.integrations) === null || _b === void 0 ? void 0 : _b[key]) === null || _c === void 0 ? void 0 : _c.start(this._instance);
                });
            }
            // if the integration is disabled, and present, then stop it
            if (!value && ((_e = (_d = assignableWindow.__PosthogExtensions__) === null || _d === void 0 ? void 0 : _d.integrations) === null || _e === void 0 ? void 0 : _e[key])) {
                (_h = (_g = (_f = assignableWindow.__PosthogExtensions__) === null || _f === void 0 ? void 0 : _f.integrations) === null || _g === void 0 ? void 0 : _g[key]) === null || _h === void 0 ? void 0 : _h.stop();
            }
        }
    }
}
