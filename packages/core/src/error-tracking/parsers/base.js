import { isUndefined } from '@/utils';
export const UNKNOWN_FUNCTION = '?';
export function createFrame(filename, func, lineno, colno) {
    const frame = {
        // TODO: should be a variable here
        platform: 'web:javascript',
        filename,
        function: func === '<anonymous>' ? UNKNOWN_FUNCTION : func,
        in_app: true, // All browser frames are considered in_app
    };
    if (!isUndefined(lineno)) {
        frame.lineno = lineno;
    }
    if (!isUndefined(colno)) {
        frame.colno = colno;
    }
    return frame;
}
