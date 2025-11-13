import ts from 'typescript';
import path from 'path';
import { PostHog } from '../posthog-core';
import { isFunction } from '@agrid/core';
function extractTypeInfo(filePath, typeName) {
    const program = ts.createProgram([filePath], { noImgplicitAny: true, strictNullChecks: true });
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
        throw new Error(`File not found: ${filePath}`);
    }
    function getTypeString(type) {
        return checker.typeToString(type);
    }
    function processType(type) {
        var _a;
        // Early detect RegExp type and return its string representation
        // No need to recursively resolve it
        if (((_a = type.symbol) === null || _a === void 0 ? void 0 : _a.name) === 'RegExp') {
            return getTypeString(type);
        }
        if (type.isUnion() || type.isIntersection()) {
            return type.types.map(processType);
        }
        if (type.isClassOrInterface()) {
            const result = {};
            type.getProperties().forEach((symbol) => {
                const propType = checker.getTypeOfSymbol(symbol);
                result[symbol.getName()] = processType(propType);
            });
            return result;
        }
        return getTypeString(type);
    }
    let result = {};
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
            const type = checker.getTypeAtLocation(node);
            result = processType(type);
        }
    });
    return JSON.stringify(result, null, 2);
}
// This guarantees that the config types are stable and won't change
// or that, at least, we won't ever remove any options from the config
// and/or change the types of existing options.
describe('config', () => {
    describe('snapshot', () => {
        it('for PostHogConfig', () => {
            const typeInfo = extractTypeInfo(path.resolve(__dirname, '../types.ts'), 'PostHogConfig');
            expect(typeInfo).toMatchSnapshot();
        });
    });
    describe('compatibilityDate', () => {
        it('should set capture_pageview to true when defaults is undefined', () => {
            const posthog = new PostHog();
            posthog._init('test-token');
            expect(posthog.config.capture_pageview).toBe(true);
        });
        it('should set capture_pageview to history_change when defaults is 2025-05-24', () => {
            const posthog = new PostHog();
            posthog._init('test-token', { defaults: '2025-05-24' });
            expect(posthog.config.capture_pageview).toBe('history_change');
        });
        it('should preserve other default config values when setting defaults', () => {
            const posthog1 = new PostHog();
            posthog1._init('test-token');
            const config1 = { ...posthog1.config };
            const posthog2 = new PostHog();
            posthog2._init('test-token', { defaults: '2025-05-24' });
            const config2 = posthog2.config;
            // Check that all other config values remain the same
            const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);
            allKeys.forEach((key) => {
                if (!['capture_pageview', 'defaults'].includes(key)) {
                    const val1 = config1[key];
                    const val2 = config2[key];
                    if (isFunction(val1)) {
                        expect(isFunction(val2)).toBe(true);
                    }
                    else {
                        expect(val2).toEqual(val1);
                    }
                }
            });
        });
    });
});
