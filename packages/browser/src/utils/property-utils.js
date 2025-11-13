import { jsonStringify } from '../request';
import { isMatchingRegex } from './regex-utils';
export function getPersonPropertiesHash(distinct_id, userPropertiesToSet, userPropertiesToSetOnce) {
    return jsonStringify({ distinct_id, userPropertiesToSet, userPropertiesToSetOnce });
}
export const propertyComparisons = {
    exact: (targets, values) => values.some((value) => targets.some((target) => value === target)),
    is_not: (targets, values) => values.every((value) => targets.every((target) => value !== target)),
    regex: (targets, values) => values.some((value) => targets.some((target) => isMatchingRegex(value, target))),
    not_regex: (targets, values) => values.every((value) => targets.every((target) => !isMatchingRegex(value, target))),
    icontains: (targets, values) => values.map(toLowerCase).some((value) => targets.map(toLowerCase).some((target) => value.includes(target))),
    not_icontains: (targets, values) => values.map(toLowerCase).every((value) => targets.map(toLowerCase).every((target) => !value.includes(target))),
};
const toLowerCase = (v) => v.toLowerCase();
