"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringCoercer = void 0;
const ERROR_TYPES_PATTERN = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/i;
class StringCoercer {
    match(input) {
        return typeof input === 'string';
    }
    coerce(input, ctx) {
        var _a;
        const [type, value] = this.getInfos(input);
        return {
            type: type !== null && type !== void 0 ? type : 'Error',
            value: value !== null && value !== void 0 ? value : input,
            stack: (_a = ctx.syntheticException) === null || _a === void 0 ? void 0 : _a.stack,
            synthetic: true,
        };
    }
    getInfos(candidate) {
        let type = 'Error';
        let value = candidate;
        const groups = candidate.match(ERROR_TYPES_PATTERN);
        if (groups) {
            type = groups[1];
            value = groups[2];
        }
        return [type, value];
    }
}
exports.StringCoercer = StringCoercer;
//# sourceMappingURL=string-coercer.js.map