import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { SurveyQuestionType } from '../../../posthog-surveys-types';
import { cancelSVG } from '../icons';
import { SurveyContext, renderChildrenAsTextOrHtml } from '../surveys-extension-utils';
export function QuestionHeader({ question, forceDisableHtml, htmlFor, }) {
    const TitleComponent = question.type === SurveyQuestionType.Open ? 'label' : 'h3';
    return (_jsxs("div", { class: "question-header", children: [_jsx(TitleComponent, { className: "survey-question", htmlFor: htmlFor, children: question.question }), question.description &&
                renderChildrenAsTextOrHtml({
                    component: h('p', { className: 'survey-question-description' }),
                    children: question.description,
                    renderAsHtml: !forceDisableHtml && question.descriptionContentType !== 'text',
                })] }));
}
export function Cancel({ onClick }) {
    const { isPreviewMode } = useContext(SurveyContext);
    return (_jsx("button", { className: "form-cancel", onClick: onClick, disabled: isPreviewMode, "aria-label": "Close survey", type: "button", children: cancelSVG }));
}
