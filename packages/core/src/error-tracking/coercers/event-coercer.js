"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCoercer = void 0;
const utils_1 = require("@/utils");
const utils_2 = require("./utils");
class EventCoercer {
    match(err) {
        return (0, utils_1.isEvent)(err);
    }
    coerce(evt, ctx) {
        var _a;
        const constructorName = evt.constructor.name;
        return {
            type: constructorName,
            value: `${constructorName} captured as exception with keys: ${(0, utils_2.extractExceptionKeysForMessage)(evt)}`,
            stack: (_a = ctx.syntheticException) === null || _a === void 0 ? void 0 : _a.stack,
            synthetic: true,
        };
    }
}
exports.EventCoercer = EventCoercer;
//# sourceMappingURL=event-coercer.js.map