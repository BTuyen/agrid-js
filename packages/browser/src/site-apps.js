import { assignableWindow } from './utils/globals';
import { createLogger } from './utils/logger';
const logger = createLogger('[SiteApps]');
export class SiteApps {
    constructor(_instance) {
        this._instance = _instance;
        // events captured between loading posthog-js and the site app; up to 1000 events
        this._bufferedInvocations = [];
        this.apps = {};
    }
    get isEnabled() {
        return !!this._instance.config.opt_in_site_apps;
    }
    _eventCollector(_eventName, eventPayload) {
        if (!eventPayload) {
            return;
        }
        const globals = this.globalsForEvent(eventPayload);
        this._bufferedInvocations.push(globals);
        if (this._bufferedInvocations.length > 1000) {
            this._bufferedInvocations = this._bufferedInvocations.slice(10);
        }
    }
    get siteAppLoaders() {
        var _a, _b;
        return (_b = (_a = assignableWindow._POSTHOG_REMOTE_CONFIG) === null || _a === void 0 ? void 0 : _a[this._instance.config.token]) === null || _b === void 0 ? void 0 : _b.siteApps;
    }
    init() {
        if (this.isEnabled) {
            const stop = this._instance._addCaptureHook(this._eventCollector.bind(this));
            this._stopBuffering = () => {
                stop();
                this._bufferedInvocations = [];
                this._stopBuffering = undefined;
            };
        }
    }
    globalsForEvent(event) {
        var _a, _b, _c, _d, _e, _f, _g;
        if (!event) {
            throw new Error('Event payload is required');
        }
        const groups = {};
        const groupIds = this._instance.get_property('$groups') || [];
        const groupProperties = this._instance.get_property('$stored_group_properties') || {};
        for (const [type, properties] of Object.entries(groupProperties)) {
            groups[type] = { id: groupIds[type], type, properties };
        }
        const { $set_once, $set, ..._event } = event;
        const globals = {
            event: {
                ..._event,
                properties: {
                    ...event.properties,
                    ...($set ? { $set: { ...((_b = (_a = event.properties) === null || _a === void 0 ? void 0 : _a.$set) !== null && _b !== void 0 ? _b : {}), ...$set } } : {}),
                    ...($set_once ? { $set_once: { ...((_d = (_c = event.properties) === null || _c === void 0 ? void 0 : _c.$set_once) !== null && _d !== void 0 ? _d : {}), ...$set_once } } : {}),
                },
                elements_chain: (_f = (_e = event.properties) === null || _e === void 0 ? void 0 : _e['$elements_chain']) !== null && _f !== void 0 ? _f : '',
                // TODO:
                // - elements_chain_href: '',
                // - elements_chain_texts: [] as string[],
                // - elements_chain_ids: [] as string[],
                // - elements_chain_elements: [] as string[],
                distinct_id: (_g = event.properties) === null || _g === void 0 ? void 0 : _g['distinct_id'],
            },
            person: {
                properties: this._instance.get_property('$stored_person_properties'),
            },
            groups,
        };
        return globals;
    }
    setupSiteApp(loader) {
        const app = this.apps[loader.id];
        const processBufferedEvents = () => {
            var _a;
            if (!app.errored && this._bufferedInvocations.length) {
                logger.info(`Processing ${this._bufferedInvocations.length} events for site app with id ${loader.id}`);
                this._bufferedInvocations.forEach((globals) => { var _a; return (_a = app.processEvent) === null || _a === void 0 ? void 0 : _a.call(app, globals); });
                app.processedBuffer = true;
            }
            if (Object.values(this.apps).every((app) => app.processedBuffer || app.errored)) {
                (_a = this._stopBuffering) === null || _a === void 0 ? void 0 : _a.call(this);
            }
        };
        let hasInitReturned = false;
        const onLoaded = (success) => {
            app.errored = !success;
            app.loaded = true;
            logger.info(`Site app with id ${loader.id} ${success ? 'loaded' : 'errored'}`);
            // ensure that we don't call processBufferedEvents until after init() returns and we've set up processEvent
            if (hasInitReturned) {
                processBufferedEvents();
            }
        };
        try {
            const { processEvent } = loader.init({
                posthog: this._instance,
                callback: (success) => {
                    onLoaded(success);
                },
            });
            if (processEvent) {
                app.processEvent = processEvent;
            }
            hasInitReturned = true;
        }
        catch (e) {
            logger.error(`Error while initializing PostHog app with config id ${loader.id}`, e);
            onLoaded(false);
        }
        // if the app loaded synchronously, process the events now
        if (hasInitReturned && app.loaded) {
            try {
                processBufferedEvents();
            }
            catch (e) {
                logger.error(`Error while processing buffered events PostHog app with config id ${loader.id}`, e);
                app.errored = true;
            }
        }
    }
    _setupSiteApps() {
        const siteAppLoaders = this.siteAppLoaders || [];
        // do this in 2 passes, so that this.apps is populated before we call init
        for (const loader of siteAppLoaders) {
            this.apps[loader.id] = {
                id: loader.id,
                loaded: false,
                errored: false,
                processedBuffer: false,
            };
        }
        for (const loader of siteAppLoaders) {
            this.setupSiteApp(loader);
        }
    }
    _onCapturedEvent(event) {
        var _a;
        if (Object.keys(this.apps).length === 0) {
            return;
        }
        const globals = this.globalsForEvent(event);
        for (const app of Object.values(this.apps)) {
            try {
                (_a = app.processEvent) === null || _a === void 0 ? void 0 : _a.call(app, globals);
            }
            catch (e) {
                logger.error(`Error while processing event ${event.event} for site app ${app.id}`, e);
            }
        }
    }
    onRemoteConfig(response) {
        var _a, _b, _c, _d, _e;
        if ((_a = this.siteAppLoaders) === null || _a === void 0 ? void 0 : _a.length) {
            if (!this.isEnabled) {
                logger.error(`PostHog site apps are disabled. Enable the "opt_in_site_apps" config to proceed.`);
                return;
            }
            this._setupSiteApps();
            // NOTE: We could improve this to only fire if we actually have listeners for the event
            this._instance.on('eventCaptured', (event) => this._onCapturedEvent(event));
            return;
        }
        // NOTE: Below this is now only the fallback for legacy site app support. Once we have fully removed to the remote config loader we can get rid of this
        (_b = this._stopBuffering) === null || _b === void 0 ? void 0 : _b.call(this);
        if (!((_c = response['siteApps']) === null || _c === void 0 ? void 0 : _c.length)) {
            return;
        }
        if (!this.isEnabled) {
            logger.error(`PostHog site apps are disabled. Enable the "opt_in_site_apps" config to proceed.`);
            return;
        }
        for (const { id, url } of response['siteApps']) {
            assignableWindow[`__$$ph_site_app_${id}`] = this._instance;
            (_e = (_d = assignableWindow.__PosthogExtensions__) === null || _d === void 0 ? void 0 : _d.loadSiteApp) === null || _e === void 0 ? void 0 : _e.call(_d, this._instance, url, (err) => {
                if (err) {
                    return logger.error(`Error while initializing PostHog app with config id ${id}`, err);
                }
            });
        }
    }
}
