"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCoercer = void 0;
var utils_1 = require("@/utils");
var utils_2 = require("./utils");
var EventCoercer = /** @class */ (function () {
    function EventCoercer() {
    }
    EventCoercer.prototype.match = function (err) {
        return (0, utils_1.isEvent)(err);
    };
    EventCoercer.prototype.coerce = function (evt, ctx) {
        var _a;
        var constructorName = evt.constructor.name;
        return {
            type: constructorName,
            value: "".concat(constructorName, " captured as exception with keys: ").concat((0, utils_2.extractExceptionKeysForMessage)(evt)),
            stack: (_a = ctx.syntheticException) === null || _a === void 0 ? void 0 : _a.stack,
            synthetic: true,
        };
    };
    return EventCoercer;
}());
exports.EventCoercer = EventCoercer;
//# sourceMappingURL=event-coercer.js.map