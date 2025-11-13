import { CAPTURE_RATE_LIMIT } from './constants';
import { createLogger } from './utils/logger';
const logger = createLogger('[RateLimiter]');
const ONE_MINUTE_IN_MILLISECONDS = 60 * 1000;
const RATE_LIMIT_EVENT = '$$client_ingestion_warning';
export class RateLimiter {
    constructor(instance) {
        var _a, _b;
        this.serverLimits = {};
        this.lastEventRateLimited = false;
        this.checkForLimiting = (httpResponse) => {
            const text = httpResponse.text;
            if (!text || !text.length) {
                return;
            }
            try {
                const response = JSON.parse(text);
                const quotaLimitedProducts = response.quota_limited || [];
                quotaLimitedProducts.forEach((batchKey) => {
                    logger.info(`${batchKey || 'events'} is quota limited.`);
                    this.serverLimits[batchKey] = new Date().getTime() + ONE_MINUTE_IN_MILLISECONDS;
                });
            }
            catch (e) {
                logger.warn(`could not rate limit - continuing. Error: "${e === null || e === void 0 ? void 0 : e.message}"`, { text });
                return;
            }
        };
        this.instance = instance;
        this.captureEventsPerSecond = ((_a = instance.config.rate_limiting) === null || _a === void 0 ? void 0 : _a.events_per_second) || 10;
        this.captureEventsBurstLimit = Math.max(((_b = instance.config.rate_limiting) === null || _b === void 0 ? void 0 : _b.events_burst_limit) || this.captureEventsPerSecond * 10, this.captureEventsPerSecond);
        this.lastEventRateLimited = this.clientRateLimitContext(true).isRateLimited;
    }
    clientRateLimitContext(checkOnly = false) {
        var _a, _b, _c;
        // This is primarily to prevent runaway loops from flooding capture with millions of events for a single user.
        // It's as much for our protection as theirs.
        const now = new Date().getTime();
        const bucket = (_b = (_a = this.instance.persistence) === null || _a === void 0 ? void 0 : _a.get_property(CAPTURE_RATE_LIMIT)) !== null && _b !== void 0 ? _b : {
            tokens: this.captureEventsBurstLimit,
            last: now,
        };
        bucket.tokens += ((now - bucket.last) / 1000) * this.captureEventsPerSecond;
        bucket.last = now;
        if (bucket.tokens > this.captureEventsBurstLimit) {
            bucket.tokens = this.captureEventsBurstLimit;
        }
        const isRateLimited = bucket.tokens < 1;
        if (!isRateLimited && !checkOnly) {
            bucket.tokens = Math.max(0, bucket.tokens - 1);
        }
        if (isRateLimited && !this.lastEventRateLimited && !checkOnly) {
            this.instance.capture(RATE_LIMIT_EVENT, {
                $$client_ingestion_warning_message: `posthog-js client rate limited. Config is set to ${this.captureEventsPerSecond} events per second and ${this.captureEventsBurstLimit} events burst limit.`,
            }, {
                skip_client_rate_limiting: true,
            });
        }
        this.lastEventRateLimited = isRateLimited;
        (_c = this.instance.persistence) === null || _c === void 0 ? void 0 : _c.set_property(CAPTURE_RATE_LIMIT, bucket);
        return {
            isRateLimited,
            remainingTokens: bucket.tokens,
        };
    }
    isServerRateLimited(batchKey) {
        const retryAfter = this.serverLimits[batchKey || 'events'] || false;
        if (retryAfter === false) {
            return false;
        }
        return new Date().getTime() < retryAfter;
    }
}
