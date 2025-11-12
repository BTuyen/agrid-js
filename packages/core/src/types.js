"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knownUnsafeEditableEvent = exports.ActionStepStringMatching = exports.SurveyMatchType = exports.SurveyQuestionBranchingType = exports.SurveyQuestionType = exports.SurveyRatingDisplay = exports.SurveyQuestionDescriptionContentType = exports.SurveyType = exports.SurveyWidgetType = exports.SurveyPosition = exports.Compression = exports.PostHogPersistedProperty = void 0;
var PostHogPersistedProperty;
(function (PostHogPersistedProperty) {
    PostHogPersistedProperty["AnonymousId"] = "anonymous_id";
    PostHogPersistedProperty["DistinctId"] = "distinct_id";
    PostHogPersistedProperty["Props"] = "props";
    PostHogPersistedProperty["FeatureFlagDetails"] = "feature_flag_details";
    PostHogPersistedProperty["FeatureFlags"] = "feature_flags";
    PostHogPersistedProperty["FeatureFlagPayloads"] = "feature_flag_payloads";
    PostHogPersistedProperty["BootstrapFeatureFlagDetails"] = "bootstrap_feature_flag_details";
    PostHogPersistedProperty["BootstrapFeatureFlags"] = "bootstrap_feature_flags";
    PostHogPersistedProperty["BootstrapFeatureFlagPayloads"] = "bootstrap_feature_flag_payloads";
    PostHogPersistedProperty["OverrideFeatureFlags"] = "override_feature_flags";
    PostHogPersistedProperty["Queue"] = "queue";
    PostHogPersistedProperty["OptedOut"] = "opted_out";
    PostHogPersistedProperty["SessionId"] = "session_id";
    PostHogPersistedProperty["SessionStartTimestamp"] = "session_start_timestamp";
    PostHogPersistedProperty["SessionLastTimestamp"] = "session_timestamp";
    PostHogPersistedProperty["PersonProperties"] = "person_properties";
    PostHogPersistedProperty["GroupProperties"] = "group_properties";
    PostHogPersistedProperty["InstalledAppBuild"] = "installed_app_build";
    PostHogPersistedProperty["InstalledAppVersion"] = "installed_app_version";
    PostHogPersistedProperty["SessionReplay"] = "session_replay";
    PostHogPersistedProperty["SurveyLastSeenDate"] = "survey_last_seen_date";
    PostHogPersistedProperty["SurveysSeen"] = "surveys_seen";
    PostHogPersistedProperty["Surveys"] = "surveys";
    PostHogPersistedProperty["RemoteConfig"] = "remote_config";
    PostHogPersistedProperty["FlagsEndpointWasHit"] = "flags_endpoint_was_hit";
})(PostHogPersistedProperty || (exports.PostHogPersistedProperty = PostHogPersistedProperty = {}));
// Any key prefixed with `attr__` can be added
var Compression;
(function (Compression) {
    Compression["GZipJS"] = "gzip-js";
    Compression["Base64"] = "base64";
})(Compression || (exports.Compression = Compression = {}));
var SurveyPosition;
(function (SurveyPosition) {
    SurveyPosition["TopLeft"] = "top_left";
    SurveyPosition["TopCenter"] = "top_center";
    SurveyPosition["TopRight"] = "top_right";
    SurveyPosition["MiddleLeft"] = "middle_left";
    SurveyPosition["MiddleCenter"] = "middle_center";
    SurveyPosition["MiddleRight"] = "middle_right";
    SurveyPosition["Left"] = "left";
    SurveyPosition["Right"] = "right";
    SurveyPosition["Center"] = "center";
})(SurveyPosition || (exports.SurveyPosition = SurveyPosition = {}));
var SurveyWidgetType;
(function (SurveyWidgetType) {
    SurveyWidgetType["Button"] = "button";
    SurveyWidgetType["Tab"] = "tab";
    SurveyWidgetType["Selector"] = "selector";
})(SurveyWidgetType || (exports.SurveyWidgetType = SurveyWidgetType = {}));
var SurveyType;
(function (SurveyType) {
    SurveyType["Popover"] = "popover";
    SurveyType["API"] = "api";
    SurveyType["Widget"] = "widget";
    SurveyType["ExternalSurvey"] = "external_survey";
})(SurveyType || (exports.SurveyType = SurveyType = {}));
var SurveyQuestionDescriptionContentType;
(function (SurveyQuestionDescriptionContentType) {
    SurveyQuestionDescriptionContentType["Html"] = "html";
    SurveyQuestionDescriptionContentType["Text"] = "text";
})(SurveyQuestionDescriptionContentType || (exports.SurveyQuestionDescriptionContentType = SurveyQuestionDescriptionContentType = {}));
var SurveyRatingDisplay;
(function (SurveyRatingDisplay) {
    SurveyRatingDisplay["Number"] = "number";
    SurveyRatingDisplay["Emoji"] = "emoji";
})(SurveyRatingDisplay || (exports.SurveyRatingDisplay = SurveyRatingDisplay = {}));
var SurveyQuestionType;
(function (SurveyQuestionType) {
    SurveyQuestionType["Open"] = "open";
    SurveyQuestionType["MultipleChoice"] = "multiple_choice";
    SurveyQuestionType["SingleChoice"] = "single_choice";
    SurveyQuestionType["Rating"] = "rating";
    SurveyQuestionType["Link"] = "link";
})(SurveyQuestionType || (exports.SurveyQuestionType = SurveyQuestionType = {}));
var SurveyQuestionBranchingType;
(function (SurveyQuestionBranchingType) {
    SurveyQuestionBranchingType["NextQuestion"] = "next_question";
    SurveyQuestionBranchingType["End"] = "end";
    SurveyQuestionBranchingType["ResponseBased"] = "response_based";
    SurveyQuestionBranchingType["SpecificQuestion"] = "specific_question";
})(SurveyQuestionBranchingType || (exports.SurveyQuestionBranchingType = SurveyQuestionBranchingType = {}));
var SurveyMatchType;
(function (SurveyMatchType) {
    SurveyMatchType["Regex"] = "regex";
    SurveyMatchType["NotRegex"] = "not_regex";
    SurveyMatchType["Exact"] = "exact";
    SurveyMatchType["IsNot"] = "is_not";
    SurveyMatchType["Icontains"] = "icontains";
    SurveyMatchType["NotIcontains"] = "not_icontains";
})(SurveyMatchType || (exports.SurveyMatchType = SurveyMatchType = {}));
/** Sync with plugin-server/src/types.ts */
var ActionStepStringMatching;
(function (ActionStepStringMatching) {
    ActionStepStringMatching["Contains"] = "contains";
    ActionStepStringMatching["Exact"] = "exact";
    ActionStepStringMatching["Regex"] = "regex";
})(ActionStepStringMatching || (exports.ActionStepStringMatching = ActionStepStringMatching = {}));
exports.knownUnsafeEditableEvent = [
    '$snapshot',
    '$pageview',
    '$pageleave',
    '$set',
    'survey dismissed',
    'survey sent',
    'survey shown',
    '$identify',
    '$groupidentify',
    '$create_alias',
    '$$client_ingestion_warning',
    '$web_experiment_applied',
    '$feature_enrollment_update',
    '$feature_flag_called',
];
//# sourceMappingURL=types.js.map