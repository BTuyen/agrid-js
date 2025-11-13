import { isArray } from '@/utils';
import { getFilenameToChunkIdMap } from './chunk-ids';
import { createStackParser } from './parsers';
const MAX_CAUSE_RECURSION = 4;
export class ErrorPropertiesBuilder {
    coercers;
    modifiers;
    stackParser;
    constructor(coercers = [], parsers = [], modifiers = []) {
        this.coercers = coercers;
        this.modifiers = modifiers;
        this.stackParser = createStackParser(...parsers);
    }
    buildFromUnknown(input, hint = {}) {
        const providedMechanism = hint && hint.mechanism;
        const mechanism = providedMechanism || {
            handled: true,
            type: 'generic',
        };
        const coercingContext = this.buildCoercingContext(mechanism, hint, 0);
        const exceptionWithCause = coercingContext.apply(input);
        const parsingContext = this.buildParsingContext();
        const exceptionWithStack = this.parseStacktrace(exceptionWithCause, parsingContext);
        const exceptionList = this.convertToExceptionList(exceptionWithStack, mechanism);
        return {
            $exception_list: exceptionList,
            $exception_level: 'error',
        };
    }
    async modifyFrames(exceptionList) {
        for (const exc of exceptionList) {
            if (exc.stacktrace && exc.stacktrace.frames && isArray(exc.stacktrace.frames)) {
                exc.stacktrace.frames = await this.applyModifiers(exc.stacktrace.frames);
            }
        }
        return exceptionList;
    }
    coerceFallback(ctx) {
        return {
            type: 'Error',
            value: 'Unknown error',
            stack: ctx.syntheticException?.stack,
            synthetic: true,
        };
    }
    parseStacktrace(err, ctx) {
        let cause = undefined;
        if (err.cause != null) {
            cause = this.parseStacktrace(err.cause, ctx);
        }
        let stack = undefined;
        if (err.stack != '' && err.stack != null) {
            stack = this.applyChunkIds(this.stackParser(err.stack, err.synthetic ? 1 : 0), ctx.chunkIdMap);
        }
        return { ...err, cause, stack };
    }
    applyChunkIds(frames, chunkIdMap) {
        return frames.map((frame) => {
            if (frame.filename && chunkIdMap) {
                frame.chunk_id = chunkIdMap[frame.filename];
            }
            return frame;
        });
    }
    applyCoercers(input, ctx) {
        for (const adapter of this.coercers) {
            if (adapter.match(input)) {
                return adapter.coerce(input, ctx);
            }
        }
        return this.coerceFallback(ctx);
    }
    async applyModifiers(frames) {
        let newFrames = frames;
        for (const modifier of this.modifiers) {
            newFrames = await modifier(newFrames);
        }
        return newFrames;
    }
    convertToExceptionList(exceptionWithStack, mechanism) {
        const currentException = {
            type: exceptionWithStack.type,
            value: exceptionWithStack.value,
            mechanism: {
                type: mechanism.type ?? 'generic',
                handled: mechanism.handled ?? true,
                synthetic: exceptionWithStack.synthetic ?? false,
            },
        };
        if (exceptionWithStack.stack) {
            currentException.stacktrace = {
                type: 'raw',
                frames: exceptionWithStack.stack,
            };
        }
        const exceptionList = [currentException];
        if (exceptionWithStack.cause != null) {
            // Cause errors are necessarily handled
            exceptionList.push(...this.convertToExceptionList(exceptionWithStack.cause, {
                ...mechanism,
                handled: true,
            }));
        }
        return exceptionList;
    }
    buildParsingContext() {
        const context = {
            chunkIdMap: getFilenameToChunkIdMap(this.stackParser),
        };
        return context;
    }
    buildCoercingContext(mechanism, hint, depth = 0) {
        const coerce = (input, depth) => {
            if (depth <= MAX_CAUSE_RECURSION) {
                const ctx = this.buildCoercingContext(mechanism, hint, depth);
                return this.applyCoercers(input, ctx);
            }
            else {
                return undefined;
            }
        };
        const context = {
            ...hint,
            // Do not propagate synthetic exception as it doesn't make sense
            syntheticException: depth == 0 ? hint.syntheticException : undefined,
            mechanism,
            apply: (input) => {
                return coerce(input, depth);
            },
            next: (input) => {
                return coerce(input, depth + 1);
            },
        };
        return context;
    }
}
