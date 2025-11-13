/**
 * Integrate Sentry with PostHog. This will add a direct link to the person in Sentry, and an $exception event in PostHog
 *
 * ### Usage
 *
 *     Sentry.init({
 *          dsn: 'https://example',
 *          integrations: [
 *              new posthog.SentryIntegration(posthog)
 *          ]
 *     })
 *
 * @param {Object} [posthog] The posthog object
 * @param {string} [organization] Optional: The Sentry organization, used to send a direct link from PostHog to Sentry
 * @param {Number} [projectId] Optional: The Sentry project id, used to send a direct link from PostHog to Sentry
 * @param {string} [prefix] Optional: Url of a self-hosted sentry instance (default: https://sentry.io/organizations/)
 * @param {SeverityLevel[] | '*'} [severityAllowList] Optional: send events matching the provided levels. Use '*' to send all events (default: ['error'])
 * @param {boolean} [sendExceptionsToPostHog] Optional: capture exceptions as events in PostHog (default: true)
 */
const NAME = 'posthog-js';
export function createEventProcessor(_posthog, { organization, projectId, prefix, severityAllowList = ['error'], sendExceptionsToPostHog = true, } = {}) {
    return (event) => {
        var _a, _b, _c, _d, _e;
        const shouldProcessLevel = severityAllowList === '*' || severityAllowList.includes(event.level);
        if (!shouldProcessLevel || !_posthog.__loaded)
            return event;
        if (!event.tags)
            event.tags = {};
        const personUrl = _posthog.requestRouter.endpointFor('ui', `/project/${_posthog.config.token}/person/${_posthog.get_distinct_id()}`);
        event.tags['PostHog Person URL'] = personUrl;
        if (_posthog.sessionRecordingStarted()) {
            event.tags['PostHog Recording URL'] = _posthog.get_session_replay_url({ withTimestamp: true });
        }
        const exceptions = ((_a = event.exception) === null || _a === void 0 ? void 0 : _a.values) || [];
        const exceptionList = exceptions.map((exception) => {
            return {
                ...exception,
                stacktrace: exception.stacktrace
                    ? {
                        ...exception.stacktrace,
                        type: 'raw',
                        frames: (exception.stacktrace.frames || []).map((frame) => {
                            return { ...frame, platform: 'web:javascript' };
                        }),
                    }
                    : undefined,
            };
        });
        const data = {
            // PostHog Exception Properties,
            $exception_message: ((_b = exceptions[0]) === null || _b === void 0 ? void 0 : _b.value) || event.message,
            $exception_type: (_c = exceptions[0]) === null || _c === void 0 ? void 0 : _c.type,
            $exception_level: event.level,
            $exception_list: exceptionList,
            // Sentry Exception Properties
            $sentry_event_id: event.event_id,
            $sentry_exception: event.exception,
            $sentry_exception_message: ((_d = exceptions[0]) === null || _d === void 0 ? void 0 : _d.value) || event.message,
            $sentry_exception_type: (_e = exceptions[0]) === null || _e === void 0 ? void 0 : _e.type,
            $sentry_tags: event.tags,
        };
        if (organization && projectId) {
            data['$sentry_url'] =
                (prefix || 'https://sentry.io/organizations/') +
                    organization +
                    '/issues/?project=' +
                    projectId +
                    '&query=' +
                    event.event_id;
        }
        if (sendExceptionsToPostHog) {
            _posthog.exceptions.sendExceptionEvent(data);
        }
        return event;
    };
}
// V8 integration - function based
export function sentryIntegration(_posthog, options) {
    const processor = createEventProcessor(_posthog, options);
    return {
        name: NAME,
        processEvent(event) {
            return processor(event);
        },
    };
}
// V7 integration - class based
export class SentryIntegration {
    constructor(_posthog, organization, projectId, prefix, severityAllowList, sendExceptionsToPostHog) {
        // setupOnce gets called by Sentry when it intializes the plugin
        this.name = NAME;
        this.setupOnce = function (addGlobalEventProcessor) {
            addGlobalEventProcessor(createEventProcessor(_posthog, {
                organization,
                projectId,
                prefix,
                severityAllowList,
                sendExceptionsToPostHog: sendExceptionsToPostHog !== null && sendExceptionsToPostHog !== void 0 ? sendExceptionsToPostHog : true,
            }));
        };
    }
}
