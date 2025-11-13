import { SESSION_RECORDING_EVENT_TRIGGER_ACTIVATED_SESSION, SESSION_RECORDING_URL_TRIGGER_ACTIVATED_SESSION, } from '../../../constants';
import { isNullish, isBoolean, isString, isObject } from '@agrid/core';
import { window } from '../../../utils/globals';
export const DISABLED = 'disabled';
export const SAMPLED = 'sampled';
export const ACTIVE = 'active';
export const BUFFERING = 'buffering';
export const PAUSED = 'paused';
export const LAZY_LOADING = 'lazy_loading';
const TRIGGER = 'trigger';
export const TRIGGER_ACTIVATED = TRIGGER + '_activated';
export const TRIGGER_PENDING = TRIGGER + '_pending';
export const TRIGGER_DISABLED = TRIGGER + '_' + DISABLED;
/*
triggers can have one of three statuses:
 * - trigger_activated: the trigger met conditions to start recording
 * - trigger_pending: the trigger is present, but the conditions are not yet met
 * - trigger_disabled: the trigger is not present
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const triggerStatuses = [TRIGGER_ACTIVATED, TRIGGER_PENDING, TRIGGER_DISABLED];
/**
 * Session recording starts in buffering mode while waiting for "flags response".
 * Once the response is received, it might be disabled, active or sampled.
 * When "sampled" that means a sample rate is set, and the last time the session ID rotated
 * the sample rate determined this session should be sent to the server.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sessionRecordingStatuses = [DISABLED, SAMPLED, ACTIVE, BUFFERING, PAUSED, LAZY_LOADING];
function sessionRecordingUrlTriggerMatches(url, triggers) {
    return triggers.some((trigger) => {
        switch (trigger.matching) {
            case 'regex':
                return new RegExp(trigger.url).test(url);
            default:
                return false;
        }
    });
}
export class OrTriggerMatching {
    constructor(_matchers) {
        this._matchers = _matchers;
    }
    triggerStatus(sessionId) {
        const statuses = this._matchers.map((m) => m.triggerStatus(sessionId));
        if (statuses.includes(TRIGGER_ACTIVATED)) {
            return TRIGGER_ACTIVATED;
        }
        if (statuses.includes(TRIGGER_PENDING)) {
            return TRIGGER_PENDING;
        }
        return TRIGGER_DISABLED;
    }
    stop() {
        this._matchers.forEach((m) => m.stop());
    }
}
export class AndTriggerMatching {
    constructor(_matchers) {
        this._matchers = _matchers;
    }
    triggerStatus(sessionId) {
        const statuses = new Set();
        for (const matcher of this._matchers) {
            statuses.add(matcher.triggerStatus(sessionId));
        }
        // trigger_disabled means no config
        statuses.delete(TRIGGER_DISABLED);
        switch (statuses.size) {
            case 0:
                return TRIGGER_DISABLED;
            case 1:
                return Array.from(statuses)[0];
            default:
                return TRIGGER_PENDING;
        }
    }
    stop() {
        this._matchers.forEach((m) => m.stop());
    }
}
export class PendingTriggerMatching {
    triggerStatus() {
        return TRIGGER_PENDING;
    }
    stop() {
        // no-op
    }
}
const isEagerLoadedConfig = (x) => {
    return 'sessionRecording' in x;
};
export class URLTriggerMatching {
    constructor(_instance) {
        this._instance = _instance;
        this._urlTriggers = [];
        this._urlBlocklist = [];
        this.urlBlocked = false;
    }
    onConfig(config) {
        var _a, _b;
        this._urlTriggers =
            (isEagerLoadedConfig(config)
                ? isObject(config.sessionRecording)
                    ? (_a = config.sessionRecording) === null || _a === void 0 ? void 0 : _a.urlTriggers
                    : []
                : config === null || config === void 0 ? void 0 : config.urlTriggers) || [];
        this._urlBlocklist =
            (isEagerLoadedConfig(config)
                ? isObject(config.sessionRecording)
                    ? (_b = config.sessionRecording) === null || _b === void 0 ? void 0 : _b.urlBlocklist
                    : []
                : config === null || config === void 0 ? void 0 : config.urlBlocklist) || [];
    }
    /**
     * @deprecated Use onConfig instead
     */
    onRemoteConfig(response) {
        this.onConfig(response);
    }
    _urlTriggerStatus(sessionId) {
        var _a;
        if (this._urlTriggers.length === 0) {
            return TRIGGER_DISABLED;
        }
        const currentTriggerSession = (_a = this._instance) === null || _a === void 0 ? void 0 : _a.get_property(SESSION_RECORDING_URL_TRIGGER_ACTIVATED_SESSION);
        return currentTriggerSession === sessionId ? TRIGGER_ACTIVATED : TRIGGER_PENDING;
    }
    triggerStatus(sessionId) {
        const urlTriggerStatus = this._urlTriggerStatus(sessionId);
        const eitherIsActivated = urlTriggerStatus === TRIGGER_ACTIVATED;
        const eitherIsPending = urlTriggerStatus === TRIGGER_PENDING;
        const result = eitherIsActivated ? TRIGGER_ACTIVATED : eitherIsPending ? TRIGGER_PENDING : TRIGGER_DISABLED;
        this._instance.register_for_session({
            $sdk_debug_replay_url_trigger_status: result,
        });
        return result;
    }
    checkUrlTriggerConditions(onPause, onResume, onActivate) {
        if (typeof window === 'undefined' || !window.location.href) {
            return;
        }
        const url = window.location.href;
        const wasBlocked = this.urlBlocked;
        const isNowBlocked = sessionRecordingUrlTriggerMatches(url, this._urlBlocklist);
        if (wasBlocked && isNowBlocked) {
            // if the url is blocked and was already blocked, do nothing
            return;
        }
        else if (isNowBlocked && !wasBlocked) {
            onPause();
        }
        else if (!isNowBlocked && wasBlocked) {
            onResume();
        }
        if (sessionRecordingUrlTriggerMatches(url, this._urlTriggers)) {
            onActivate('url');
        }
    }
    stop() {
        // no-op
    }
}
export class LinkedFlagMatching {
    constructor(_instance) {
        this._instance = _instance;
        this.linkedFlag = null;
        this.linkedFlagSeen = false;
        this._flagListenerCleanup = () => { };
    }
    triggerStatus() {
        let result = TRIGGER_PENDING;
        if (isNullish(this.linkedFlag)) {
            result = TRIGGER_DISABLED;
        }
        if (this.linkedFlagSeen) {
            result = TRIGGER_ACTIVATED;
        }
        this._instance.register_for_session({
            $sdk_debug_replay_linked_flag_trigger_status: result,
        });
        return result;
    }
    onConfig(config, onStarted) {
        var _a;
        this.linkedFlag =
            (isEagerLoadedConfig(config)
                ? isObject(config.sessionRecording)
                    ? (_a = config.sessionRecording) === null || _a === void 0 ? void 0 : _a.linkedFlag
                    : null
                : config === null || config === void 0 ? void 0 : config.linkedFlag) || null;
        if (!isNullish(this.linkedFlag) && !this.linkedFlagSeen) {
            const linkedFlag = isString(this.linkedFlag) ? this.linkedFlag : this.linkedFlag.flag;
            const linkedVariant = isString(this.linkedFlag) ? null : this.linkedFlag.variant;
            this._flagListenerCleanup = this._instance.onFeatureFlags((_flags, variants) => {
                const flagIsPresent = isObject(variants) && linkedFlag in variants;
                let linkedFlagMatches = false;
                if (flagIsPresent) {
                    const variantForFlagKey = variants[linkedFlag];
                    if (isBoolean(variantForFlagKey)) {
                        linkedFlagMatches = variantForFlagKey === true;
                    }
                    else if (linkedVariant) {
                        linkedFlagMatches = variantForFlagKey === linkedVariant;
                    }
                    else {
                        // then this is a variant flag and we want to match any string
                        linkedFlagMatches = !!variantForFlagKey;
                    }
                }
                this.linkedFlagSeen = linkedFlagMatches;
                if (linkedFlagMatches) {
                    onStarted(linkedFlag, linkedVariant);
                }
            });
        }
    }
    /**
     * @deprecated Use onConfig instead
     */
    onRemoteConfig(response, onStarted) {
        this.onConfig(response, onStarted);
    }
    stop() {
        this._flagListenerCleanup();
    }
}
export class EventTriggerMatching {
    constructor(_instance) {
        this._instance = _instance;
        this._eventTriggers = [];
    }
    onConfig(config) {
        var _a;
        this._eventTriggers =
            (isEagerLoadedConfig(config)
                ? isObject(config.sessionRecording)
                    ? (_a = config.sessionRecording) === null || _a === void 0 ? void 0 : _a.eventTriggers
                    : []
                : config === null || config === void 0 ? void 0 : config.eventTriggers) || [];
    }
    /**
     * @deprecated Use onConfig instead
     */
    onRemoteConfig(response) {
        this.onConfig(response);
    }
    _eventTriggerStatus(sessionId) {
        var _a;
        if (this._eventTriggers.length === 0) {
            return TRIGGER_DISABLED;
        }
        const currentTriggerSession = (_a = this._instance) === null || _a === void 0 ? void 0 : _a.get_property(SESSION_RECORDING_EVENT_TRIGGER_ACTIVATED_SESSION);
        return currentTriggerSession === sessionId ? TRIGGER_ACTIVATED : TRIGGER_PENDING;
    }
    triggerStatus(sessionId) {
        const eventTriggerStatus = this._eventTriggerStatus(sessionId);
        const result = eventTriggerStatus === TRIGGER_ACTIVATED
            ? TRIGGER_ACTIVATED
            : eventTriggerStatus === TRIGGER_PENDING
                ? TRIGGER_PENDING
                : TRIGGER_DISABLED;
        this._instance.register_for_session({
            $sdk_debug_replay_event_trigger_status: result,
        });
        return result;
    }
    stop() {
        // no-op
    }
}
// we need a no-op matcher before we can lazy-load the other matches, since all matchers wait on remote config anyway
export function nullMatchSessionRecordingStatus(triggersStatus) {
    if (!triggersStatus.isRecordingEnabled) {
        return DISABLED;
    }
    return BUFFERING;
}
export function anyMatchSessionRecordingStatus(triggersStatus) {
    if (!triggersStatus.receivedFlags) {
        return BUFFERING;
    }
    if (!triggersStatus.isRecordingEnabled) {
        return DISABLED;
    }
    if (triggersStatus.urlTriggerMatching.urlBlocked) {
        return PAUSED;
    }
    const sampledActive = triggersStatus.isSampled === true;
    const triggerMatches = new OrTriggerMatching([
        triggersStatus.eventTriggerMatching,
        triggersStatus.urlTriggerMatching,
        triggersStatus.linkedFlagMatching,
    ]).triggerStatus(triggersStatus.sessionId);
    if (sampledActive) {
        return SAMPLED;
    }
    if (triggerMatches === TRIGGER_ACTIVATED) {
        return ACTIVE;
    }
    if (triggerMatches === TRIGGER_PENDING) {
        // even if sampled active is false, we should still be buffering
        // since a pending trigger could override it
        return BUFFERING;
    }
    // if sampling is set and the session is already decided to not be sampled
    // then we should never be active
    if (triggersStatus.isSampled === false) {
        return DISABLED;
    }
    return ACTIVE;
}
export function allMatchSessionRecordingStatus(triggersStatus) {
    if (!triggersStatus.receivedFlags) {
        return BUFFERING;
    }
    if (!triggersStatus.isRecordingEnabled) {
        return DISABLED;
    }
    if (triggersStatus.urlTriggerMatching.urlBlocked) {
        return PAUSED;
    }
    const andTriggerMatch = new AndTriggerMatching([
        triggersStatus.eventTriggerMatching,
        triggersStatus.urlTriggerMatching,
        triggersStatus.linkedFlagMatching,
    ]);
    const currentTriggerStatus = andTriggerMatch.triggerStatus(triggersStatus.sessionId);
    const hasTriggersConfigured = currentTriggerStatus !== TRIGGER_DISABLED;
    const hasSamplingConfigured = isBoolean(triggersStatus.isSampled);
    if (hasTriggersConfigured && currentTriggerStatus === TRIGGER_PENDING) {
        return BUFFERING;
    }
    if (hasTriggersConfigured && currentTriggerStatus === TRIGGER_DISABLED) {
        return DISABLED;
    }
    // sampling can't ever cause buffering, it's always determined right away or not configured
    if (hasSamplingConfigured && !triggersStatus.isSampled) {
        return DISABLED;
    }
    // If sampling is configured and set to true, return sampled
    if (triggersStatus.isSampled === true) {
        return SAMPLED;
    }
    return ACTIVE;
}
