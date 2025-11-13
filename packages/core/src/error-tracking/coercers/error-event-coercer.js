import { isErrorEvent } from '@/utils';
export class ErrorEventCoercer {
    constructor() { }
    match(err) {
        return isErrorEvent(err) && err.error != undefined;
    }
    coerce(err, ctx) {
        const exceptionLike = ctx.apply(err.error);
        if (!exceptionLike) {
            return {
                type: 'ErrorEvent',
                value: err.message,
                stack: ctx.syntheticException?.stack,
                synthetic: true,
            };
        }
        else {
            return exceptionLike;
        }
    }
}
