"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringCoercer = void 0;
var ERROR_TYPES_PATTERN = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/i;
var StringCoercer = /** @class */ (function () {
    function StringCoercer() {
    }
    StringCoercer.prototype.match = function (input) {
        return typeof input === 'string';
    };
    StringCoercer.prototype.coerce = function (input, ctx) {
        var _a;
        var _b = __read(this.getInfos(input), 2), type = _b[0], value = _b[1];
        return {
            type: type !== null && type !== void 0 ? type : 'Error',
            value: value !== null && value !== void 0 ? value : input,
            stack: (_a = ctx.syntheticException) === null || _a === void 0 ? void 0 : _a.stack,
            synthetic: true,
        };
    };
    StringCoercer.prototype.getInfos = function (candidate) {
        var type = 'Error';
        var value = candidate;
        var groups = candidate.match(ERROR_TYPES_PATTERN);
        if (groups) {
            type = groups[1];
            value = groups[2];
        }
        return [type, value];
    };
    return StringCoercer;
}());
exports.StringCoercer = StringCoercer;
//# sourceMappingURL=string-coercer.js.map