// Copied from: https://github.com/keajs/kea-test-utils/blob/master/src/jest.ts
export class AsymmetricMatcher {
    constructor(sample) {
        this.$$typeof = Symbol.for('jest.asymmetricMatcher');
        this.sample = sample;
    }
}
class Truth extends AsymmetricMatcher {
    constructor(sample, inverse = false) {
        if (typeof sample !== 'function') {
            throw new Error('Expected is not a function');
        }
        super(sample);
        this.inverse = inverse;
    }
    asymmetricMatch(other) {
        const result = this.sample(other);
        return this.inverse ? !result : result;
    }
    toString() {
        return `${this.inverse ? 'Not' : ''}Truth`;
    }
    toAsymmetricMatcher() {
        return `Truth<${this.sample}>`;
    }
}
export const truth = (sample) => new Truth(sample);
