import { isEmptyString, isError, isEvent, isString } from '@/utils';
import { severityLevels } from '../types';
import { extractExceptionKeysForMessage } from './utils';
export class ObjectCoercer {
    match(candidate) {
        return typeof candidate === 'object' && candidate !== null;
    }
    coerce(candidate, ctx) {
        const errorProperty = this.getErrorPropertyFromObject(candidate);
        if (errorProperty) {
            return ctx.apply(errorProperty);
        }
        else {
            return {
                type: this.getType(candidate),
                value: this.getValue(candidate),
                stack: ctx.syntheticException?.stack,
                level: this.isSeverityLevel(candidate.level) ? candidate.level : 'error',
                synthetic: true,
            };
        }
    }
    getType(err) {
        return isEvent(err) ? err.constructor.name : 'Error';
    }
    getValue(err) {
        if ('name' in err && typeof err.name === 'string') {
            let message = `'${err.name}' captured as exception`;
            if ('message' in err && typeof err.message === 'string') {
                message += ` with message: '${err.message}'`;
            }
            return message;
        }
        else if ('message' in err && typeof err.message === 'string') {
            return err.message;
        }
        const className = this.getObjectClassName(err);
        const keys = extractExceptionKeysForMessage(err);
        return `${className && className !== 'Object' ? `'${className}'` : 'Object'} captured as exception with keys: ${keys}`;
    }
    isSeverityLevel(x) {
        return isString(x) && !isEmptyString(x) && severityLevels.indexOf(x) >= 0;
    }
    /** If a plain object has a property that is an `Error`, return this error. */
    getErrorPropertyFromObject(obj) {
        for (const prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                const value = obj[prop];
                if (isError(value)) {
                    return value;
                }
            }
        }
        return undefined;
    }
    getObjectClassName(obj) {
        try {
            const prototype = Object.getPrototypeOf(obj);
            return prototype ? prototype.constructor.name : undefined;
        }
        catch (e) {
            return undefined;
        }
    }
}
