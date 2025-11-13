import { mockLogger } from './helpers/mock-logger';
import { SiteApps } from '../site-apps';
import { PostHogPersistence } from '../posthog-persistence';
import { RequestRouter } from '../utils/request-router';
import { assignableWindow } from '../utils/globals';
import '../entrypoints/external-scripts-loader';
import { isFunction } from '@agrid/core';
describe('SiteApps', () => {
    let posthog;
    let siteAppsInstance;
    let emitCaptureEvent;
    let removeCaptureHook = jest.fn();
    const token = 'testtoken';
    const defaultConfig = {
        token: token,
        api_host: 'https://test.com',
        persistence: 'memory',
    };
    beforeEach(() => {
        // Clean the JSDOM to prevent interdependencies between tests
        document.body.innerHTML = '';
        document.head.innerHTML = '';
        // Reset assignableWindow properties
        assignableWindow.__PosthogExtensions__ = {
            loadSiteApp: jest.fn().mockImplementation((_instance, _url, callback) => {
                // Simulate async loading
                setTimeout(() => {
                    const id = _url.split('/').pop();
                    if (isFunction(assignableWindow[`__$$ph_site_app_${id}_callback`])) {
                        assignableWindow[`__$$ph_site_app_${id}_callback`]();
                    }
                    callback();
                }, 0);
            }),
        };
        delete assignableWindow._POSTHOG_REMOTE_CONFIG;
        delete assignableWindow.POSTHOG_DEBUG;
        removeCaptureHook = jest.fn();
        posthog = {
            config: { ...defaultConfig, opt_in_site_apps: true },
            persistence: new PostHogPersistence(defaultConfig),
            register: (props) => posthog.persistence.register(props),
            unregister: (key) => posthog.persistence.unregister(key),
            get_property: (key) => posthog.persistence.props[key],
            capture: jest.fn(),
            _addCaptureHook: jest.fn((cb) => {
                emitCaptureEvent = cb;
                return removeCaptureHook;
            }),
            _afterFlagsResponse: jest.fn(),
            get_distinct_id: jest.fn().mockImplementation(() => 'distinctid'),
            _send_request: jest.fn().mockImplementation(({ callback }) => callback === null || callback === void 0 ? void 0 : callback({ config: {} })),
            featureFlags: {
                receivedFeatureFlags: jest.fn(),
                setReloadingPaused: jest.fn(),
                _startReloadTimer: jest.fn(),
            },
            requestRouter: new RequestRouter({ config: defaultConfig }),
            _hasBootstrappedFeatureFlags: jest.fn(),
            getGroups: () => ({ organization: '5' }),
            on: jest.fn(),
        };
        siteAppsInstance = new SiteApps(posthog);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('constructor', () => {
        it('sets enabled to true when opt_in_site_apps is true', () => {
            posthog.config = {
                ...defaultConfig,
                opt_in_site_apps: true,
            };
            expect(siteAppsInstance.isEnabled).toBe(true);
        });
        it('sets enabled to false when opt_in_site_apps is false', () => {
            posthog.config = {
                ...defaultConfig,
                opt_in_site_apps: false,
            };
            siteAppsInstance = new SiteApps(posthog);
            expect(siteAppsInstance.isEnabled).toBe(false);
        });
        it('initializes missedInvocations, loaded, appsLoading correctly', () => {
            expect(siteAppsInstance['_bufferedInvocations']).toEqual([]);
            expect(siteAppsInstance.apps).toEqual({});
        });
    });
    describe('init', () => {
        it('adds eventCollector as a capture hook', () => {
            expect(siteAppsInstance['_stopBuffering']).toBeUndefined();
            siteAppsInstance.init();
            expect(posthog._addCaptureHook).toHaveBeenCalledWith(expect.any(Function));
            expect(siteAppsInstance['_stopBuffering']).toEqual(expect.any(Function));
        });
        it('does not add eventCollector as a capture hook if disabled', () => {
            posthog.config.opt_in_site_apps = false;
            siteAppsInstance.init();
            expect(posthog._addCaptureHook).not.toHaveBeenCalled();
            expect(siteAppsInstance['_stopBuffering']).toBeUndefined();
        });
    });
    describe('eventCollector', () => {
        beforeEach(() => {
            siteAppsInstance.init();
        });
        it('collects events if enabled after init', () => {
            emitCaptureEvent === null || emitCaptureEvent === void 0 ? void 0 : emitCaptureEvent('test_event', { event: 'test_event', properties: { prop1: 'value1' } });
            expect(siteAppsInstance['_bufferedInvocations']).toMatchInlineSnapshot(`
[
  {
    "event": {
      "distinct_id": undefined,
      "elements_chain": "",
      "event": "test_event",
      "properties": {
        "prop1": "value1",
      },
    },
    "groups": {},
    "person": {
      "properties": undefined,
    },
  },
]
`);
        });
        it('trims missedInvocations to last 990 when exceeding 1000', () => {
            siteAppsInstance['_bufferedInvocations'] = new Array(1000).fill({});
            emitCaptureEvent === null || emitCaptureEvent === void 0 ? void 0 : emitCaptureEvent('test_event', { event: 'test_event', properties: { prop1: 'value1' } });
            expect(siteAppsInstance['_bufferedInvocations'].length).toBe(991);
            expect(siteAppsInstance['_bufferedInvocations'][0]).toEqual({});
            expect(siteAppsInstance['_bufferedInvocations'][990]).toMatchObject({ event: { event: 'test_event' } });
        });
    });
    describe('globalsForEvent', () => {
        it('throws an error if event is undefined', () => {
            expect(() => siteAppsInstance.globalsForEvent(undefined)).toThrow('Event payload is required');
        });
        it('constructs globals object correctly', () => {
            jest.spyOn(posthog, 'get_property').mockImplementation((key) => {
                if (key === '$groups') {
                    return { groupType: 'groupId' };
                }
                else if (key === '$stored_group_properties') {
                    return { groupType: { prop1: 'value1' } };
                }
                else if (key === '$stored_person_properties') {
                    return { personProp: 'personValue' };
                }
            });
            const eventPayload = {
                uuid: 'test_uuid',
                event: 'test_event',
                properties: {
                    prop1: 'value1',
                    distinct_id: 'test_distinct_id',
                    $elements_chain: 'elements_chain_value',
                },
                $set: { setProp: 'setValue' },
                $set_once: { setOnceProp: 'setOnceValue' },
            };
            const globals = siteAppsInstance.globalsForEvent(eventPayload);
            expect(globals).toEqual({
                event: {
                    uuid: 'test_uuid',
                    event: 'test_event',
                    properties: {
                        $elements_chain: 'elements_chain_value',
                        prop1: 'value1',
                        distinct_id: 'test_distinct_id',
                        $set: { setProp: 'setValue' },
                        $set_once: { setOnceProp: 'setOnceValue' },
                    },
                    elements_chain: 'elements_chain_value',
                    distinct_id: 'test_distinct_id',
                },
                person: {
                    properties: { personProp: 'personValue' },
                },
                groups: {
                    groupType: {
                        id: 'groupId',
                        type: 'groupType',
                        properties: { prop1: 'value1' },
                    },
                },
            });
        });
    });
    describe('legacy site apps loading', () => {
        beforeEach(() => {
            posthog.config.opt_in_site_apps = true;
            siteAppsInstance.init();
        });
        it('loads stops buffering if no site apps', () => {
            var _a;
            posthog.config.opt_in_site_apps = true;
            siteAppsInstance.onRemoteConfig({});
            expect(removeCaptureHook).toHaveBeenCalled();
            expect(siteAppsInstance['_stopBuffering']).toBeUndefined();
            expect((_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.loadSiteApp).not.toHaveBeenCalled();
        });
        it('does not loads site apps if disabled', () => {
            var _a;
            posthog.config.opt_in_site_apps = false;
            siteAppsInstance.onRemoteConfig({
                siteApps: [
                    { id: '1', url: '/site_app/1' },
                    { id: '2', url: '/site_app/2' },
                ],
            });
            expect(removeCaptureHook).toHaveBeenCalled();
            expect(siteAppsInstance['_stopBuffering']).toBeUndefined();
            expect((_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.loadSiteApp).not.toHaveBeenCalled();
        });
        it('does not load site apps if new global loader exists', () => {
            var _a;
            assignableWindow._POSTHOG_REMOTE_CONFIG = {
                [token]: {
                    config: {},
                    siteApps: [
                        {
                            id: '1',
                            init: jest.fn(() => {
                                return {
                                    processEvent: jest.fn(),
                                };
                            }),
                        },
                    ],
                },
            };
            siteAppsInstance.onRemoteConfig({
                siteApps: [{ id: '1', url: '/site_app/1' }],
            });
            expect((_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.loadSiteApp).not.toHaveBeenCalled();
        });
        it('loads site apps if new global loader is not available', () => {
            var _a, _b, _c;
            siteAppsInstance.onRemoteConfig({
                siteApps: [
                    { id: '1', url: '/site_app/1' },
                    { id: '2', url: '/site_app/2' },
                ],
            });
            expect(removeCaptureHook).toHaveBeenCalled();
            expect(siteAppsInstance['_stopBuffering']).toBeUndefined();
            expect((_a = assignableWindow.__PosthogExtensions__) === null || _a === void 0 ? void 0 : _a.loadSiteApp).toHaveBeenCalledTimes(2);
            expect((_b = assignableWindow.__PosthogExtensions__) === null || _b === void 0 ? void 0 : _b.loadSiteApp).toHaveBeenCalledWith(posthog, '/site_app/1', expect.any(Function));
            expect((_c = assignableWindow.__PosthogExtensions__) === null || _c === void 0 ? void 0 : _c.loadSiteApp).toHaveBeenCalledWith(posthog, '/site_app/2', expect.any(Function));
        });
    });
    describe('onRemoteConfig', () => {
        let appConfigs = [];
        const init = (onInit) => {
            assignableWindow._POSTHOG_REMOTE_CONFIG = {
                [token]: {
                    config: {},
                    siteApps: [
                        {
                            id: '1',
                            init: jest.fn((config) => {
                                const processEvent = jest.fn();
                                appConfigs.push({ ...config, processEvent });
                                onInit === null || onInit === void 0 ? void 0 : onInit(config);
                                return {
                                    processEvent,
                                };
                            }),
                        },
                        {
                            id: '2',
                            init: jest.fn((config) => {
                                const processEvent = jest.fn();
                                appConfigs.push({ ...config, processEvent });
                                onInit === null || onInit === void 0 ? void 0 : onInit(config);
                                return {
                                    processEvent,
                                };
                            }),
                        },
                    ],
                },
            };
            siteAppsInstance.init();
        };
        beforeEach(() => {
            appConfigs = [];
        });
        it('sets up the eventCaptured listener if site apps', () => {
            init();
            siteAppsInstance.onRemoteConfig({});
            expect(posthog.on).toHaveBeenCalledWith('eventCaptured', expect.any(Function));
        });
        it('does not sets up the eventCaptured listener if no site apps', () => {
            init();
            assignableWindow._POSTHOG_REMOTE_CONFIG = {
                [token]: {
                    config: {},
                    siteApps: [],
                },
            };
            siteAppsInstance.onRemoteConfig({});
            expect(posthog.on).not.toHaveBeenCalled();
        });
        it('loads site apps via the window object if defined', () => {
            init();
            siteAppsInstance.onRemoteConfig({});
            expect(appConfigs[0]).toBeDefined();
            expect(siteAppsInstance.apps['1']).toEqual({
                errored: false,
                loaded: false,
                processedBuffer: false,
                id: '1',
                processEvent: expect.any(Function),
            });
            appConfigs[0].callback(true);
            expect(siteAppsInstance.apps['1']).toEqual({
                errored: false,
                loaded: true,
                processedBuffer: false,
                id: '1',
                processEvent: expect.any(Function),
            });
        });
        it('marks site app as errored if callback fails', () => {
            init();
            siteAppsInstance.onRemoteConfig({});
            expect(appConfigs[0]).toBeDefined();
            expect(siteAppsInstance.apps['1']).toMatchObject({
                errored: false,
                loaded: false,
                processedBuffer: false,
            });
            appConfigs[0].callback(false);
            expect(siteAppsInstance.apps['1']).toMatchObject({
                errored: true,
                loaded: true,
                processedBuffer: false,
            });
        });
        it('calls the processEvent method if it exists and events are buffered', () => {
            init();
            emitCaptureEvent === null || emitCaptureEvent === void 0 ? void 0 : emitCaptureEvent('test_event1', { event: 'test_event1' });
            siteAppsInstance.onRemoteConfig({});
            emitCaptureEvent === null || emitCaptureEvent === void 0 ? void 0 : emitCaptureEvent('test_event2', { event: 'test_event2' });
            expect(siteAppsInstance['_bufferedInvocations'].length).toBe(2);
            appConfigs[0].callback(true);
            expect(siteAppsInstance.apps['1'].processEvent).toHaveBeenCalledTimes(2);
            expect(siteAppsInstance.apps['1'].processEvent).toHaveBeenCalledWith(siteAppsInstance.globalsForEvent({ event: 'test_event1' }));
            expect(siteAppsInstance.apps['1'].processEvent).toHaveBeenCalledWith(siteAppsInstance.globalsForEvent({ event: 'test_event2' }));
        });
        it('clears the buffer after all apps are loaded, when succeeding async', () => {
            init();
            emitCaptureEvent === null || emitCaptureEvent === void 0 ? void 0 : emitCaptureEvent('test_event1', { event: 'test_event1' });
            emitCaptureEvent === null || emitCaptureEvent === void 0 ? void 0 : emitCaptureEvent('test_event2', { event: 'test_event2' });
            expect(siteAppsInstance['_bufferedInvocations'].length).toBe(2);
            siteAppsInstance.onRemoteConfig({});
            appConfigs[0].callback(true);
            expect(siteAppsInstance['_bufferedInvocations'].length).toBe(2);
            appConfigs[1].callback(true);
            expect(siteAppsInstance['_bufferedInvocations'].length).toBe(0);
            expect(siteAppsInstance.apps['1'].processEvent).toHaveBeenCalledTimes(2);
            expect(siteAppsInstance.apps['2'].processEvent).toHaveBeenCalledTimes(2);
        });
        it('clears the buffer after all apps are loaded, when succeeding sync', () => {
            init(({ callback }) => {
                callback(true);
            });
            emitCaptureEvent === null || emitCaptureEvent === void 0 ? void 0 : emitCaptureEvent('test_event1', { event: 'test_event1' });
            emitCaptureEvent === null || emitCaptureEvent === void 0 ? void 0 : emitCaptureEvent('test_event2', { event: 'test_event2' });
            expect(siteAppsInstance['_bufferedInvocations'].length).toBe(2);
            siteAppsInstance.onRemoteConfig({});
            expect(siteAppsInstance['_bufferedInvocations'].length).toBe(0);
            expect(siteAppsInstance.apps['1'].processEvent).toHaveBeenCalledTimes(2);
            expect(siteAppsInstance.apps['2'].processEvent).toHaveBeenCalledTimes(2);
        });
        it('logs error if site apps are disabled but response contains site apps', () => {
            init();
            posthog.config.opt_in_site_apps = false;
            assignableWindow.POSTHOG_DEBUG = true;
            siteAppsInstance.onRemoteConfig({});
            expect(mockLogger.error).toHaveBeenCalledWith('PostHog site apps are disabled. Enable the "opt_in_site_apps" config to proceed.');
            expect(siteAppsInstance.apps).toEqual({});
        });
    });
});
