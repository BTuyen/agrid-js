import { window } from './utils/globals';
import { addEventListener } from './utils';
import { isArray } from '@agrid/core';
// This class is responsible for tracking scroll events and maintaining the scroll context
export class ScrollManager {
    constructor(_instance) {
        this._instance = _instance;
        this._updateScrollData = () => {
            var _a, _b, _c, _d;
            if (!this._context) {
                this._context = {};
            }
            const el = this.scrollElement();
            const scrollY = this.scrollY();
            const scrollHeight = el ? Math.max(0, el.scrollHeight - el.clientHeight) : 0;
            const contentY = scrollY + ((el === null || el === void 0 ? void 0 : el.clientHeight) || 0);
            const contentHeight = (el === null || el === void 0 ? void 0 : el.scrollHeight) || 0;
            this._context.lastScrollY = Math.ceil(scrollY);
            this._context.maxScrollY = Math.max(scrollY, (_a = this._context.maxScrollY) !== null && _a !== void 0 ? _a : 0);
            this._context.maxScrollHeight = Math.max(scrollHeight, (_b = this._context.maxScrollHeight) !== null && _b !== void 0 ? _b : 0);
            this._context.lastContentY = contentY;
            this._context.maxContentY = Math.max(contentY, (_c = this._context.maxContentY) !== null && _c !== void 0 ? _c : 0);
            this._context.maxContentHeight = Math.max(contentHeight, (_d = this._context.maxContentHeight) !== null && _d !== void 0 ? _d : 0);
        };
    }
    getContext() {
        return this._context;
    }
    resetContext() {
        const ctx = this._context;
        // update the scroll properties for the new page, but wait until the next tick
        // of the event loop
        setTimeout(this._updateScrollData, 0);
        return ctx;
    }
    // `capture: true` is required to get scroll events for other scrollable elements
    // on the page, not just the window
    // see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#usecapture
    startMeasuringScrollPosition() {
        addEventListener(window, 'scroll', this._updateScrollData, { capture: true });
        addEventListener(window, 'scrollend', this._updateScrollData, { capture: true });
        addEventListener(window, 'resize', this._updateScrollData);
    }
    scrollElement() {
        if (this._instance.config.scroll_root_selector) {
            const selectors = isArray(this._instance.config.scroll_root_selector)
                ? this._instance.config.scroll_root_selector
                : [this._instance.config.scroll_root_selector];
            for (const selector of selectors) {
                const element = window === null || window === void 0 ? void 0 : window.document.querySelector(selector);
                if (element) {
                    return element;
                }
            }
            return undefined;
        }
        else {
            return window === null || window === void 0 ? void 0 : window.document.documentElement;
        }
    }
    scrollY() {
        if (this._instance.config.scroll_root_selector) {
            const element = this.scrollElement();
            return (element && element.scrollTop) || 0;
        }
        else {
            return window ? window.scrollY || window.pageYOffset || window.document.documentElement.scrollTop || 0 : 0;
        }
    }
    scrollX() {
        if (this._instance.config.scroll_root_selector) {
            const element = this.scrollElement();
            return (element && element.scrollLeft) || 0;
        }
        else {
            return window ? window.scrollX || window.pageXOffset || window.document.documentElement.scrollLeft || 0 : 0;
        }
    }
}
