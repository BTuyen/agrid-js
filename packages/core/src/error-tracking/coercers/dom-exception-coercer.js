import { isBuiltin, isString } from '@/utils';
export class DOMExceptionCoercer {
    match(err) {
        return this.isDOMException(err) || this.isDOMError(err);
    }
    coerce(err, ctx) {
        const hasStack = isString(err.stack);
        return {
            type: this.getType(err),
            value: this.getValue(err),
            stack: hasStack ? err.stack : undefined,
            cause: err.cause ? ctx.next(err.cause) : undefined,
            synthetic: false,
        };
    }
    getType(candidate) {
        return this.isDOMError(candidate) ? 'DOMError' : 'DOMException';
    }
    getValue(err) {
        const name = err.name || (this.isDOMError(err) ? 'DOMError' : 'DOMException');
        const message = err.message ? `${name}: ${err.message}` : name;
        return message;
    }
    isDOMException(err) {
        return isBuiltin(err, 'DOMException');
    }
    isDOMError(err) {
        return isBuiltin(err, 'DOMError');
    }
}
