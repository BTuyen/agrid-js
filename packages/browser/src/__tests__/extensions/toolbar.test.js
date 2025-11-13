import { Toolbar } from '../../extensions/toolbar';
import { isString, isUndefined } from '@agrid/core';
import { assignableWindow, window } from '../../utils/globals';
import { RequestRouter } from '../../utils/request-router';
import { TOOLBAR_ID } from '../../constants';
const makeToolbarParams = (overrides) => ({
    token: 'test_token',
    ...overrides,
});
describe('Toolbar', () => {
    let toolbar;
    let instance;
    const toolbarParams = makeToolbarParams({});
    beforeEach(() => {
        instance = {
            config: {
                api_host: 'http://api.example.com',
                token: 'test_token',
            },
            requestRouter: new RequestRouter(instance),
            set_config: jest.fn(),
        };
        assignableWindow.__PosthogExtensions__ = {
            loadExternalDependency: jest.fn((_ph, _path, callback) => callback()),
        };
        toolbar = new Toolbar(instance);
    });
    beforeEach(() => {
        if (document.getElementById(TOOLBAR_ID)) {
            document.body.removeChild(document.getElementById(TOOLBAR_ID));
        }
        assignableWindow.ph_load_toolbar = jest.fn(() => {
            const mockToolbarElement = document.createElement('div');
            mockToolbarElement.setAttribute('id', TOOLBAR_ID);
            document.body.appendChild(mockToolbarElement);
        });
    });
    describe('maybeLoadToolbar', () => {
        const localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
        };
        const storage = localStorage;
        const history = { replaceState: jest.fn() };
        const defaultHashState = {
            action: 'ph_authorize',
            desiredHash: '#myhash',
            projectId: 3,
            projectOwnerId: 722725,
            readOnly: false,
            token: 'test_token',
            userFlags: {
                flag_1: 0,
                flag_2: 1,
            },
            userId: 12345,
        };
        const withHashParamsFrom = (hashState = defaultHashState, key = 'state') => ({
            access_token: 'access token',
            [key]: encodeURIComponent(isString(hashState) ? hashState : JSON.stringify(hashState)),
            expires_in: 3600,
        });
        const withHash = (hashParams) => {
            return Object.keys(hashParams)
                .map((k) => `${k}=${hashParams[k]}`)
                .join('&');
        };
        const aLocation = (hash) => {
            if (isUndefined(hash)) {
                hash = withHash(withHashParamsFrom());
            }
            return {
                hash: `#${hash}`,
                pathname: 'pathname',
                search: '?search',
            };
        };
        beforeEach(() => {
            localStorage.getItem.mockImplementation(() => { });
            jest.spyOn(toolbar, 'loadToolbar');
        });
        it('should initialize the toolbar when the hash state contains action "ph_authorize"', () => {
            // the default hash state in the test setup contains the action "ph_authorize"
            toolbar.maybeLoadToolbar(aLocation(), storage, history);
            expect(toolbar.loadToolbar).toHaveBeenCalledWith({
                ...toolbarParams,
                ...defaultHashState,
                source: 'url',
            });
        });
        it('should initialize the toolbar when there are editor params in the session', () => {
            // if the hash state does not contain ph_authorize then look in storage
            localStorage.getItem.mockImplementation(() => JSON.stringify(toolbarParams));
            const hashState = { ...defaultHashState, action: undefined };
            toolbar.maybeLoadToolbar(aLocation(withHash(withHashParamsFrom(hashState))), storage, history);
            expect(toolbar.loadToolbar).toHaveBeenCalledWith({
                ...toolbarParams,
                source: 'localstorage',
            });
        });
        it('should NOT initialize the toolbar when the activation query param does not exist', () => {
            expect(toolbar.maybeLoadToolbar(aLocation(''), storage, history)).toEqual(false);
            expect(toolbar.loadToolbar).not.toHaveBeenCalled();
        });
        it('should return false when parsing invalid JSON from fragment state', () => {
            expect(toolbar.maybeLoadToolbar(aLocation(withHash(withHashParamsFrom('literally'))), storage, history)).toEqual(false);
            expect(toolbar.loadToolbar).not.toHaveBeenCalled();
        });
        it('should work if calling toolbar params `__posthog`', () => {
            toolbar.maybeLoadToolbar(aLocation(withHash(withHashParamsFrom(defaultHashState, '__posthog'))), storage, history);
            expect(toolbar.loadToolbar).toHaveBeenCalledWith({ ...toolbarParams, ...defaultHashState, source: 'url' });
        });
        it('should use the apiURL in the hash if available', () => {
            toolbar.maybeLoadToolbar(aLocation(withHash(withHashParamsFrom({ ...defaultHashState, apiURL: 'blabla' }))), storage, history);
            expect(toolbar.loadToolbar).toHaveBeenCalledWith({
                ...toolbarParams,
                ...defaultHashState,
                apiURL: 'blabla',
                source: 'url',
            });
        });
    });
    describe('load and close toolbar', () => {
        it('should persist for next time', () => {
            var _a;
            expect(toolbar.loadToolbar(toolbarParams)).toBe(true);
            expect(JSON.parse((_a = window.localStorage.getItem('_postHogToolbarParams')) !== null && _a !== void 0 ? _a : '')).toEqual({
                ...toolbarParams,
                apiURL: 'http://api.example.com',
            });
        });
        it('should load if not previously loaded', () => {
            expect(toolbar.loadToolbar(toolbarParams)).toBe(true);
            expect(assignableWindow.ph_load_toolbar).toHaveBeenCalledWith({ ...toolbarParams, apiURL: 'http://api.example.com' }, instance);
        });
        it('should NOT load if previously loaded', () => {
            expect(toolbar.loadToolbar(toolbarParams)).toBe(true);
            expect(toolbar.loadToolbar(toolbarParams)).toBe(false);
        });
        it('should load if previously loaded but closed', () => {
            expect(toolbar.loadToolbar(toolbarParams)).toBe(true);
            expect(toolbar.loadToolbar(toolbarParams)).toBe(false);
            document.body.removeChild(document.getElementById(TOOLBAR_ID));
            expect(toolbar.loadToolbar(toolbarParams)).toBe(true);
        });
    });
    describe('load and close toolbar with minimal params', () => {
        const minimalToolbarParams = {
            token: 'accessToken',
        };
        it('should load if not previously loaded', () => {
            expect(toolbar.loadToolbar(minimalToolbarParams)).toBe(true);
            expect(assignableWindow.ph_load_toolbar).toHaveBeenCalledWith({
                ...minimalToolbarParams,
                apiURL: 'http://api.example.com',
                token: 'accessToken',
            }, instance);
        });
        it('should NOT load if previously loaded', () => {
            expect(toolbar.loadToolbar(minimalToolbarParams)).toBe(true);
            expect(toolbar.loadToolbar(minimalToolbarParams)).toBe(false);
        });
    });
});
