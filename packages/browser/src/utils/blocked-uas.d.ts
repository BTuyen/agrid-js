export { DEFAULT_BLOCKED_UA_STRS, isBlockedUA } from '@agrid/core';
export interface NavigatorUAData {
    brands?: {
        brand: string;
        version: string;
    }[];
}
declare global {
    interface Navigator {
        userAgentData?: NavigatorUAData;
    }
}
export declare const isLikelyBot: (navigator: Navigator | undefined, customBlockedUserAgents: string[]) => boolean;
