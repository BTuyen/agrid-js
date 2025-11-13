import { BucketedRateLimiter, isEmptyObject, isNullish, isObject, isUndefined } from '@agrid/core';
import { createLogger } from '../utils/logger';
/**
 * Default title function for Redux events
 */
function defaultTitleFunction(stateEvent) {
    const { type, executionTimeMs } = stateEvent;
    const timeText = isNullish(executionTimeMs) ? '' : ` (${executionTimeMs.toFixed(2)}ms)`;
    return `${type}${timeText}`;
}
// we need a posthog logger for the rate limiter
const phConsoleLogger = createLogger('[PostHog Action RateLimiting]');
export function browserConsoleLogger(title, stateEvent) {
    // but the posthog logger swallows messages unless debug is on
    // so we don't want to use it in this default logger
    // eslint-disable-next-line no-console
    console.log(title, stateEvent);
}
/**
 * Logger that sends state events to PostHog session recordings
 * Requires that the loaded posthog instance is provided
 * And returns the function to use as the logger
 *
 * e.g. const config = { logger: sessionRecordingLoggerForPostHogInstance(posthog) }
 */
export const sessionRecordingLoggerForPostHogInstance = (postHogInstance) => (title, stateEvent) => {
    var _a;
    (_a = postHogInstance === null || postHogInstance === void 0 ? void 0 : postHogInstance.sessionRecording) === null || _a === void 0 ? void 0 : _a.tryAddCustomEvent('app-state', { title, stateEvent });
};
/**
 * Get only the changed keys from two states
 * NB exported for testing purposes only, not part of the public API and may change without warning
 *
 * Returns { prevState: changedKeysOnly, nextState: changedKeysOnly }
 */
export function getChangedState(prevState, nextState, maxDepth = 5) {
    // Fast bailouts
    if (typeof prevState !== 'object' || typeof nextState !== 'object')
        return {};
    if (prevState === nextState)
        return {};
    // all keys changed when no previous state
    if (!prevState && nextState)
        return nextState;
    // something weird has happened, return empty
    if (!nextState || !prevState)
        return {};
    const changed = {};
    const allKeys = new Set([...Object.keys(prevState), ...Object.keys(nextState)]);
    for (const key of allKeys) {
        const prevValue = prevState[key];
        const nextValue = nextState[key];
        // Key exists in only one object
        if (isUndefined(prevValue)) {
            changed[key] = nextValue;
            continue;
        }
        if (isUndefined(nextValue)) {
            changed[key] = prevValue;
            continue;
        }
        // Same value
        if (prevValue === nextValue) {
            continue;
        }
        // Both null/undefined
        if (isNullish(prevValue) && isNullish(nextValue)) {
            continue;
        }
        // Primitive or one is null
        if (!isObject(prevValue) || !isObject(nextValue)) {
            changed[key] = nextValue;
            continue;
        }
        // Both are objects, recurse if under max depth
        if (maxDepth > 1) {
            const childChanged = getChangedState(prevValue, nextValue, maxDepth - 1);
            if (!isEmptyObject(childChanged)) {
                changed[key] = childChanged;
            }
        }
        else {
            changed[key] = `max depth reached, checking for changed value`;
        }
    }
    return changed;
}
// Debounced logger for rate limit messages
const createDebouncedActionRateLimitedLogger = () => {
    let timeout = null;
    let ignoredCount = 0;
    let lastActionType = null;
    return {
        info: (actionType) => {
            if (lastActionType !== actionType) {
                // Reset counter when action type changes
                ignoredCount = 0;
                lastActionType = actionType;
            }
            ignoredCount++;
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                const count = ignoredCount;
                if (count === 1) {
                    phConsoleLogger.info(`action "${actionType}" has been rate limited`);
                }
                else {
                    phConsoleLogger.info(`action "${actionType}" has been rate limited (${count} times)`);
                }
                ignoredCount = 0;
                timeout = null;
            }, 1000);
        },
    };
};
const debouncedActionRateLimitedLogger = createDebouncedActionRateLimitedLogger();
/**
 * Creates a Kea plugin that logs actions and state changes to a provided logger
 * This can be used as a plugin in any Kea setup to capture state changes
 */
export function posthogKeaLogger(config = {}) {
    const middleware = posthogReduxLogger(config);
    return {
        name: 'posthog-kea-logger',
        events: {
            beforeReduxStore(options) {
                options.middleware.push(middleware);
            },
        },
    };
}
/**
 * Creates a Redux middleware that logs actions and state changes to a provided logger
 * This can be used as middleware in any Redux store to capture state changes
 *
 * The logging uses token-bucket rate limiting to avoid flooding the logging with many changes
 * by default logging rate limiting captures ten action instances before rate limiting by action type
 * refills at a rate of one token / 1-second period
 * e.g. will capture 1 rate limited action every 1 second until the burst ends
 */
export function posthogReduxLogger(config = {}
// the empty object is the recommended typing from redux docs
//eslint-disable-next-line @typescript-eslint/no-empty-object-type
) {
    const { maskAction, maskState, titleFunction = defaultTitleFunction, logger = browserConsoleLogger, include = {
        prevState: true,
        nextState: false,
        changedState: true,
    }, rateLimiterRefillRate = 1, rateLimiterBucketSize = 10, __stateComparisonDepth, } = config;
    const rateLimiter = new BucketedRateLimiter({
        refillRate: rateLimiterRefillRate,
        bucketSize: rateLimiterBucketSize,
        refillInterval: 1000, // one second in milliseconds,
        _logger: phConsoleLogger,
    });
    return (store) => (next) => (action) => {
        const typedAction = action;
        // Get the state before the action
        const prevState = store.getState();
        // Track execution time
        // eslint-disable-next-line compat/compat
        const startTime = performance.now();
        const result = next(typedAction);
        // eslint-disable-next-line compat/compat
        const endTime = performance.now();
        const executionTimeMs = endTime - startTime;
        // Get the state after the action
        const nextState = store.getState();
        const maskedAction = maskAction ? maskAction(typedAction) : typedAction;
        if (!maskedAction) {
            return result;
        }
        const isRateLimited = rateLimiter.consumeRateLimit(typedAction.type);
        if (isRateLimited) {
            debouncedActionRateLimitedLogger.info(typedAction.type);
        }
        else {
            // Apply masking to states
            try {
                const maskedPrevState = maskState ? maskState(prevState, maskedAction) : prevState;
                const maskedNextState = maskState ? maskState(nextState, maskedAction) : nextState;
                const changedState = include.changedState
                    ? getChangedState(maskedPrevState, maskedNextState, __stateComparisonDepth !== null && __stateComparisonDepth !== void 0 ? __stateComparisonDepth : 5)
                    : undefined;
                const { type, ...actionData } = maskedAction;
                const reduxEvent = {
                    type,
                    payload: actionData,
                    timestamp: Date.now(),
                    executionTimeMs,
                    prevState: include.prevState ? maskedPrevState : undefined,
                    nextState: include.nextState ? maskedNextState : undefined,
                    changedState: include.changedState ? changedState : undefined,
                };
                const title = titleFunction(reduxEvent);
                logger(title, reduxEvent);
            }
            catch (e) {
                // logging should never throw errors and break someone's app
                phConsoleLogger.error('Error logging state:', e);
            }
        }
        return result;
    };
}
