import { createLogger } from '../utils/logger';
import { USER_STATE } from '../constants';
import { isFunction } from '@agrid/core';
import { uuidv7 } from '../uuidv7';
const logger = createLogger('[SegmentIntegration]');
const createSegmentIntegration = (posthog) => {
    if (!Promise || !Promise.resolve) {
        logger.warn('This browser does not have Promise support, and can not use the segment integration');
    }
    const enrichEvent = (ctx, eventName) => {
        if (!eventName) {
            return ctx;
        }
        if (!ctx.event.userId && ctx.event.anonymousId !== posthog.get_distinct_id()) {
            // This is our only way of detecting that segment's analytics.reset() has been called so we also call it
            logger.info('No userId set, resetting PostHog');
            posthog.reset();
        }
        if (ctx.event.userId && ctx.event.userId !== posthog.get_distinct_id()) {
            logger.info('UserId set, identifying with PostHog');
            posthog.identify(ctx.event.userId);
        }
        const additionalProperties = posthog.calculateEventProperties(eventName, ctx.event.properties);
        ctx.event.properties = Object.assign({}, additionalProperties, ctx.event.properties);
        return ctx;
    };
    return {
        name: 'PostHog JS',
        type: 'enrichment',
        version: '1.0.0',
        isLoaded: () => true,
        // check and early return above
        // eslint-disable-next-line compat/compat
        load: () => Promise.resolve(),
        track: (ctx) => enrichEvent(ctx, ctx.event.event),
        page: (ctx) => enrichEvent(ctx, '$pageview'),
        identify: (ctx) => enrichEvent(ctx, '$identify'),
        screen: (ctx) => enrichEvent(ctx, '$screen'),
    };
};
function setupPostHogFromSegment(posthog, done) {
    const segment = posthog.config.segment;
    if (!segment) {
        return done();
    }
    const bootstrapUser = (user) => {
        // Use segments anonymousId instead
        const getSegmentAnonymousId = () => user.anonymousId() || uuidv7();
        posthog.config.get_device_id = getSegmentAnonymousId;
        // If a segment user ID exists, set it as the distinct_id
        if (user.id()) {
            posthog.register({
                distinct_id: user.id(),
                $device_id: getSegmentAnonymousId(),
            });
            posthog.persistence.set_property(USER_STATE, 'identified');
        }
        done();
    };
    const segmentUser = segment.user();
    // If segmentUser is a promise then we need to wait for it to resolve
    if ('then' in segmentUser && isFunction(segmentUser.then)) {
        segmentUser.then((user) => bootstrapUser(user));
    }
    else {
        bootstrapUser(segmentUser);
    }
}
export function setupSegmentIntegration(posthog, done) {
    const segment = posthog.config.segment;
    if (!segment) {
        return done();
    }
    setupPostHogFromSegment(posthog, () => {
        segment.register(createSegmentIntegration(posthog)).then(() => {
            done();
        });
    });
}
