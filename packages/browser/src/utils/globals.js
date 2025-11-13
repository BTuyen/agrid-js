/*
 * Global helpers to protect access to browser globals in a way that is safer for different targets
 * like DOM, SSR, Web workers etc.
 *
 * NOTE: Typically we want the "window" but globalThis works for both the typical browser context as
 * well as other contexts such as the web worker context. Window is still exported for any bits that explicitly require it.
 * If in doubt - export the global you need from this file and use that as an optional value. This way the code path is forced
 * to handle the case where the global is not available.
 */
// eslint-disable-next-line no-restricted-globals
const win = typeof window !== 'undefined' ? window : undefined;
const global = typeof globalThis !== 'undefined' ? globalThis : win;
export const ArrayProto = Array.prototype;
export const nativeForEach = ArrayProto.forEach;
export const nativeIndexOf = ArrayProto.indexOf;
export const navigator = global === null || global === void 0 ? void 0 : global.navigator;
export const document = global === null || global === void 0 ? void 0 : global.document;
export const location = global === null || global === void 0 ? void 0 : global.location;
export const fetch = global === null || global === void 0 ? void 0 : global.fetch;
export const XMLHttpRequest = (global === null || global === void 0 ? void 0 : global.XMLHttpRequest) && 'withCredentials' in new global.XMLHttpRequest() ? global.XMLHttpRequest : undefined;
export const AbortController = global === null || global === void 0 ? void 0 : global.AbortController;
export const userAgent = navigator === null || navigator === void 0 ? void 0 : navigator.userAgent;
export const assignableWindow = win !== null && win !== void 0 ? win : {};
export { win as window };
