export function truncate(str, max = 0) {
    if (typeof str !== 'string' || max === 0) {
        return str;
    }
    return str.length <= max ? str : `${str.slice(0, max)}...`;
}
/**
 * Given any captured exception, extract its keys and create a sorted
 * and truncated list that will be used inside the event message.
 * eg. `Non-error exception captured with keys: foo, bar, baz`
 */
export function extractExceptionKeysForMessage(err, maxLength = 40) {
    const keys = Object.keys(err);
    keys.sort();
    if (!keys.length) {
        return '[object has no keys]';
    }
    for (let i = keys.length; i > 0; i--) {
        const serialized = keys.slice(0, i).join(', ');
        if (serialized.length > maxLength) {
            continue;
        }
        if (i === keys.length) {
            return serialized;
        }
        return serialized.length <= maxLength ? serialized : `${serialized.slice(0, maxLength)}...`;
    }
    return '';
}
