export * from './bot-detection';
export * from './bucketed-rate-limiter';
export * from './number-utils';
export * from './string-utils';
export * from './type-utils';
export * from './promise-queue';
export const STRING_FORMAT = 'utf8';
export function assert(truthyValue, message) {
    if (!truthyValue || typeof truthyValue !== 'string' || isEmpty(truthyValue)) {
        throw new Error(message);
    }
}
function isEmpty(truthyValue) {
    if (truthyValue.trim().length === 0) {
        return true;
    }
    return false;
}
export function removeTrailingSlash(url) {
    return url?.replace(/\/+$/, '');
}
export async function retriable(fn, props) {
    let lastError = null;
    for (let i = 0; i < props.retryCount + 1; i++) {
        if (i > 0) {
            // don't wait when it's the last try
            await new Promise((r) => setTimeout(r, props.retryDelay));
        }
        try {
            const res = await fn();
            return res;
        }
        catch (e) {
            lastError = e;
            if (!props.retryCheck(e)) {
                throw e;
            }
        }
    }
    throw lastError;
}
export function currentTimestamp() {
    return new Date().getTime();
}
export function currentISOTime() {
    return new Date().toISOString();
}
export function safeSetTimeout(fn, timeout) {
    // NOTE: we use this so rarely that it is totally fine to do `safeSetTimeout(fn, 0)``
    // rather than setImmediate.
    const t = setTimeout(fn, timeout);
    // We unref if available to prevent Node.js hanging on exit
    t?.unref && t?.unref();
    return t;
}
// NOTE: We opt for this slightly imperfect check as the global "Promise" object can get mutated in certain environments
export const isPromise = (obj) => {
    return obj && typeof obj.then === 'function';
};
export const isError = (x) => {
    return x instanceof Error;
};
export function getFetch() {
    return typeof fetch !== 'undefined' ? fetch : typeof globalThis.fetch !== 'undefined' ? globalThis.fetch : undefined;
}
export function allSettled(promises) {
    return Promise.all(promises.map((p) => (p ?? Promise.resolve()).then((value) => ({ status: 'fulfilled', value }), (reason) => ({ status: 'rejected', reason }))));
}
