import { navigator, window } from './utils/globals';
import { WEB_EXPERIMENTS } from './constants';
import { isNullish, isString } from '@agrid/core';
import { getQueryParam } from './utils/request-utils';
import { isMatchingRegex } from './utils/regex-utils';
import { logger } from './utils/logger';
import { isLikelyBot } from './utils/blocked-uas';
import { getCampaignParams } from './utils/event-utils';
export const webExperimentUrlValidationMap = {
    icontains: (conditionsUrl, location) => !!window && location.href.toLowerCase().indexOf(conditionsUrl.toLowerCase()) > -1,
    not_icontains: (conditionsUrl, location) => !!window && location.href.toLowerCase().indexOf(conditionsUrl.toLowerCase()) === -1,
    regex: (conditionsUrl, location) => !!window && isMatchingRegex(location.href, conditionsUrl),
    not_regex: (conditionsUrl, location) => !!window && !isMatchingRegex(location.href, conditionsUrl),
    exact: (conditionsUrl, location) => location.href === conditionsUrl,
    is_not: (conditionsUrl, location) => location.href !== conditionsUrl,
};
export class WebExperiments {
    constructor(_instance) {
        this._instance = _instance;
        this.getWebExperimentsAndEvaluateDisplayLogic = (forceReload = false) => {
            this.getWebExperiments((webExperiments) => {
                WebExperiments._logInfo(`retrieved web experiments from the server`);
                this._flagToExperiments = new Map();
                webExperiments.forEach((webExperiment) => {
                    var _a;
                    if (webExperiment.feature_flag_key) {
                        if (this._flagToExperiments) {
                            WebExperiments._logInfo(`setting flag key `, webExperiment.feature_flag_key, ` to web experiment `, webExperiment);
                            (_a = this._flagToExperiments) === null || _a === void 0 ? void 0 : _a.set(webExperiment.feature_flag_key, webExperiment);
                        }
                        const selectedVariant = this._instance.getFeatureFlag(webExperiment.feature_flag_key);
                        if (isString(selectedVariant) && webExperiment.variants[selectedVariant]) {
                            this._applyTransforms(webExperiment.name, selectedVariant, webExperiment.variants[selectedVariant].transforms);
                        }
                    }
                    else if (webExperiment.variants) {
                        for (const variant in webExperiment.variants) {
                            const testVariant = webExperiment.variants[variant];
                            const matchTest = WebExperiments._matchesTestVariant(testVariant);
                            if (matchTest) {
                                this._applyTransforms(webExperiment.name, variant, testVariant.transforms);
                            }
                        }
                    }
                });
            }, forceReload);
        };
        this._instance.onFeatureFlags((flags) => {
            this.onFeatureFlags(flags);
        });
    }
    onFeatureFlags(flags) {
        if (this._is_bot()) {
            WebExperiments._logInfo('Refusing to render web experiment since the viewer is a likely bot');
            return;
        }
        if (this._instance.config.disable_web_experiments) {
            return;
        }
        if (isNullish(this._flagToExperiments)) {
            // Indicates first load so we trigger the loaders
            this._flagToExperiments = new Map();
            this.loadIfEnabled();
            this.previewWebExperiment();
            return;
        }
        WebExperiments._logInfo('applying feature flags', flags);
        flags.forEach((flag) => {
            var _a, _b;
            if (this._flagToExperiments && ((_a = this._flagToExperiments) === null || _a === void 0 ? void 0 : _a.has(flag))) {
                const selectedVariant = this._instance.getFeatureFlag(flag);
                const webExperiment = (_b = this._flagToExperiments) === null || _b === void 0 ? void 0 : _b.get(flag);
                if (selectedVariant && (webExperiment === null || webExperiment === void 0 ? void 0 : webExperiment.variants[selectedVariant])) {
                    this._applyTransforms(webExperiment.name, selectedVariant, webExperiment.variants[selectedVariant].transforms);
                }
            }
        });
    }
    previewWebExperiment() {
        const location = WebExperiments.getWindowLocation();
        if (location === null || location === void 0 ? void 0 : location.search) {
            const experimentID = getQueryParam(location === null || location === void 0 ? void 0 : location.search, '__experiment_id');
            const variant = getQueryParam(location === null || location === void 0 ? void 0 : location.search, '__experiment_variant');
            if (experimentID && variant) {
                WebExperiments._logInfo(`previewing web experiments ${experimentID} && ${variant}`);
                this.getWebExperiments((webExperiments) => {
                    this._showPreviewWebExperiment(parseInt(experimentID), variant, webExperiments);
                }, false, true);
            }
        }
    }
    loadIfEnabled() {
        if (this._instance.config.disable_web_experiments) {
            return;
        }
        this.getWebExperimentsAndEvaluateDisplayLogic();
    }
    getWebExperiments(callback, forceReload, previewing) {
        if (this._instance.config.disable_web_experiments && !previewing) {
            return callback([]);
        }
        const existingWebExperiments = this._instance.get_property(WEB_EXPERIMENTS);
        if (existingWebExperiments && !forceReload) {
            return callback(existingWebExperiments);
        }
        this._instance._send_request({
            url: this._instance.requestRouter.endpointFor('api', `/api/web_experiments/?token=${this._instance.config.token}`),
            method: 'GET',
            callback: (response) => {
                if (response.statusCode !== 200 || !response.json) {
                    return callback([]);
                }
                const webExperiments = response.json.experiments || [];
                return callback(webExperiments);
            },
        });
    }
    _showPreviewWebExperiment(experimentID, variant, webExperiments) {
        const previewExperiments = webExperiments.filter((exp) => exp.id === experimentID);
        if (previewExperiments && previewExperiments.length > 0) {
            WebExperiments._logInfo(`Previewing web experiment [${previewExperiments[0].name}] with variant [${variant}]`);
            this._applyTransforms(previewExperiments[0].name, variant, previewExperiments[0].variants[variant].transforms);
        }
    }
    static _matchesTestVariant(testVariant) {
        if (isNullish(testVariant.conditions)) {
            return false;
        }
        return WebExperiments._matchUrlConditions(testVariant) && WebExperiments._matchUTMConditions(testVariant);
    }
    static _matchUrlConditions(testVariant) {
        var _a, _b, _c, _d;
        if (isNullish(testVariant.conditions) || isNullish((_a = testVariant.conditions) === null || _a === void 0 ? void 0 : _a.url)) {
            return true;
        }
        const location = WebExperiments.getWindowLocation();
        if (location) {
            const urlCheck = ((_b = testVariant.conditions) === null || _b === void 0 ? void 0 : _b.url)
                ? webExperimentUrlValidationMap[(_d = (_c = testVariant.conditions) === null || _c === void 0 ? void 0 : _c.urlMatchType) !== null && _d !== void 0 ? _d : 'icontains'](testVariant.conditions.url, location)
                : true;
            return urlCheck;
        }
        return false;
    }
    static getWindowLocation() {
        return window === null || window === void 0 ? void 0 : window.location;
    }
    static _matchUTMConditions(testVariant) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        if (isNullish(testVariant.conditions) || isNullish((_a = testVariant.conditions) === null || _a === void 0 ? void 0 : _a.utm)) {
            return true;
        }
        const campaignParams = getCampaignParams();
        if (campaignParams['utm_source']) {
            // eslint-disable-next-line compat/compat
            const utmCampaignMatched = ((_c = (_b = testVariant.conditions) === null || _b === void 0 ? void 0 : _b.utm) === null || _c === void 0 ? void 0 : _c.utm_campaign)
                ? ((_e = (_d = testVariant.conditions) === null || _d === void 0 ? void 0 : _d.utm) === null || _e === void 0 ? void 0 : _e.utm_campaign) == campaignParams['utm_campaign']
                : true;
            const utmSourceMatched = ((_g = (_f = testVariant.conditions) === null || _f === void 0 ? void 0 : _f.utm) === null || _g === void 0 ? void 0 : _g.utm_source)
                ? ((_j = (_h = testVariant.conditions) === null || _h === void 0 ? void 0 : _h.utm) === null || _j === void 0 ? void 0 : _j.utm_source) == campaignParams['utm_source']
                : true;
            const utmMediumMatched = ((_l = (_k = testVariant.conditions) === null || _k === void 0 ? void 0 : _k.utm) === null || _l === void 0 ? void 0 : _l.utm_medium)
                ? ((_o = (_m = testVariant.conditions) === null || _m === void 0 ? void 0 : _m.utm) === null || _o === void 0 ? void 0 : _o.utm_medium) == campaignParams['utm_medium']
                : true;
            const utmTermMatched = ((_q = (_p = testVariant.conditions) === null || _p === void 0 ? void 0 : _p.utm) === null || _q === void 0 ? void 0 : _q.utm_term)
                ? ((_s = (_r = testVariant.conditions) === null || _r === void 0 ? void 0 : _r.utm) === null || _s === void 0 ? void 0 : _s.utm_term) == campaignParams['utm_term']
                : true;
            return utmCampaignMatched && utmMediumMatched && utmTermMatched && utmSourceMatched;
        }
        return false;
    }
    static _logInfo(msg, ...args) {
        logger.info(`[WebExperiments] ${msg}`, args);
    }
    _applyTransforms(experiment, variant, transforms) {
        if (this._is_bot()) {
            WebExperiments._logInfo('Refusing to render web experiment since the viewer is a likely bot');
            return;
        }
        if (variant === 'control') {
            WebExperiments._logInfo('Control variants leave the page unmodified.');
            return;
        }
        transforms.forEach((transform) => {
            if (transform.selector) {
                WebExperiments._logInfo(`applying transform of variant ${variant} for experiment ${experiment} `, transform);
                // eslint-disable-next-line no-restricted-globals
                const elements = document === null || document === void 0 ? void 0 : document.querySelectorAll(transform.selector);
                elements === null || elements === void 0 ? void 0 : elements.forEach((element) => {
                    const htmlElement = element;
                    if (transform.html) {
                        htmlElement.innerHTML = transform.html;
                    }
                    if (transform.css) {
                        htmlElement.setAttribute('style', transform.css);
                    }
                });
            }
        });
    }
    _is_bot() {
        if (navigator && this._instance) {
            return isLikelyBot(navigator, this._instance.config.custom_blocked_useragents);
        }
        else {
            return undefined;
        }
    }
}
