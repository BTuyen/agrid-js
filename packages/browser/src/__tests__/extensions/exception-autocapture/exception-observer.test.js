import { ExceptionObserver } from '../../../extensions/exception-autocapture';
import { assignableWindow, window } from '../../../utils/globals';
import { createPosthogInstance } from '../../helpers/posthog-instance';
import { uuidv7 } from '../../../uuidv7';
import posthogErrorWrappingFunctions from '../../../entrypoints/exception-autocapture';
import { afterEach } from '@jest/globals';
export class PromiseRejectionEvent extends Event {
    constructor(type, options) {
        super(type);
        this.promise = options.promise;
        this.reason = options.reason;
    }
}
/* finished helping js-dom */
describe('Exception Observer', () => {
    let exceptionObserver;
    let posthog;
    let sendRequestSpy;
    const beforeSendMock = jest.fn().mockImplementation((e) => e);
    const loadScriptMock = jest.fn();
    const addErrorWrappingFlagToWindow = () => {
        // assignableWindow.onerror = jest.fn()
        // assignableWindow.onerror__POSTHOG_INSTRUMENTED__ = true
        assignableWindow.__PosthogExtensions__.errorWrappingFunctions = posthogErrorWrappingFunctions;
    };
    const expectNoHandlers = () => {
        var _a, _b, _c, _d;
        expect((_b = (_a = window === null || window === void 0 ? void 0 : window.console) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.__POSTHOG_INSTRUMENTED__).toBeUndefined();
        expect((_c = window === null || window === void 0 ? void 0 : window.onerror) === null || _c === void 0 ? void 0 : _c.__POSTHOG_INSTRUMENTED__).toBeUndefined();
        expect((_d = window === null || window === void 0 ? void 0 : window.onunhandledrejection) === null || _d === void 0 ? void 0 : _d.__POSTHOG_INSTRUMENTED__).toBeUndefined();
    };
    beforeEach(async () => {
        loadScriptMock.mockImplementation((_ph, _path, callback) => {
            addErrorWrappingFlagToWindow();
            callback();
        });
        posthog = await createPosthogInstance(uuidv7(), { before_send: beforeSendMock });
        assignableWindow.__PosthogExtensions__ = {
            loadExternalDependency: loadScriptMock,
        };
        sendRequestSpy = jest.spyOn(posthog, '_send_request');
        exceptionObserver = new ExceptionObserver(posthog);
    });
    afterEach(() => {
        exceptionObserver['_stopCapturing']();
    });
    describe('when enabled remotely', () => {
        beforeEach(() => {
            exceptionObserver.onRemoteConfig({ autocaptureExceptions: true });
        });
        it('should instrument enabled handlers only when started', () => {
            var _a;
            expect(exceptionObserver.isEnabled).toBe(true);
            expect(((_a = window === null || window === void 0 ? void 0 : window.console) === null || _a === void 0 ? void 0 : _a.error).__POSTHOG_INSTRUMENTED__).toBeUndefined();
            expect((window === null || window === void 0 ? void 0 : window.onerror).__POSTHOG_INSTRUMENTED__).toBe(true);
            expect((window === null || window === void 0 ? void 0 : window.onunhandledrejection).__POSTHOG_INSTRUMENTED__).toBe(true);
        });
        it('should remove instrument handlers when stopped', () => {
            exceptionObserver['_stopCapturing']();
            expectNoHandlers();
        });
        it('captures an event when an error is thrown', () => {
            var _a;
            const error = new Error('test error');
            (_a = window.onerror) === null || _a === void 0 ? void 0 : _a.call(window, 'message', 'source', 0, 0, error);
            const captureCalls = beforeSendMock.mock.calls;
            expect(captureCalls.length).toBe(1);
            const singleCall = captureCalls[0];
            expect(singleCall[0]).toMatchObject({
                event: '$exception',
                properties: {
                    $exception_list: [
                        {
                            type: 'Error',
                            value: 'test error',
                            stacktrace: { frames: expect.any(Array) },
                            mechanism: { synthetic: false, handled: false },
                        },
                    ],
                },
            });
        });
        it('captures an event when an unhandled rejection occurs', () => {
            var _a;
            const error = new Error('test error');
            // PromiseRejectionEvent does not exists in node, it is treated as an event here
            // See e2e tests
            const promiseRejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
                // this is a test not a browser, so we don't care there's no Promise in IE11
                // eslint-disable-next-line compat/compat
                promise: Promise.resolve(),
                reason: error,
            });
            (_a = window.onunhandledrejection) === null || _a === void 0 ? void 0 : _a.call(window, promiseRejectionEvent);
            const captureCalls = beforeSendMock.mock.calls;
            expect(captureCalls.length).toBe(1);
            const singleCall = captureCalls[0];
            expect(singleCall[0]).toMatchObject({
                event: '$exception',
                properties: {
                    $exception_list: [
                        {
                            type: 'PromiseRejectionEvent',
                            value: 'PromiseRejectionEvent captured as exception with keys: isTrusted, promise, reason',
                            mechanism: { synthetic: true, handled: false },
                        },
                    ],
                },
            });
        });
        it('sends captured events to the right URL', () => {
            var _a;
            const error = new Error('test error');
            (_a = window.onerror) === null || _a === void 0 ? void 0 : _a.call(window, 'message', 'source', 0, 0, error);
            expect(sendRequestSpy).toHaveBeenCalled();
            const request = sendRequestSpy.mock.calls[0][0];
            expect(request.url).toBe('http://localhost/e/?ip=0');
            expect(request.data).toMatchObject({
                event: '$exception',
                properties: {
                    $exception_list: [
                        {
                            type: 'Error',
                            value: 'test error',
                            stacktrace: { frames: expect.any(Array) },
                            mechanism: { synthetic: false, handled: false },
                        },
                    ],
                },
            });
            expect(request.batchKey).toBe('exceptionEvent');
        });
        it('does not start if disabled locally', () => {
            posthog.config.capture_exceptions = false;
            exceptionObserver = new ExceptionObserver(posthog);
            expect(exceptionObserver.isEnabled).toBe(false);
        });
    });
    describe('when there are handlers already present', () => {
        const originalOnError = jest.fn();
        const originalOnUnhandledRejection = jest.fn();
        beforeEach(() => {
            jest.clearAllMocks();
            window.onerror = originalOnError;
            window.onunhandledrejection = originalOnUnhandledRejection;
            exceptionObserver.onRemoteConfig({ autocaptureExceptions: true });
        });
        it('should wrap original onerror handler if one was present when wrapped', () => {
            expect(window.onerror).toBeDefined();
            expect(window.onerror).not.toBe(originalOnError);
        });
        it('should wrap original onunhandledrejection handler if one was present when wrapped', () => {
            expect(window.onunhandledrejection).toBeDefined();
            expect(window.onunhandledrejection).not.toBe(originalOnUnhandledRejection);
        });
        it('should call original onerror handler if one was present when wrapped', () => {
            var _a;
            // throw an error so that it will be caught by window.onerror
            const error = new Error('test error');
            (_a = window.onerror) === null || _a === void 0 ? void 0 : _a.call(window, 'message', 'source', 0, 0, error);
            expect(originalOnError).toHaveBeenCalledWith('message', 'source', 0, 0, error);
        });
        it('should call original onunhandledrejection handler if one was present when wrapped', () => {
            var _a;
            // throw an error so that it will be caught by window.onunhandledrejection
            const error = new Error('test error');
            const promiseRejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
                // this is a test not a browser, so we don't care there's no Promise in IE11
                // eslint-disable-next-line compat/compat
                promise: Promise.resolve(),
                reason: error,
            });
            (_a = window.onunhandledrejection) === null || _a === void 0 ? void 0 : _a.call(window, promiseRejectionEvent);
            expect(originalOnUnhandledRejection).toHaveBeenCalledWith(promiseRejectionEvent);
        });
        it('should reinstate original onerror handler if one was present when wrapped', () => {
            exceptionObserver['_stopCapturing']();
            expect(window.onerror).toBe(originalOnError);
        });
        it('should reinstate original onunhandledrejection handler if one was present when wrapped', () => {
            exceptionObserver['_stopCapturing']();
            expect(window.onunhandledrejection).toBe(originalOnUnhandledRejection);
        });
    });
    describe('when no flags response', () => {
        it('cannot be started', () => {
            expect(exceptionObserver.isEnabled).toBe(false);
            expectNoHandlers();
            exceptionObserver['_startCapturing']();
            expectNoHandlers();
        });
    });
    describe('when disabled', () => {
        beforeEach(() => {
            exceptionObserver.onRemoteConfig({ autocaptureExceptions: false });
        });
        it('cannot be started', () => {
            expect(exceptionObserver.isEnabled).toBe(false);
            expectNoHandlers();
            exceptionObserver['_startCapturing']();
            expectNoHandlers();
        });
    });
});
