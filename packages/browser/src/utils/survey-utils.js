import { DisplaySurveyType, SurveyType } from '../posthog-surveys-types';
import { createLogger } from '../utils/logger';
export const SURVEY_LOGGER = createLogger('[Surveys]');
export function isSurveyRunning(survey) {
    return !!(survey.start_date && !survey.end_date);
}
export function doesSurveyActivateByEvent(survey) {
    var _a, _b, _c;
    return !!((_c = (_b = (_a = survey.conditions) === null || _a === void 0 ? void 0 : _a.events) === null || _b === void 0 ? void 0 : _b.values) === null || _c === void 0 ? void 0 : _c.length);
}
export function doesSurveyActivateByAction(survey) {
    var _a, _b, _c;
    return !!((_c = (_b = (_a = survey.conditions) === null || _a === void 0 ? void 0 : _a.actions) === null || _b === void 0 ? void 0 : _b.values) === null || _c === void 0 ? void 0 : _c.length);
}
export const SURVEY_SEEN_PREFIX = 'seenSurvey_';
export const SURVEY_IN_PROGRESS_PREFIX = 'inProgressSurvey_';
export const getSurveyInteractionProperty = (survey, action) => {
    let surveyProperty = `$survey_${action}/${survey.id}`;
    if (survey.current_iteration && survey.current_iteration > 0) {
        surveyProperty = `$survey_${action}/${survey.id}/${survey.current_iteration}`;
    }
    return surveyProperty;
};
export const getSurveySeenKey = (survey) => {
    let surveySeenKey = `${SURVEY_SEEN_PREFIX}${survey.id}`;
    if (survey.current_iteration && survey.current_iteration > 0) {
        surveySeenKey = `${SURVEY_SEEN_PREFIX}${survey.id}_${survey.current_iteration}`;
    }
    return surveySeenKey;
};
export const setSurveySeenOnLocalStorage = (survey) => {
    const isSurveySeen = localStorage.getItem(getSurveySeenKey(survey));
    // if survey is already seen, no need to set it again
    if (isSurveySeen) {
        return;
    }
    localStorage.setItem(getSurveySeenKey(survey), 'true');
};
// These surveys are relevant for the getActiveMatchingSurveys method. They are used to
// display surveys in our customer's application. Any new in-app survey type should be added here.
export const IN_APP_SURVEY_TYPES = [SurveyType.Popover, SurveyType.Widget, SurveyType.API];
export const DEFAULT_DISPLAY_SURVEY_OPTIONS = {
    ignoreConditions: false,
    ignoreDelay: false,
    displayType: DisplaySurveyType.Popover,
};
