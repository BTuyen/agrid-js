/**
 * Having Survey types in types.ts was confusing tsc
 * and generating an invalid module.d.ts
 * See https://github.com/PostHog/posthog-js/issues/698
 */
export var SurveyWidgetType;
(function (SurveyWidgetType) {
    SurveyWidgetType["Button"] = "button";
    SurveyWidgetType["Tab"] = "tab";
    SurveyWidgetType["Selector"] = "selector";
})(SurveyWidgetType || (SurveyWidgetType = {}));
export var SurveyPosition;
(function (SurveyPosition) {
    SurveyPosition["TopLeft"] = "top_left";
    SurveyPosition["TopRight"] = "top_right";
    SurveyPosition["TopCenter"] = "top_center";
    SurveyPosition["MiddleLeft"] = "middle_left";
    SurveyPosition["MiddleRight"] = "middle_right";
    SurveyPosition["MiddleCenter"] = "middle_center";
    SurveyPosition["Left"] = "left";
    SurveyPosition["Center"] = "center";
    SurveyPosition["Right"] = "right";
    SurveyPosition["NextToTrigger"] = "next_to_trigger";
})(SurveyPosition || (SurveyPosition = {}));
export var SurveyType;
(function (SurveyType) {
    SurveyType["Popover"] = "popover";
    SurveyType["API"] = "api";
    SurveyType["Widget"] = "widget";
    SurveyType["ExternalSurvey"] = "external_survey";
})(SurveyType || (SurveyType = {}));
export var SurveyQuestionType;
(function (SurveyQuestionType) {
    SurveyQuestionType["Open"] = "open";
    SurveyQuestionType["MultipleChoice"] = "multiple_choice";
    SurveyQuestionType["SingleChoice"] = "single_choice";
    SurveyQuestionType["Rating"] = "rating";
    SurveyQuestionType["Link"] = "link";
})(SurveyQuestionType || (SurveyQuestionType = {}));
export var SurveyQuestionBranchingType;
(function (SurveyQuestionBranchingType) {
    SurveyQuestionBranchingType["NextQuestion"] = "next_question";
    SurveyQuestionBranchingType["End"] = "end";
    SurveyQuestionBranchingType["ResponseBased"] = "response_based";
    SurveyQuestionBranchingType["SpecificQuestion"] = "specific_question";
})(SurveyQuestionBranchingType || (SurveyQuestionBranchingType = {}));
export var SurveySchedule;
(function (SurveySchedule) {
    SurveySchedule["Once"] = "once";
    SurveySchedule["Recurring"] = "recurring";
    SurveySchedule["Always"] = "always";
})(SurveySchedule || (SurveySchedule = {}));
export var SurveyEventName;
(function (SurveyEventName) {
    SurveyEventName["SHOWN"] = "survey shown";
    SurveyEventName["DISMISSED"] = "survey dismissed";
    SurveyEventName["SENT"] = "survey sent";
})(SurveyEventName || (SurveyEventName = {}));
export var SurveyEventProperties;
(function (SurveyEventProperties) {
    SurveyEventProperties["SURVEY_ID"] = "$survey_id";
    SurveyEventProperties["SURVEY_NAME"] = "$survey_name";
    SurveyEventProperties["SURVEY_RESPONSE"] = "$survey_response";
    SurveyEventProperties["SURVEY_ITERATION"] = "$survey_iteration";
    SurveyEventProperties["SURVEY_ITERATION_START_DATE"] = "$survey_iteration_start_date";
    SurveyEventProperties["SURVEY_PARTIALLY_COMPLETED"] = "$survey_partially_completed";
    SurveyEventProperties["SURVEY_SUBMISSION_ID"] = "$survey_submission_id";
    SurveyEventProperties["SURVEY_QUESTIONS"] = "$survey_questions";
    SurveyEventProperties["SURVEY_COMPLETED"] = "$survey_completed";
})(SurveyEventProperties || (SurveyEventProperties = {}));
export var DisplaySurveyType;
(function (DisplaySurveyType) {
    DisplaySurveyType["Popover"] = "popover";
    DisplaySurveyType["Inline"] = "inline";
})(DisplaySurveyType || (DisplaySurveyType = {}));
