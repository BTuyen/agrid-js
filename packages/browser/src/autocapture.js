import { addEventListener, each, extend } from './utils';
import { autocaptureCompatibleElements, getClassNames, getDirectAndNestedSpanText, getElementsChainString, getEventTarget, getSafeText, isAngularStyleAttr, isSensitiveElement, makeSafeText, shouldCaptureDomEvent, shouldCaptureElement, shouldCaptureRageclick, shouldCaptureValue, splitClassString, } from './autocapture-utils';
import RageClick from './extensions/rageclick';
import { COPY_AUTOCAPTURE_EVENT } from './types';
import { AUTOCAPTURE_DISABLED_SERVER_SIDE } from './constants';
import { isBoolean, isFunction, isNull, isObject } from '@agrid/core';
import { createLogger } from './utils/logger';
import { document, window } from './utils/globals';
import { convertToURL } from './utils/request-utils';
import { isDocumentFragment, isElementNode, isTag, isTextNode } from './utils/element-utils';
import { includes } from '@agrid/core';
const logger = createLogger('[AutoCapture]');
function limitText(length, text) {
    if (text.length > length) {
        return text.slice(0, length) + '...';
    }
    return text;
}
export function getAugmentPropertiesFromElement(elem) {
    const shouldCaptureEl = shouldCaptureElement(elem);
    if (!shouldCaptureEl) {
        return {};
    }
    const props = {};
    each(elem.attributes, function (attr) {
        if (attr.name && attr.name.indexOf('data-ph-capture-attribute') === 0) {
            const propertyKey = attr.name.replace('data-ph-capture-attribute-', '');
            const propertyValue = attr.value;
            if (propertyKey && propertyValue && shouldCaptureValue(propertyValue)) {
                props[propertyKey] = propertyValue;
            }
        }
    });
    return props;
}
export function previousElementSibling(el) {
    if (el.previousElementSibling) {
        return el.previousElementSibling;
    }
    let _el = el;
    do {
        _el = _el.previousSibling; // resolves to ChildNode->Node, which is Element's parent class
    } while (_el && !isElementNode(_el));
    return _el;
}
export function getDefaultProperties(eventType) {
    return {
        $event_type: eventType,
        $ce_version: 1,
    };
}
export function getPropertiesFromElement(elem, maskAllAttributes, maskText, elementAttributeIgnorelist) {
    const tag_name = elem.tagName.toLowerCase();
    const props = {
        tag_name: tag_name,
    };
    if (autocaptureCompatibleElements.indexOf(tag_name) > -1 && !maskText) {
        if (tag_name.toLowerCase() === 'a' || tag_name.toLowerCase() === 'button') {
            props['$el_text'] = limitText(1024, getDirectAndNestedSpanText(elem));
        }
        else {
            props['$el_text'] = limitText(1024, getSafeText(elem));
        }
    }
    const classes = getClassNames(elem);
    if (classes.length > 0)
        props['classes'] = classes.filter(function (c) {
            return c !== '';
        });
    // capture the deny list here because this not-a-class class makes it tricky to use this.config in the function below
    each(elem.attributes, function (attr) {
        // Only capture attributes we know are safe
        if (isSensitiveElement(elem) && ['name', 'id', 'class', 'aria-label'].indexOf(attr.name) === -1)
            return;
        if (elementAttributeIgnorelist === null || elementAttributeIgnorelist === void 0 ? void 0 : elementAttributeIgnorelist.includes(attr.name))
            return;
        if (!maskAllAttributes && shouldCaptureValue(attr.value) && !isAngularStyleAttr(attr.name)) {
            let value = attr.value;
            if (attr.name === 'class') {
                // html attributes can _technically_ contain linebreaks,
                // but we're very intolerant of them in the class string,
                // so we strip them.
                value = splitClassString(value).join(' ');
            }
            props['attr__' + attr.name] = limitText(1024, value);
        }
    });
    let nthChild = 1;
    let nthOfType = 1;
    let currentElem = elem;
    while ((currentElem = previousElementSibling(currentElem))) {
        // eslint-disable-line no-cond-assign
        nthChild++;
        if (currentElem.tagName === elem.tagName) {
            nthOfType++;
        }
    }
    props['nth_child'] = nthChild;
    props['nth_of_type'] = nthOfType;
    return props;
}
export function autocapturePropertiesForElement(target, { e, maskAllElementAttributes, maskAllText, elementAttributeIgnoreList, elementsChainAsString, }) {
    var _a, _b, _c, _d;
    const targetElementList = [target];
    let curEl = target;
    while (curEl.parentNode && !isTag(curEl, 'body')) {
        if (isDocumentFragment(curEl.parentNode)) {
            targetElementList.push(curEl.parentNode.host);
            curEl = curEl.parentNode.host;
            continue;
        }
        targetElementList.push(curEl.parentNode);
        curEl = curEl.parentNode;
    }
    const elementsJson = [];
    const autocaptureAugmentProperties = {};
    let href = false;
    let explicitNoCapture = false;
    each(targetElementList, (el) => {
        const shouldCaptureEl = shouldCaptureElement(el);
        // if the element or a parent element is an anchor tag
        // include the href as a property
        if (el.tagName.toLowerCase() === 'a') {
            href = el.getAttribute('href');
            href = shouldCaptureEl && href && shouldCaptureValue(href) && href;
        }
        // allow users to programmatically prevent capturing of elements by adding class 'ph-no-capture'
        const classes = getClassNames(el);
        if (includes(classes, 'ph-no-capture')) {
            explicitNoCapture = true;
        }
        elementsJson.push(getPropertiesFromElement(el, maskAllElementAttributes, maskAllText, elementAttributeIgnoreList));
        const augmentProperties = getAugmentPropertiesFromElement(el);
        extend(autocaptureAugmentProperties, augmentProperties);
    });
    if (explicitNoCapture) {
        return { props: {}, explicitNoCapture };
    }
    if (!maskAllText) {
        // if the element is a button or anchor tag get the span text from any
        // children and include it as/with the text property on the parent element
        if (target.tagName.toLowerCase() === 'a' || target.tagName.toLowerCase() === 'button') {
            elementsJson[0]['$el_text'] = getDirectAndNestedSpanText(target);
        }
        else {
            elementsJson[0]['$el_text'] = getSafeText(target);
        }
    }
    let externalHref;
    if (href) {
        elementsJson[0]['attr__href'] = href;
        const hrefHost = (_a = convertToURL(href)) === null || _a === void 0 ? void 0 : _a.host;
        const locationHost = (_b = window === null || window === void 0 ? void 0 : window.location) === null || _b === void 0 ? void 0 : _b.host;
        if (hrefHost && locationHost && hrefHost !== locationHost) {
            externalHref = href;
        }
    }
    const props = extend(getDefaultProperties(e.type), 
    // Sending "$elements" is deprecated. Only one client on US cloud uses this.
    !elementsChainAsString ? { $elements: elementsJson } : {}, 
    // Always send $elements_chain, as it's needed downstream in site app filtering
    { $elements_chain: getElementsChainString(elementsJson) }, ((_c = elementsJson[0]) === null || _c === void 0 ? void 0 : _c['$el_text']) ? { $el_text: (_d = elementsJson[0]) === null || _d === void 0 ? void 0 : _d['$el_text'] } : {}, externalHref && e.type === 'click' ? { $external_click_url: externalHref } : {}, autocaptureAugmentProperties);
    return { props };
}
export class Autocapture {
    constructor(instance) {
        this._initialized = false;
        this._isDisabledServerSide = null;
        this.rageclicks = new RageClick();
        this._elementsChainAsString = false;
        this.instance = instance;
        this._elementSelectors = null;
    }
    get _config() {
        var _a, _b;
        const config = isObject(this.instance.config.autocapture) ? this.instance.config.autocapture : {};
        // precompile the regex
        config.url_allowlist = (_a = config.url_allowlist) === null || _a === void 0 ? void 0 : _a.map((url) => new RegExp(url));
        config.url_ignorelist = (_b = config.url_ignorelist) === null || _b === void 0 ? void 0 : _b.map((url) => new RegExp(url));
        return config;
    }
    _addDomEventHandlers() {
        if (!this.isBrowserSupported()) {
            logger.info('Disabling Automatic Event Collection because this browser is not supported');
            return;
        }
        if (!window || !document) {
            return;
        }
        const handler = (e) => {
            e = e || (window === null || window === void 0 ? void 0 : window.event);
            try {
                this._captureEvent(e);
            }
            catch (error) {
                logger.error('Failed to capture event', error);
            }
        };
        addEventListener(document, 'submit', handler, { capture: true });
        addEventListener(document, 'change', handler, { capture: true });
        addEventListener(document, 'click', handler, { capture: true });
        if (this._config.capture_copied_text) {
            const copiedTextHandler = (e) => {
                e = e || (window === null || window === void 0 ? void 0 : window.event);
                this._captureEvent(e, COPY_AUTOCAPTURE_EVENT);
            };
            addEventListener(document, 'copy', copiedTextHandler, { capture: true });
            addEventListener(document, 'cut', copiedTextHandler, { capture: true });
        }
    }
    startIfEnabled() {
        if (this.isEnabled && !this._initialized) {
            this._addDomEventHandlers();
            this._initialized = true;
        }
    }
    onRemoteConfig(response) {
        if (response.elementsChainAsString) {
            this._elementsChainAsString = response.elementsChainAsString;
        }
        if (this.instance.persistence) {
            this.instance.persistence.register({
                [AUTOCAPTURE_DISABLED_SERVER_SIDE]: !!response['autocapture_opt_out'],
            });
        }
        // store this in-memory in case persistence is disabled
        this._isDisabledServerSide = !!response['autocapture_opt_out'];
        this.startIfEnabled();
    }
    setElementSelectors(selectors) {
        this._elementSelectors = selectors;
    }
    getElementSelectors(element) {
        var _a;
        const elementSelectors = [];
        (_a = this._elementSelectors) === null || _a === void 0 ? void 0 : _a.forEach((selector) => {
            const matchedElements = document === null || document === void 0 ? void 0 : document.querySelectorAll(selector);
            matchedElements === null || matchedElements === void 0 ? void 0 : matchedElements.forEach((matchedElement) => {
                if (element === matchedElement) {
                    elementSelectors.push(selector);
                }
            });
        });
        return elementSelectors;
    }
    get isEnabled() {
        var _a, _b;
        const persistedServerDisabled = (_a = this.instance.persistence) === null || _a === void 0 ? void 0 : _a.props[AUTOCAPTURE_DISABLED_SERVER_SIDE];
        const memoryDisabled = this._isDisabledServerSide;
        if (isNull(memoryDisabled) && !isBoolean(persistedServerDisabled) && !this.instance._shouldDisableFlags()) {
            // We only enable if we know that the server has not disabled it (unless /flags is disabled)
            return false;
        }
        const disabledServer = (_b = this._isDisabledServerSide) !== null && _b !== void 0 ? _b : !!persistedServerDisabled;
        const disabledClient = !this.instance.config.autocapture;
        return !disabledClient && !disabledServer;
    }
    _captureEvent(e, eventName = '$autocapture') {
        var _a, _b;
        if (!this.isEnabled) {
            return;
        }
        /*** Don't mess with this code without running IE8 tests on it ***/
        let target = getEventTarget(e);
        if (isTextNode(target)) {
            // defeat Safari bug (see: http://www.quirksmode.org/js/events_properties.html)
            target = (target.parentNode || null);
        }
        if (eventName === '$autocapture' && e.type === 'click' && e instanceof MouseEvent) {
            if (!!this.instance.config.rageclick &&
                ((_a = this.rageclicks) === null || _a === void 0 ? void 0 : _a.isRageClick(e.clientX, e.clientY, new Date().getTime()))) {
                if (shouldCaptureRageclick(target, this.instance.config.rageclick)) {
                    this._captureEvent(e, '$rageclick');
                }
            }
        }
        const isCopyAutocapture = eventName === COPY_AUTOCAPTURE_EVENT;
        if (target &&
            shouldCaptureDomEvent(target, e, this._config, 
            // mostly this method cares about the target element, but in the case of copy events,
            // we want some of the work this check does without insisting on the target element's type
            isCopyAutocapture, 
            // we also don't want to restrict copy checks to clicks,
            // so we pass that knowledge in here, rather than add the logic inside the check
            isCopyAutocapture ? ['copy', 'cut'] : undefined)) {
            const { props, explicitNoCapture } = autocapturePropertiesForElement(target, {
                e,
                maskAllElementAttributes: this.instance.config.mask_all_element_attributes,
                maskAllText: this.instance.config.mask_all_text,
                elementAttributeIgnoreList: this._config.element_attribute_ignorelist,
                elementsChainAsString: this._elementsChainAsString,
            });
            if (explicitNoCapture) {
                return false;
            }
            const elementSelectors = this.getElementSelectors(target);
            if (elementSelectors && elementSelectors.length > 0) {
                props['$element_selectors'] = elementSelectors;
            }
            if (eventName === COPY_AUTOCAPTURE_EVENT) {
                // you can't read the data from the clipboard event,
                // but you can guess that you can read it from the window's current selection
                const selectedContent = makeSafeText((_b = window === null || window === void 0 ? void 0 : window.getSelection()) === null || _b === void 0 ? void 0 : _b.toString());
                const clipType = e.type || 'clipboard';
                if (!selectedContent) {
                    return false;
                }
                props['$selected_content'] = selectedContent;
                props['$copy_type'] = clipType;
            }
            this.instance.capture(eventName, props);
            return true;
        }
    }
    isBrowserSupported() {
        return isFunction(document === null || document === void 0 ? void 0 : document.querySelectorAll);
    }
}
