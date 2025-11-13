import { createLogger } from '../../utils/logger';
const logger = createLogger('[Stylesheet Loader]');
export const prepareStylesheet = (document, innerText, posthog) => {
    var _a;
    // Forcing the existence of `document` requires this function to be called in a browser environment
    let stylesheet = document.createElement('style');
    stylesheet.innerText = innerText;
    if ((_a = posthog === null || posthog === void 0 ? void 0 : posthog.config) === null || _a === void 0 ? void 0 : _a.prepare_external_dependency_stylesheet) {
        stylesheet = posthog.config.prepare_external_dependency_stylesheet(stylesheet);
    }
    if (!stylesheet) {
        logger.error('prepare_external_dependency_stylesheet returned null');
        return null;
    }
    return stylesheet;
};
