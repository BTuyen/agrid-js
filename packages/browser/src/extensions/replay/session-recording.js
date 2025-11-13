import { SESSION_RECORDING_IS_SAMPLED, SESSION_RECORDING_OVERRIDE_SAMPLING, SESSION_RECORDING_OVERRIDE_LINKED_FLAG, SESSION_RECORDING_OVERRIDE_EVENT_TRIGGER, SESSION_RECORDING_OVERRIDE_URL_TRIGGER, SESSION_RECORDING_REMOTE_CONFIG, } from '../../constants';
import { isNullish, isUndefined } from '@agrid/core';
import { createLogger } from '../../utils/logger';
import { assignableWindow, window, } from '../../utils/globals';
import { DISABLED, LAZY_LOADING } from './external/triggerMatching';
const LOGGER_PREFIX = '[SessionRecording]';
const logger = createLogger(LOGGER_PREFIX);
export class SessionRecording {
    get started() {
        var _a;
        return !!((_a = this._lazyLoadedSessionRecording) === null || _a === void 0 ? void 0 : _a.isStarted);
    }
    /**
     * defaults to buffering mode until a flags response is received
     * once a flags response is received status can be disabled, active or sampled
     */
    get status() {
        if (this._lazyLoadedSessionRecording) {
            return this._lazyLoadedSessionRecording.status;
        }
        if (this._receivedFlags && !this._isRecordingEnabled) {
            return DISABLED;
        }
        return LAZY_LOADING;
    }
    constructor(_instance) {
        this._instance = _instance;
        this._forceAllowLocalhostNetworkCapture = false;
        this._receivedFlags = false;
        this._persistFlagsOnSessionListener = undefined;
        if (!this._instance.sessionManager) {
            logger.error('started without valid sessionManager');
            throw new Error(LOGGER_PREFIX + ' started without valid sessionManager. This is a bug.');
        }
        if (this._instance.config.cookieless_mode === 'always') {
            throw new Error(LOGGER_PREFIX + ' cannot be used with cookieless_mode="always"');
        }
    }
    get _isRecordingEnabled() {
        var _a;
        const enabled_server_side = !!((_a = this._instance.get_property(SESSION_RECORDING_REMOTE_CONFIG)) === null || _a === void 0 ? void 0 : _a.enabled);
        const enabled_client_side = !this._instance.config.disable_session_recording;
        const isDisabled = this._instance.config.disable_session_recording || this._instance.consent.isOptedOut();
        return window && enabled_server_side && enabled_client_side && !isDisabled;
    }
    startIfEnabledOrStop(startReason) {
        var _a;
        if (this._isRecordingEnabled && ((_a = this._lazyLoadedSessionRecording) === null || _a === void 0 ? void 0 : _a.isStarted)) {
            return;
        }
        // According to the rrweb docs, rrweb is not supported on IE11 and below:
        // "rrweb does not support IE11 and below because it uses the MutationObserver API, which was supported by these browsers."
        // https://github.com/rrweb-io/rrweb/blob/master/guide.md#compatibility-note
        //
        // However, MutationObserver does exist on IE11, it just doesn't work well and does not detect all changes.
        // Instead, when we load "recorder.js", the first JS error is about "Object.assign" and "Array.from" being undefined.
        // Thus instead of MutationObserver, we look for this function and block recording if it's undefined.
        const canRunReplay = !isUndefined(Object.assign) && !isUndefined(Array.from);
        if (this._isRecordingEnabled && canRunReplay) {
            this._lazyLoadAndStart(startReason);
            logger.info('starting');
        }
        else {
            this.stopRecording();
        }
    }
    /**
     * session recording waits until it receives remote config before loading the script
     * this is to ensure we can control the script name remotely
     * and because we wait until we have local and remote config to determine if we should start at all
     * if start is called and there is no remote config then we wait until there is
     */
    _lazyLoadAndStart(startReason) {
        var _a, _b, _c, _d, _e;
        // by checking `_isRecordingEnabled` here we know that
        // we have stored remote config and client config to read
        // replay waits for both local and remote config before starting
        if (!this._isRecordingEnabled) {
            return;
        }
        // If recorder.js is already loaded (if array.full.js snippet is used or posthog-js/dist/recorder is
        // imported), don't load the script. Otherwise, remotely import recorder.js from cdn since it hasn't been loaded.
        if (!((_b = (_a = assignableWindow === null || assignableWindow === void 0 ? void 0 : assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.rrweb) === null || _b === void 0 ? void 0 : _b.record) ||
            !((_c = assignableWindow.__PosthogExtensions__) === null || _c === void 0 ? void 0 : _c.initSessionRecording)) {
            (_e = (_d = assignableWindow.__PosthogExtensions__) === null || _d === void 0 ? void 0 : _d.loadExternalDependency) === null || _e === void 0 ? void 0 : _e.call(_d, this._instance, this._scriptName, (err) => {
                if (err) {
                    return logger.error('could not load recorder', err);
                }
                this._onScriptLoaded(startReason);
            });
        }
        else {
            this._onScriptLoaded(startReason);
        }
    }
    stopRecording() {
        var _a, _b;
        (_a = this._persistFlagsOnSessionListener) === null || _a === void 0 ? void 0 : _a.call(this);
        this._persistFlagsOnSessionListener = undefined;
        (_b = this._lazyLoadedSessionRecording) === null || _b === void 0 ? void 0 : _b.stop();
    }
    _resetSampling() {
        var _a;
        (_a = this._instance.persistence) === null || _a === void 0 ? void 0 : _a.unregister(SESSION_RECORDING_IS_SAMPLED);
    }
    _persistRemoteConfig(response) {
        var _a, _b;
        if (this._instance.persistence) {
            const persistence = this._instance.persistence;
            const persistResponse = () => {
                const sessionRecordingConfigResponse = response.sessionRecording === false ? undefined : response.sessionRecording;
                const receivedSampleRate = sessionRecordingConfigResponse === null || sessionRecordingConfigResponse === void 0 ? void 0 : sessionRecordingConfigResponse.sampleRate;
                const parsedSampleRate = isNullish(receivedSampleRate) ? null : parseFloat(receivedSampleRate);
                if (isNullish(parsedSampleRate)) {
                    this._resetSampling();
                }
                const receivedMinimumDuration = sessionRecordingConfigResponse === null || sessionRecordingConfigResponse === void 0 ? void 0 : sessionRecordingConfigResponse.minimumDurationMilliseconds;
                persistence.register({
                    [SESSION_RECORDING_REMOTE_CONFIG]: {
                        enabled: !!sessionRecordingConfigResponse,
                        ...sessionRecordingConfigResponse,
                        networkPayloadCapture: {
                            capturePerformance: response.capturePerformance,
                            ...sessionRecordingConfigResponse === null || sessionRecordingConfigResponse === void 0 ? void 0 : sessionRecordingConfigResponse.networkPayloadCapture,
                        },
                        canvasRecording: {
                            enabled: sessionRecordingConfigResponse === null || sessionRecordingConfigResponse === void 0 ? void 0 : sessionRecordingConfigResponse.recordCanvas,
                            fps: sessionRecordingConfigResponse === null || sessionRecordingConfigResponse === void 0 ? void 0 : sessionRecordingConfigResponse.canvasFps,
                            quality: sessionRecordingConfigResponse === null || sessionRecordingConfigResponse === void 0 ? void 0 : sessionRecordingConfigResponse.canvasQuality,
                        },
                        sampleRate: parsedSampleRate,
                        minimumDurationMilliseconds: isUndefined(receivedMinimumDuration)
                            ? null
                            : receivedMinimumDuration,
                        endpoint: sessionRecordingConfigResponse === null || sessionRecordingConfigResponse === void 0 ? void 0 : sessionRecordingConfigResponse.endpoint,
                        triggerMatchType: sessionRecordingConfigResponse === null || sessionRecordingConfigResponse === void 0 ? void 0 : sessionRecordingConfigResponse.triggerMatchType,
                        masking: sessionRecordingConfigResponse === null || sessionRecordingConfigResponse === void 0 ? void 0 : sessionRecordingConfigResponse.masking,
                        urlTriggers: sessionRecordingConfigResponse === null || sessionRecordingConfigResponse === void 0 ? void 0 : sessionRecordingConfigResponse.urlTriggers,
                    },
                });
            };
            persistResponse();
            // in case we see multiple flags responses, we should only use the response from the most recent one
            (_a = this._persistFlagsOnSessionListener) === null || _a === void 0 ? void 0 : _a.call(this);
            // we 100% know there is a session manager by this point
            this._persistFlagsOnSessionListener = (_b = this._instance.sessionManager) === null || _b === void 0 ? void 0 : _b.onSessionId(persistResponse);
        }
    }
    onRemoteConfig(response) {
        if (!('sessionRecording' in response)) {
            // if sessionRecording is not in the response, we do nothing
            logger.info('skipping remote config with no sessionRecording', response);
            return;
        }
        if (response.sessionRecording === false) {
            // remotely disabled
            this._receivedFlags = true;
            return;
        }
        this._persistRemoteConfig(response);
        this._receivedFlags = true;
        this.startIfEnabledOrStop();
    }
    log(message, level = 'log') {
        var _a;
        if ((_a = this._lazyLoadedSessionRecording) === null || _a === void 0 ? void 0 : _a.log) {
            this._lazyLoadedSessionRecording.log(message, level);
        }
        else {
            logger.warn('log called before recorder was ready');
        }
    }
    get _scriptName() {
        var _a, _b, _c;
        const remoteConfig = (_b = (_a = this._instance) === null || _a === void 0 ? void 0 : _a.persistence) === null || _b === void 0 ? void 0 : _b.get_property(SESSION_RECORDING_REMOTE_CONFIG);
        return ((_c = remoteConfig === null || remoteConfig === void 0 ? void 0 : remoteConfig.scriptConfig) === null || _c === void 0 ? void 0 : _c.script) || 'lazy-recorder';
    }
    _onScriptLoaded(startReason) {
        var _a, _b;
        if (!((_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.initSessionRecording)) {
            throw Error('Called on script loaded before session recording is available');
        }
        if (!this._lazyLoadedSessionRecording) {
            this._lazyLoadedSessionRecording = (_b = assignableWindow.__PosthogExtensions__) === null || _b === void 0 ? void 0 : _b.initSessionRecording(this._instance);
            this._lazyLoadedSessionRecording._forceAllowLocalhostNetworkCapture =
                this._forceAllowLocalhostNetworkCapture;
        }
        this._lazyLoadedSessionRecording.start(startReason);
    }
    /**
     * this is maintained on the public API only because it has always been on the public API
     * if you are calling this directly you are certainly doing something wrong
     * @deprecated
     */
    onRRwebEmit(rawEvent) {
        var _a, _b;
        (_b = (_a = this._lazyLoadedSessionRecording) === null || _a === void 0 ? void 0 : _a.onRRwebEmit) === null || _b === void 0 ? void 0 : _b.call(_a, rawEvent);
    }
    /**
     * this ignores the linked flag config and (if other conditions are met) causes capture to start
     *
     * It is not usual to call this directly,
     * instead call `posthog.startSessionRecording({linked_flag: true})`
     * */
    overrideLinkedFlag() {
        var _a, _b;
        if (!this._lazyLoadedSessionRecording) {
            (_a = this._instance.persistence) === null || _a === void 0 ? void 0 : _a.register({
                [SESSION_RECORDING_OVERRIDE_LINKED_FLAG]: true,
            });
        }
        (_b = this._lazyLoadedSessionRecording) === null || _b === void 0 ? void 0 : _b.overrideLinkedFlag();
    }
    /**
     * this ignores the sampling config and (if other conditions are met) causes capture to start
     *
     * It is not usual to call this directly,
     * instead call `posthog.startSessionRecording({sampling: true})`
     * */
    overrideSampling() {
        var _a, _b;
        if (!this._lazyLoadedSessionRecording) {
            (_a = this._instance.persistence) === null || _a === void 0 ? void 0 : _a.register({
                [SESSION_RECORDING_OVERRIDE_SAMPLING]: true,
            });
        }
        (_b = this._lazyLoadedSessionRecording) === null || _b === void 0 ? void 0 : _b.overrideSampling();
    }
    /**
     * this ignores the URL/Event trigger config and (if other conditions are met) causes capture to start
     *
     * It is not usual to call this directly,
     * instead call `posthog.startSessionRecording({trigger: 'url' | 'event'})`
     * */
    overrideTrigger(triggerType) {
        var _a, _b;
        if (!this._lazyLoadedSessionRecording) {
            (_a = this._instance.persistence) === null || _a === void 0 ? void 0 : _a.register({
                [triggerType === 'url'
                    ? SESSION_RECORDING_OVERRIDE_URL_TRIGGER
                    : SESSION_RECORDING_OVERRIDE_EVENT_TRIGGER]: true,
            });
        }
        (_b = this._lazyLoadedSessionRecording) === null || _b === void 0 ? void 0 : _b.overrideTrigger(triggerType);
    }
    /*
     * whenever we capture an event, we add these properties to the event
     * these are used to debug issues with the session recording
     * when looking at the event feed for a session
     */
    get sdkDebugProperties() {
        var _a;
        return (((_a = this._lazyLoadedSessionRecording) === null || _a === void 0 ? void 0 : _a.sdkDebugProperties) || {
            $recording_status: this.status,
        });
    }
    /**
     * This adds a custom event to the session recording
     *
     * It is not intended for arbitrary public use - playback only displays known custom events
     * And is exposed on the public interface only so that other parts of the SDK are able to use it
     *
     * if you are calling this from client code, you're probably looking for `posthog.capture('$custom_event', {...})`
     */
    tryAddCustomEvent(tag, payload) {
        var _a;
        return !!((_a = this._lazyLoadedSessionRecording) === null || _a === void 0 ? void 0 : _a.tryAddCustomEvent(tag, payload));
    }
}
