import { SURVEYS_ACTIVATED } from '../constants';
import { SurveyEventName } from '../posthog-surveys-types';
import { ActionMatcher } from '../extensions/surveys/action-matcher';
import { SURVEY_LOGGER as logger } from './survey-utils';
import { propertyComparisons } from './property-utils';
import { isNull, isUndefined } from '@agrid/core';
export class SurveyEventReceiver {
    constructor(instance) {
        this._instance = instance;
        this._eventToSurveys = new Map();
        this._actionToSurveys = new Map();
    }
    register(surveys) {
        var _a;
        if (isUndefined((_a = this._instance) === null || _a === void 0 ? void 0 : _a._addCaptureHook)) {
            return;
        }
        this._setupEventBasedSurveys(surveys);
        this._setupActionBasedSurveys(surveys);
    }
    _setupActionBasedSurveys(surveys) {
        const actionBasedSurveys = surveys.filter((survey) => { var _a, _b, _c, _d; return ((_a = survey.conditions) === null || _a === void 0 ? void 0 : _a.actions) && ((_d = (_c = (_b = survey.conditions) === null || _b === void 0 ? void 0 : _b.actions) === null || _c === void 0 ? void 0 : _c.values) === null || _d === void 0 ? void 0 : _d.length) > 0; });
        if (actionBasedSurveys.length === 0) {
            return;
        }
        if (this._actionMatcher == null) {
            this._actionMatcher = new ActionMatcher(this._instance);
            this._actionMatcher.init();
            // match any actions to its corresponding survey.
            const matchActionToSurvey = (actionName) => {
                this.onAction(actionName);
            };
            this._actionMatcher._addActionHook(matchActionToSurvey);
        }
        actionBasedSurveys.forEach((survey) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            if (survey.conditions &&
                ((_a = survey.conditions) === null || _a === void 0 ? void 0 : _a.actions) &&
                ((_c = (_b = survey.conditions) === null || _b === void 0 ? void 0 : _b.actions) === null || _c === void 0 ? void 0 : _c.values) &&
                ((_f = (_e = (_d = survey.conditions) === null || _d === void 0 ? void 0 : _d.actions) === null || _e === void 0 ? void 0 : _e.values) === null || _f === void 0 ? void 0 : _f.length) > 0) {
                // register the known set of actions with
                // the action-matcher so it can match
                // events to actions
                (_g = this._actionMatcher) === null || _g === void 0 ? void 0 : _g.register(survey.conditions.actions.values);
                // maintain a mapping of (Action1) => [Survey1, Survey2, Survey3]
                // where Surveys 1-3 are all activated by Action1
                (_k = (_j = (_h = survey.conditions) === null || _h === void 0 ? void 0 : _h.actions) === null || _j === void 0 ? void 0 : _j.values) === null || _k === void 0 ? void 0 : _k.forEach((action) => {
                    if (action && action.name) {
                        const knownSurveys = this._actionToSurveys.get(action.name);
                        if (knownSurveys) {
                            knownSurveys.push(survey.id);
                        }
                        this._actionToSurveys.set(action.name, knownSurveys || [survey.id]);
                    }
                });
            }
        });
    }
    _setupEventBasedSurveys(surveys) {
        var _a;
        const eventBasedSurveys = surveys.filter((survey) => { var _a, _b, _c, _d; return ((_a = survey.conditions) === null || _a === void 0 ? void 0 : _a.events) && ((_d = (_c = (_b = survey.conditions) === null || _b === void 0 ? void 0 : _b.events) === null || _c === void 0 ? void 0 : _c.values) === null || _d === void 0 ? void 0 : _d.length) > 0; });
        if (eventBasedSurveys.length === 0) {
            return;
        }
        // match any events to its corresponding survey.
        const matchEventToSurvey = (eventName, eventPayload) => {
            this.onEvent(eventName, eventPayload);
        };
        (_a = this._instance) === null || _a === void 0 ? void 0 : _a._addCaptureHook(matchEventToSurvey);
        surveys.forEach((survey) => {
            var _a, _b, _c;
            // maintain a mapping of (Event1) => [Survey1, Survey2, Survey3]
            // where Surveys 1-3 are all activated by Event1
            (_c = (_b = (_a = survey.conditions) === null || _a === void 0 ? void 0 : _a.events) === null || _b === void 0 ? void 0 : _b.values) === null || _c === void 0 ? void 0 : _c.forEach((event) => {
                if (event && event.name) {
                    const knownSurveys = this._eventToSurveys.get(event.name);
                    if (knownSurveys) {
                        knownSurveys.push(survey.id);
                    }
                    this._eventToSurveys.set(event.name, knownSurveys || [survey.id]);
                }
            });
        });
    }
    onEvent(event, eventPayload) {
        var _a, _b, _c, _d;
        const existingActivatedSurveys = ((_b = (_a = this._instance) === null || _a === void 0 ? void 0 : _a.persistence) === null || _b === void 0 ? void 0 : _b.props[SURVEYS_ACTIVATED]) || [];
        if (SurveyEventName.SHOWN === event && eventPayload && existingActivatedSurveys.length > 0) {
            // remove survey that from activatedSurveys here.
            logger.info('survey event matched, removing survey from activated surveys', {
                event,
                eventPayload,
                existingActivatedSurveys,
            });
            const surveyId = (_c = eventPayload === null || eventPayload === void 0 ? void 0 : eventPayload.properties) === null || _c === void 0 ? void 0 : _c.$survey_id;
            if (surveyId) {
                const index = existingActivatedSurveys.indexOf(surveyId);
                if (index >= 0) {
                    existingActivatedSurveys.splice(index, 1);
                    this._updateActivatedSurveys(existingActivatedSurveys);
                }
            }
            return;
        }
        // if the event is not in the eventToSurveys map, nothing else to do
        if (!this._eventToSurveys.has(event)) {
            return;
        }
        logger.info('survey event name matched', {
            event,
            eventPayload,
            surveys: this._eventToSurveys.get(event),
        });
        let surveysToCheck = [];
        (_d = this._instance) === null || _d === void 0 ? void 0 : _d.getSurveys((surveys) => {
            surveysToCheck = surveys.filter((survey) => { var _a; return (_a = this._eventToSurveys.get(event)) === null || _a === void 0 ? void 0 : _a.includes(survey.id); });
        });
        const matchedSurveys = surveysToCheck.filter((survey) => {
            var _a, _b, _c;
            // first, we get the correct event to check
            const eventToCheck = (_c = (_b = (_a = survey.conditions) === null || _a === void 0 ? void 0 : _a.events) === null || _b === void 0 ? void 0 : _b.values) === null || _c === void 0 ? void 0 : _c.find((e) => e.name === event);
            if (!eventToCheck) {
                return false;
            }
            // if there are no property filters, it means we're only matching on event name
            if (!eventToCheck.propertyFilters) {
                return true;
            }
            return Object.entries(eventToCheck.propertyFilters).every(([propertyName, filter]) => {
                var _a;
                const eventPropertyValue = (_a = eventPayload === null || eventPayload === void 0 ? void 0 : eventPayload.properties) === null || _a === void 0 ? void 0 : _a[propertyName];
                if (isUndefined(eventPropertyValue) || isNull(eventPropertyValue)) {
                    return false;
                }
                // convert event property to string for comparison
                const eventValues = [String(eventPropertyValue)];
                const comparisonFunction = propertyComparisons[filter.operator];
                if (!comparisonFunction) {
                    logger.warn(`Unknown property comparison operator: ${filter.operator}`);
                    return false;
                }
                return comparisonFunction(filter.values, eventValues);
            });
        });
        this._updateActivatedSurveys(existingActivatedSurveys.concat(matchedSurveys.map((survey) => survey.id) || []));
    }
    onAction(actionName) {
        var _a, _b;
        const existingActivatedSurveys = ((_b = (_a = this._instance) === null || _a === void 0 ? void 0 : _a.persistence) === null || _b === void 0 ? void 0 : _b.props[SURVEYS_ACTIVATED]) || [];
        if (this._actionToSurveys.has(actionName)) {
            this._updateActivatedSurveys(existingActivatedSurveys.concat(this._actionToSurveys.get(actionName) || []));
        }
    }
    _updateActivatedSurveys(activatedSurveys) {
        var _a, _b;
        // we use a new Set here to remove duplicates.
        logger.info('updating activated surveys', {
            activatedSurveys,
        });
        (_b = (_a = this._instance) === null || _a === void 0 ? void 0 : _a.persistence) === null || _b === void 0 ? void 0 : _b.register({
            [SURVEYS_ACTIVATED]: [...new Set(activatedSurveys)],
        });
    }
    getSurveys() {
        var _a, _b;
        const existingActivatedSurveys = (_b = (_a = this._instance) === null || _a === void 0 ? void 0 : _a.persistence) === null || _b === void 0 ? void 0 : _b.props[SURVEYS_ACTIVATED];
        return existingActivatedSurveys ? existingActivatedSurveys : [];
    }
    getEventToSurveys() {
        return this._eventToSurveys;
    }
    _getActionMatcher() {
        return this._actionMatcher;
    }
}
