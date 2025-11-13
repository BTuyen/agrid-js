import { SimpleEventEmitter } from '../../utils/simple-event-emitter';
import { isUndefined } from '@agrid/core';
import { window } from '../../utils/globals';
import { isMatchingRegex } from '../../utils/regex-utils';
export class ActionMatcher {
    constructor(instance) {
        this._debugEventEmitter = new SimpleEventEmitter();
        this._checkStep = (event, step) => {
            return (this._checkStepEvent(event, step) && this._checkStepUrl(event, step) && this._checkStepElement(event, step));
        };
        this._checkStepEvent = (event, step) => {
            // CHECK CONDITIONS, OTHERWISE SKIPPED
            if ((step === null || step === void 0 ? void 0 : step.event) && (event === null || event === void 0 ? void 0 : event.event) !== (step === null || step === void 0 ? void 0 : step.event)) {
                return false; // EVENT NAME IS A MISMATCH
            }
            return true;
        };
        this._instance = instance;
        this._actionEvents = new Set();
        this._actionRegistry = new Set();
    }
    init() {
        var _a, _b;
        if (!isUndefined((_a = this._instance) === null || _a === void 0 ? void 0 : _a._addCaptureHook)) {
            const matchEventToAction = (eventName, eventPayload) => {
                this.on(eventName, eventPayload);
            };
            (_b = this._instance) === null || _b === void 0 ? void 0 : _b._addCaptureHook(matchEventToAction);
        }
    }
    register(actions) {
        var _a, _b, _c;
        if (isUndefined((_a = this._instance) === null || _a === void 0 ? void 0 : _a._addCaptureHook)) {
            return;
        }
        actions.forEach((action) => {
            var _a, _b;
            (_a = this._actionRegistry) === null || _a === void 0 ? void 0 : _a.add(action);
            (_b = action.steps) === null || _b === void 0 ? void 0 : _b.forEach((step) => {
                var _a;
                (_a = this._actionEvents) === null || _a === void 0 ? void 0 : _a.add((step === null || step === void 0 ? void 0 : step.event) || '');
            });
        });
        if ((_b = this._instance) === null || _b === void 0 ? void 0 : _b.autocapture) {
            const selectorsToWatch = new Set();
            actions.forEach((action) => {
                var _a;
                (_a = action.steps) === null || _a === void 0 ? void 0 : _a.forEach((step) => {
                    if (step === null || step === void 0 ? void 0 : step.selector) {
                        selectorsToWatch.add(step === null || step === void 0 ? void 0 : step.selector);
                    }
                });
            });
            (_c = this._instance) === null || _c === void 0 ? void 0 : _c.autocapture.setElementSelectors(selectorsToWatch);
        }
    }
    on(eventName, eventPayload) {
        var _a;
        if (eventPayload == null || eventName.length == 0) {
            return;
        }
        if (!this._actionEvents.has(eventName) && !this._actionEvents.has(eventPayload === null || eventPayload === void 0 ? void 0 : eventPayload.event)) {
            return;
        }
        if (this._actionRegistry && ((_a = this._actionRegistry) === null || _a === void 0 ? void 0 : _a.size) > 0) {
            this._actionRegistry.forEach((action) => {
                if (this._checkAction(eventPayload, action)) {
                    this._debugEventEmitter.emit('actionCaptured', action.name);
                }
            });
        }
    }
    _addActionHook(callback) {
        this.onAction('actionCaptured', (data) => callback(data));
    }
    _checkAction(event, action) {
        if ((action === null || action === void 0 ? void 0 : action.steps) == null) {
            return false;
        }
        for (const step of action.steps) {
            if (this._checkStep(event, step)) {
                return true;
            }
        }
        return false;
    }
    onAction(event, cb) {
        return this._debugEventEmitter.on(event, cb);
    }
    _checkStepUrl(event, step) {
        var _a;
        // CHECK CONDITIONS, OTHERWISE SKIPPED
        if (step === null || step === void 0 ? void 0 : step.url) {
            const eventUrl = (_a = event === null || event === void 0 ? void 0 : event.properties) === null || _a === void 0 ? void 0 : _a.$current_url;
            if (!eventUrl || typeof eventUrl !== 'string') {
                return false; // URL IS UNKNOWN
            }
            if (!ActionMatcher._matchString(eventUrl, step === null || step === void 0 ? void 0 : step.url, (step === null || step === void 0 ? void 0 : step.url_matching) || 'contains')) {
                return false; // URL IS A MISMATCH
            }
        }
        return true;
    }
    static _matchString(url, pattern, matching) {
        switch (matching) {
            case 'regex':
                return !!window && isMatchingRegex(url, pattern);
            case 'exact':
                return pattern === url;
            case 'contains':
                // Simulating SQL LIKE behavior (_ = any single character, % = any zero or more characters)
                // eslint-disable-next-line no-case-declarations
                const adjustedRegExpStringPattern = ActionMatcher._escapeStringRegexp(pattern)
                    .replace(/_/g, '.')
                    .replace(/%/g, '.*');
                return isMatchingRegex(url, adjustedRegExpStringPattern);
            default:
                return false;
        }
    }
    static _escapeStringRegexp(pattern) {
        // Escape characters with special meaning either inside or outside character sets.
        // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
        return pattern.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
    }
    _checkStepElement(event, step) {
        var _a;
        // CHECK CONDITIONS, OTHERWISE SKIPPED
        if ((step === null || step === void 0 ? void 0 : step.href) || (step === null || step === void 0 ? void 0 : step.tag_name) || (step === null || step === void 0 ? void 0 : step.text)) {
            const elements = this._getElementsList(event);
            if (!elements.some((element) => {
                if ((step === null || step === void 0 ? void 0 : step.href) &&
                    !ActionMatcher._matchString(element.href || '', step === null || step === void 0 ? void 0 : step.href, (step === null || step === void 0 ? void 0 : step.href_matching) || 'exact')) {
                    return false; // ELEMENT HREF IS A MISMATCH
                }
                if ((step === null || step === void 0 ? void 0 : step.tag_name) && element.tag_name !== (step === null || step === void 0 ? void 0 : step.tag_name)) {
                    return false; // ELEMENT TAG NAME IS A MISMATCH
                }
                if ((step === null || step === void 0 ? void 0 : step.text) &&
                    !(ActionMatcher._matchString(element.text || '', step === null || step === void 0 ? void 0 : step.text, (step === null || step === void 0 ? void 0 : step.text_matching) || 'exact') ||
                        ActionMatcher._matchString(element.$el_text || '', step === null || step === void 0 ? void 0 : step.text, (step === null || step === void 0 ? void 0 : step.text_matching) || 'exact'))) {
                    return false; // ELEMENT TEXT IS A MISMATCH
                }
                return true;
            })) {
                // AT LEAST ONE ELEMENT MUST BE A SUBMATCH
                return false;
            }
        }
        if (step === null || step === void 0 ? void 0 : step.selector) {
            const elementSelectors = (_a = event === null || event === void 0 ? void 0 : event.properties) === null || _a === void 0 ? void 0 : _a.$element_selectors;
            if (!elementSelectors) {
                return false; // SELECTOR IS A MISMATCH
            }
            if (!elementSelectors.includes(step === null || step === void 0 ? void 0 : step.selector)) {
                return false; // SELECTOR IS A MISMATCH
            }
        }
        return true;
    }
    _getElementsList(event) {
        if ((event === null || event === void 0 ? void 0 : event.properties.$elements) == null) {
            return [];
        }
        return event === null || event === void 0 ? void 0 : event.properties.$elements;
    }
}
