/* Store some session-level attribution-related properties in the persistence layer
 *
 * These have the same lifespan as a session_id, meaning that if the session_id changes, these properties will be reset.
 *
 * We only store the entry URL and referrer, and derive many props (such as utm tags) from those.
 *
 * Given that the cookie is limited to 4K bytes, we don't want to store too much data, so we chose not to store device
 * properties (such as browser, OS, etc) here, as usually getting the current value of those from event properties is
 * sufficient.
 */
import { getPersonInfo, getPersonPropsFromInfo } from './utils/event-utils';
import { CLIENT_SESSION_PROPS } from './constants';
import { each, stripEmptyProperties } from './utils';
import { stripLeadingDollar } from '@agrid/core';
const generateSessionSourceParams = (posthog) => {
    return getPersonInfo(posthog === null || posthog === void 0 ? void 0 : posthog.config.mask_personal_data_properties, posthog === null || posthog === void 0 ? void 0 : posthog.config.custom_personal_data_properties);
};
export class SessionPropsManager {
    constructor(instance, sessionIdManager, persistence, sessionSourceParamGenerator) {
        this._onSessionIdCallback = (sessionId) => {
            const stored = this._getStored();
            if (stored && stored.sessionId === sessionId) {
                return;
            }
            const newProps = {
                sessionId,
                props: this._sessionSourceParamGenerator(this._instance),
            };
            this._persistence.register({ [CLIENT_SESSION_PROPS]: newProps });
        };
        this._instance = instance;
        this._sessionIdManager = sessionIdManager;
        this._persistence = persistence;
        this._sessionSourceParamGenerator = sessionSourceParamGenerator || generateSessionSourceParams;
        this._sessionIdManager.onSessionId(this._onSessionIdCallback);
    }
    _getStored() {
        return this._persistence.props[CLIENT_SESSION_PROPS];
    }
    getSetOnceProps() {
        var _a;
        const p = (_a = this._getStored()) === null || _a === void 0 ? void 0 : _a.props;
        if (!p) {
            return {};
        }
        if ('r' in p) {
            return getPersonPropsFromInfo(p);
        }
        else {
            return {
                $referring_domain: p.referringDomain,
                $pathname: p.initialPathName,
                utm_source: p.utm_source,
                utm_campaign: p.utm_campaign,
                utm_medium: p.utm_medium,
                utm_content: p.utm_content,
                utm_term: p.utm_term,
            };
        }
    }
    getSessionProps() {
        // it's the same props, but don't include null for unset properties, and add a prefix
        const p = {};
        each(stripEmptyProperties(this.getSetOnceProps()), (v, k) => {
            if (k === '$current_url') {
                // $session_entry_current_url would be a weird name, call it $session_entry_url instead
                k = 'url';
            }
            p[`$session_entry_${stripLeadingDollar(k)}`] = v;
        });
        return p;
    }
}
