"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrimitiveCoercer = void 0;
const utils_1 = require("@/utils");
class PrimitiveCoercer {
    match(candidate) {
        return (0, utils_1.isPrimitive)(candidate);
    }
    coerce(value, ctx) {
        var _a;
        return {
            type: 'Error',
            value: `Primitive value captured as exception: ${String(value)}`,
            stack: (_a = ctx.syntheticException) === null || _a === void 0 ? void 0 : _a.stack,
            synthetic: true,
        };
    }
}
exports.PrimitiveCoercer = PrimitiveCoercer;
//# sourceMappingURL=primitive-coercer.js.map