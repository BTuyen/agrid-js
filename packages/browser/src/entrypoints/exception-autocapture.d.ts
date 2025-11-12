import type { ErrorTracking } from '@agrid/core';
declare const posthogErrorWrappingFunctions: {
    wrapOnError: (captureFn: (props: ErrorTracking.ErrorProperties) => void) => () => void;
    wrapUnhandledRejection: (captureFn: (props: ErrorTracking.ErrorProperties) => void) => () => void;
    wrapConsoleError: (captureFn: (props: ErrorTracking.ErrorProperties) => void) => () => void;
};
export default posthogErrorWrappingFunctions;
