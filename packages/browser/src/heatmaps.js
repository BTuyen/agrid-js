import RageClick from './extensions/rageclick';
import { document, window } from './utils/globals';
import { getEventTarget, getParentElement } from './autocapture-utils';
import { HEATMAPS_ENABLED_SERVER_SIDE } from './constants';
import { isNumber, isUndefined, isEmptyObject, isObject } from '@agrid/core';
import { createLogger } from './utils/logger';
import { isElementInToolbar, isElementNode, isTag } from './utils/element-utils';
import { DeadClicksAutocapture, isDeadClicksEnabledForHeatmaps } from './extensions/dead-clicks-autocapture';
import { includes } from '@agrid/core';
import { addEventListener, extendArray } from './utils';
import { maskQueryParams } from './utils/request-utils';
import { PERSONAL_DATA_CAMPAIGN_PARAMS, MASKED } from './utils/event-utils';
const DEFAULT_FLUSH_INTERVAL = 5000;
const logger = createLogger('[Heatmaps]');
function elementOrParentPositionMatches(el, matches, breakOnElement) {
    let curEl = el;
    while (curEl && isElementNode(curEl) && !isTag(curEl, 'body')) {
        if (curEl === breakOnElement) {
            return false;
        }
        if (includes(matches, window === null || window === void 0 ? void 0 : window.getComputedStyle(curEl).position)) {
            return true;
        }
        curEl = getParentElement(curEl);
    }
    return false;
}
function isValidMouseEvent(e) {
    return isObject(e) && 'clientX' in e && 'clientY' in e && isNumber(e.clientX) && isNumber(e.clientY);
}
function shouldPoll(document) {
    return (document === null || document === void 0 ? void 0 : document.visibilityState) === 'visible';
}
export class Heatmaps {
    constructor(instance) {
        var _a;
        this.rageclicks = new RageClick();
        this._enabledServerSide = false;
        this._initialized = false;
        this._flushInterval = null;
        this.instance = instance;
        this._enabledServerSide = !!((_a = this.instance.persistence) === null || _a === void 0 ? void 0 : _a.props[HEATMAPS_ENABLED_SERVER_SIDE]);
    }
    get flushIntervalMilliseconds() {
        let flushInterval = DEFAULT_FLUSH_INTERVAL;
        if (isObject(this.instance.config.capture_heatmaps) &&
            this.instance.config.capture_heatmaps.flush_interval_milliseconds) {
            flushInterval = this.instance.config.capture_heatmaps.flush_interval_milliseconds;
        }
        return flushInterval;
    }
    get isEnabled() {
        if (!isUndefined(this.instance.config.capture_heatmaps)) {
            return this.instance.config.capture_heatmaps !== false;
        }
        if (!isUndefined(this.instance.config.enable_heatmaps)) {
            return this.instance.config.enable_heatmaps;
        }
        return this._enabledServerSide;
    }
    startIfEnabled() {
        var _a;
        if (this.isEnabled) {
            // nested if here since we only want to run the else
            // if this.enabled === false
            // not if this method is called more than once
            if (this._initialized) {
                return;
            }
            logger.info('starting...');
            this._setupListeners();
            this._onVisibilityChange();
        }
        else {
            clearInterval((_a = this._flushInterval) !== null && _a !== void 0 ? _a : undefined);
            this._removeListeners();
            this.getAndClearBuffer();
        }
    }
    onRemoteConfig(response) {
        const optIn = !!response['heatmaps'];
        if (this.instance.persistence) {
            this.instance.persistence.register({
                [HEATMAPS_ENABLED_SERVER_SIDE]: optIn,
            });
        }
        // store this in-memory in case persistence is disabled
        this._enabledServerSide = optIn;
        this.startIfEnabled();
    }
    getAndClearBuffer() {
        const buffer = this._buffer;
        this._buffer = undefined;
        return buffer;
    }
    _onDeadClick(click) {
        this._onClick(click.originalEvent, 'deadclick');
    }
    _onVisibilityChange() {
        // always clear the interval just in case
        if (this._flushInterval) {
            clearInterval(this._flushInterval);
        }
        this._flushInterval = shouldPoll(document)
            ? setInterval(this._flush.bind(this), this.flushIntervalMilliseconds)
            : null;
    }
    _setupListeners() {
        if (!window || !document) {
            return;
        }
        this._flushHandler = this._flush.bind(this);
        addEventListener(window, 'beforeunload', this._flushHandler);
        this._onClickHandler = (e) => this._onClick((e || (window === null || window === void 0 ? void 0 : window.event)));
        addEventListener(document, 'click', this._onClickHandler, { capture: true });
        this._onMouseMoveHandler = (e) => this._onMouseMove((e || (window === null || window === void 0 ? void 0 : window.event)));
        addEventListener(document, 'mousemove', this._onMouseMoveHandler, { capture: true });
        this._deadClicksCapture = new DeadClicksAutocapture(this.instance, isDeadClicksEnabledForHeatmaps, this._onDeadClick.bind(this));
        this._deadClicksCapture.startIfEnabled();
        this._onVisibilityChange_handler = this._onVisibilityChange.bind(this);
        addEventListener(document, 'visibilitychange', this._onVisibilityChange_handler);
        this._initialized = true;
    }
    _removeListeners() {
        var _a;
        if (!window || !document) {
            return;
        }
        if (this._flushHandler) {
            window.removeEventListener('beforeunload', this._flushHandler);
        }
        if (this._onClickHandler) {
            document.removeEventListener('click', this._onClickHandler, { capture: true });
        }
        if (this._onMouseMoveHandler) {
            document.removeEventListener('mousemove', this._onMouseMoveHandler, { capture: true });
        }
        if (this._onVisibilityChange_handler) {
            document.removeEventListener('visibilitychange', this._onVisibilityChange_handler);
        }
        clearTimeout(this._mouseMoveTimeout);
        (_a = this._deadClicksCapture) === null || _a === void 0 ? void 0 : _a.stop();
        this._initialized = false;
    }
    _getProperties(e, type) {
        // We need to know if the target element is fixed or not
        // If fixed then we won't account for scrolling
        // If not then we will account for scrolling
        const scrollY = this.instance.scrollManager.scrollY();
        const scrollX = this.instance.scrollManager.scrollX();
        const scrollElement = this.instance.scrollManager.scrollElement();
        const isFixedOrSticky = elementOrParentPositionMatches(getEventTarget(e), ['fixed', 'sticky'], scrollElement);
        return {
            x: e.clientX + (isFixedOrSticky ? 0 : scrollX),
            y: e.clientY + (isFixedOrSticky ? 0 : scrollY),
            target_fixed: isFixedOrSticky,
            type,
        };
    }
    _onClick(e, type = 'click') {
        var _a;
        if (isElementInToolbar(e.target) || !isValidMouseEvent(e)) {
            return;
        }
        const properties = this._getProperties(e, type);
        if ((_a = this.rageclicks) === null || _a === void 0 ? void 0 : _a.isRageClick(e.clientX, e.clientY, new Date().getTime())) {
            this._capture({
                ...properties,
                type: 'rageclick',
            });
        }
        this._capture(properties);
    }
    _onMouseMove(e) {
        if (isElementInToolbar(e.target) || !isValidMouseEvent(e)) {
            return;
        }
        clearTimeout(this._mouseMoveTimeout);
        this._mouseMoveTimeout = setTimeout(() => {
            this._capture(this._getProperties(e, 'mousemove'));
        }, 500);
    }
    _capture(properties) {
        if (!window) {
            return;
        }
        const href = window.location.href;
        // mask url query params
        const maskPersonalDataProperties = this.instance.config.mask_personal_data_properties;
        const customPersonalDataProperties = this.instance.config.custom_personal_data_properties;
        const paramsToMask = maskPersonalDataProperties
            ? extendArray([], PERSONAL_DATA_CAMPAIGN_PARAMS, customPersonalDataProperties || [])
            : [];
        const url = maskQueryParams(href, paramsToMask, MASKED);
        this._buffer = this._buffer || {};
        if (!this._buffer[url]) {
            this._buffer[url] = [];
        }
        this._buffer[url].push(properties);
    }
    _flush() {
        if (!this._buffer || isEmptyObject(this._buffer)) {
            return;
        }
        this.instance.capture('$$heatmap', {
            $heatmap_data: this.getAndClearBuffer(),
        });
    }
}
