"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrimitiveCoercer = void 0;
var utils_1 = require("@/utils");
var PrimitiveCoercer = /** @class */ (function () {
    function PrimitiveCoercer() {
    }
    PrimitiveCoercer.prototype.match = function (candidate) {
        return (0, utils_1.isPrimitive)(candidate);
    };
    PrimitiveCoercer.prototype.coerce = function (value, ctx) {
        var _a;
        return {
            type: 'Error',
            value: "Primitive value captured as exception: ".concat(String(value)),
            stack: (_a = ctx.syntheticException) === null || _a === void 0 ? void 0 : _a.stack,
            synthetic: true,
        };
    };
    return PrimitiveCoercer;
}());
exports.PrimitiveCoercer = PrimitiveCoercer;
//# sourceMappingURL=primitive-coercer.js.map