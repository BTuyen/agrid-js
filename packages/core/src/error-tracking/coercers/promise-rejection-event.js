"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseRejectionEventCoercer = void 0;
const utils_1 = require("@/utils");
// Web only
class PromiseRejectionEventCoercer {
    match(err) {
        return (0, utils_1.isBuiltin)(err, 'PromiseRejectionEvent');
    }
    coerce(err, ctx) {
        var _a;
        const reason = this.getUnhandledRejectionReason(err);
        if ((0, utils_1.isPrimitive)(reason)) {
            return {
                type: 'UnhandledRejection',
                value: `Non-Error promise rejection captured with value: ${String(reason)}`,
                stack: (_a = ctx.syntheticException) === null || _a === void 0 ? void 0 : _a.stack,
                synthetic: true,
            };
        }
        else {
            return ctx.apply(reason);
        }
    }
    getUnhandledRejectionReason(error) {
        if ((0, utils_1.isPrimitive)(error)) {
            return error;
        }
        // dig the object of the rejection out of known event types
        try {
            // PromiseRejectionEvents store the object of the rejection under 'reason'
            // see https://developer.mozilla.org/en-US/docs/Web/API/PromiseRejectionEvent
            if ('reason' in error) {
                return error.reason;
            }
            // something, somewhere, (likely a browser extension) effectively casts PromiseRejectionEvents
            // to CustomEvents, moving the `promise` and `reason` attributes of the PRE into
            // the CustomEvent's `detail` attribute, since they're not part of CustomEvent's spec
            // see https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent and
            // https://github.com/getsentry/sentry-javascript/issues/2380
            if ('detail' in error && 'reason' in error.detail) {
                return error.detail.reason;
            }
        }
        catch {
            // no-empty
        }
        return error;
    }
}
exports.PromiseRejectionEventCoercer = PromiseRejectionEventCoercer;
//# sourceMappingURL=promise-rejection-event.js.map