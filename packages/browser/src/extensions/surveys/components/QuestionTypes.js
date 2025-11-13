import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { SurveyQuestionType, } from '../../../posthog-surveys-types';
import { isArray, isNull, isNumber, isString } from '@agrid/core';
import { dissatisfiedEmoji, neutralEmoji, satisfiedEmoji, veryDissatisfiedEmoji, verySatisfiedEmoji } from '../icons';
import { getDisplayOrderChoices, useSurveyContext } from '../surveys-extension-utils';
import { BottomSection } from './BottomSection';
import { QuestionHeader } from './QuestionHeader';
const isValidStringArray = (value) => {
    return isArray(value) && value.every((item) => isString(item));
};
const initializeSelectedChoices = (initialValue, questionType) => {
    if (isString(initialValue)) {
        return initialValue;
    }
    if (isValidStringArray(initialValue)) {
        return initialValue;
    }
    return questionType === SurveyQuestionType.SingleChoice ? null : [];
};
const initializeOpenEndedState = (initialValue, choices) => {
    if (isString(initialValue) && !choices.includes(initialValue)) {
        return {
            isSelected: true,
            inputValue: initialValue,
        };
    }
    if (isValidStringArray(initialValue)) {
        const openEndedValue = initialValue.find((choice) => !choices.includes(choice));
        if (openEndedValue) {
            return {
                isSelected: true,
                inputValue: openEndedValue,
            };
        }
    }
    return {
        isSelected: false,
        inputValue: '',
    };
};
export function OpenTextQuestion({ question, forceDisableHtml, appearance, onSubmit, onPreviewSubmit, displayQuestionIndex, initialValue, }) {
    const { isPreviewMode } = useSurveyContext();
    const inputRef = useRef(null);
    const [text, setText] = useState(() => {
        if (isString(initialValue)) {
            return initialValue;
        }
        return '';
    });
    useEffect(() => {
        setTimeout(() => {
            var _a;
            if (!isPreviewMode) {
                (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            }
        }, 100);
    }, [isPreviewMode]);
    const htmlFor = `surveyQuestion${displayQuestionIndex}`;
    return (_jsxs(Fragment, { children: [_jsxs("div", { className: "question-container", children: [_jsx(QuestionHeader, { question: question, forceDisableHtml: forceDisableHtml, htmlFor: htmlFor }), _jsx("textarea", { ref: inputRef, id: htmlFor, rows: 4, placeholder: appearance === null || appearance === void 0 ? void 0 : appearance.placeholder, onInput: (e) => {
                            setText(e.currentTarget.value);
                            e.stopPropagation();
                        }, onKeyDown: (e) => {
                            e.stopPropagation();
                        }, value: text })] }), _jsx(BottomSection, { text: question.buttonText || 'Submit', submitDisabled: !text && !question.optional, appearance: appearance, onSubmit: () => onSubmit(text), onPreviewSubmit: () => onPreviewSubmit(text) })] }));
}
export function LinkQuestion({ question, forceDisableHtml, appearance, onSubmit, onPreviewSubmit, }) {
    return (_jsxs(Fragment, { children: [_jsx("div", { className: "question-container", children: _jsx(QuestionHeader, { question: question, forceDisableHtml: forceDisableHtml }) }), _jsx(BottomSection, { text: question.buttonText || 'Submit', submitDisabled: false, link: question.link, appearance: appearance, onSubmit: () => onSubmit('link clicked'), onPreviewSubmit: () => onPreviewSubmit('link clicked') })] }));
}
export function RatingQuestion({ question, forceDisableHtml, displayQuestionIndex, appearance, onSubmit, onPreviewSubmit, initialValue, }) {
    const scale = question.scale;
    const starting = question.scale === 10 ? 0 : 1;
    const [rating, setRating] = useState(() => {
        if (isNumber(initialValue)) {
            return initialValue;
        }
        if (isArray(initialValue) && initialValue.length > 0 && isNumber(parseInt(initialValue[0]))) {
            return parseInt(initialValue[0]);
        }
        if (isString(initialValue) && isNumber(parseInt(initialValue))) {
            return parseInt(initialValue);
        }
        return null;
    });
    const { isPreviewMode } = useSurveyContext();
    const handleSubmit = (num) => {
        if (isPreviewMode) {
            return onPreviewSubmit(num);
        }
        return onSubmit(num);
    };
    return (_jsxs(Fragment, { children: [_jsxs("div", { className: "question-container", children: [_jsx(QuestionHeader, { question: question, forceDisableHtml: forceDisableHtml }), _jsxs("div", { className: "rating-section", children: [_jsxs("div", { className: "rating-options", children: [question.display === 'emoji' && (_jsx("div", { className: "rating-options-emoji", children: (question.scale === 3 ? threeScaleEmojis : fiveScaleEmojis).map((emoji, idx) => {
                                            const active = idx + 1 === rating;
                                            return (_jsx("button", { "aria-label": `Rate ${idx + 1}`, className: `ratings-emoji question-${displayQuestionIndex}-rating-${idx} ${active ? 'rating-active' : ''}`, value: idx + 1, type: "button", onClick: () => {
                                                    const response = idx + 1;
                                                    setRating(response);
                                                    if (question.skipSubmitButton) {
                                                        handleSubmit(response);
                                                    }
                                                }, children: emoji }, idx));
                                        }) })), question.display === 'number' && (_jsx("div", { className: "rating-options-number", style: { gridTemplateColumns: `repeat(${scale - starting + 1}, minmax(0, 1fr))` }, children: getScaleNumbers(question.scale).map((number, idx) => {
                                            const active = rating === number;
                                            return (_jsx(RatingButton, { displayQuestionIndex: displayQuestionIndex, active: active, appearance: appearance, num: number, setActiveNumber: (response) => {
                                                    setRating(response);
                                                    if (question.skipSubmitButton) {
                                                        handleSubmit(response);
                                                    }
                                                } }, idx));
                                        }) }))] }), _jsxs("div", { className: "rating-text", children: [_jsx("div", { children: question.lowerBoundLabel }), _jsx("div", { children: question.upperBoundLabel })] })] })] }), _jsx(BottomSection, { text: question.buttonText || (appearance === null || appearance === void 0 ? void 0 : appearance.submitButtonText) || 'Submit', submitDisabled: isNull(rating) && !question.optional, appearance: appearance, onSubmit: () => onSubmit(rating), onPreviewSubmit: () => onPreviewSubmit(rating), skipSubmitButton: question.skipSubmitButton })] }));
}
export function RatingButton({ num, active, displayQuestionIndex, setActiveNumber, }) {
    return (_jsx("button", { "aria-label": `Rate ${num}`, className: `ratings-number question-${displayQuestionIndex}-rating-${num} ${active ? 'rating-active' : ''}`, type: "button", onClick: () => {
            setActiveNumber(num);
        }, children: num }));
}
export function MultipleChoiceQuestion({ question, forceDisableHtml, displayQuestionIndex, appearance, onSubmit, onPreviewSubmit, initialValue, }) {
    const openChoiceInputRef = useRef(null);
    const choices = useMemo(() => getDisplayOrderChoices(question), [question]);
    const [selectedChoices, setSelectedChoices] = useState(() => initializeSelectedChoices(initialValue, question.type));
    const [openEndedState, setOpenEndedState] = useState(() => initializeOpenEndedState(initialValue, choices));
    const { isPreviewMode } = useSurveyContext();
    const isSingleChoiceQuestion = question.type === SurveyQuestionType.SingleChoice;
    const isMultipleChoiceQuestion = question.type === SurveyQuestionType.MultipleChoice;
    const shouldSkipSubmit = question.skipSubmitButton && isSingleChoiceQuestion && !question.hasOpenChoice;
    const handleChoiceChange = (val, isOpenChoice) => {
        if (isOpenChoice) {
            const newOpenSelected = !openEndedState.isSelected;
            setOpenEndedState((prev) => ({
                ...prev,
                isSelected: newOpenSelected,
                inputValue: newOpenSelected ? prev.inputValue : '',
            }));
            if (isSingleChoiceQuestion) {
                setSelectedChoices('');
            }
            // Focus the input when open choice is selected, slight delay because of the animation
            if (newOpenSelected) {
                setTimeout(() => { var _a; return (_a = openChoiceInputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 75);
            }
            return;
        }
        if (isSingleChoiceQuestion) {
            setSelectedChoices(val);
            // Deselect open choice when selecting another option
            setOpenEndedState((prev) => ({
                ...prev,
                isSelected: false,
                inputValue: '',
            }));
            if (shouldSkipSubmit) {
                onSubmit(val);
                if (isPreviewMode) {
                    onPreviewSubmit(val);
                }
            }
            return;
        }
        if (isMultipleChoiceQuestion && isArray(selectedChoices)) {
            if (selectedChoices.includes(val)) {
                setSelectedChoices(selectedChoices.filter((choice) => choice !== val));
            }
            else {
                setSelectedChoices([...selectedChoices, val]);
            }
        }
    };
    const handleOpenEndedInputChange = (e) => {
        e.stopPropagation();
        const newValue = e.currentTarget.value;
        setOpenEndedState((prev) => ({
            ...prev,
            inputValue: newValue,
        }));
        if (isSingleChoiceQuestion) {
            setSelectedChoices(newValue);
        }
    };
    const handleOpenEndedKeyDown = (e) => {
        e.stopPropagation();
        // Handle Enter key to submit form if valid
        if (e.key === 'Enter' && !isSubmitDisabled()) {
            e.preventDefault();
            handleSubmit();
        }
        // Handle Escape key to clear input and deselect
        if (e.key === 'Escape') {
            e.preventDefault();
            setOpenEndedState((prev) => ({
                ...prev,
                isSelected: false,
                inputValue: '',
            }));
            if (isSingleChoiceQuestion) {
                setSelectedChoices(null);
            }
        }
    };
    const isSubmitDisabled = () => {
        if (question.optional) {
            return false;
        }
        if (isNull(selectedChoices)) {
            return true;
        }
        if (isArray(selectedChoices)) {
            if (!openEndedState.isSelected && selectedChoices.length === 0) {
                return true;
            }
        }
        if (openEndedState.isSelected && openEndedState.inputValue.trim() === '') {
            return true;
        }
        return false;
    };
    const handleSubmit = () => {
        if (openEndedState.isSelected && isMultipleChoiceQuestion) {
            if (isArray(selectedChoices)) {
                isPreviewMode
                    ? onPreviewSubmit([...selectedChoices, openEndedState.inputValue])
                    : onSubmit([...selectedChoices, openEndedState.inputValue]);
            }
        }
        else {
            isPreviewMode ? onPreviewSubmit(selectedChoices) : onSubmit(selectedChoices);
        }
    };
    return (_jsxs(Fragment, { children: [_jsxs("div", { className: "question-container", children: [_jsx(QuestionHeader, { question: question, forceDisableHtml: forceDisableHtml }), _jsxs("fieldset", { className: "multiple-choice-options limit-height", children: [_jsx("legend", { className: "sr-only", children: isMultipleChoiceQuestion ? ' Select all that apply' : ' Select one' }), choices.map((choice, idx) => {
                                const isOpenChoice = !!question.hasOpenChoice && idx === question.choices.length - 1;
                                const inputId = `surveyQuestion${displayQuestionIndex}Choice${idx}`;
                                const openInputId = `${inputId}Open`;
                                const isChecked = isOpenChoice
                                    ? openEndedState.isSelected
                                    : isSingleChoiceQuestion
                                        ? selectedChoices === choice
                                        : isArray(selectedChoices) && selectedChoices.includes(choice);
                                return (_jsxs("label", { className: isOpenChoice ? 'choice-option-open' : '', children: [_jsxs("div", { className: "response-choice", children: [_jsx("input", { type: isSingleChoiceQuestion ? 'radio' : 'checkbox', name: inputId, checked: isChecked, onChange: () => handleChoiceChange(choice, isOpenChoice), id: inputId, "aria-controls": openInputId }), _jsx("span", { children: isOpenChoice ? `${choice}:` : choice })] }), isOpenChoice && (_jsx("input", { type: "text", ref: openChoiceInputRef, id: openInputId, name: `question${displayQuestionIndex}Open`, value: openEndedState.inputValue, onKeyDown: handleOpenEndedKeyDown, onInput: handleOpenEndedInputChange, onClick: (e) => {
                                                // Ensure the checkbox/radio gets checked when clicking the input
                                                if (!openEndedState.isSelected) {
                                                    handleChoiceChange(choice, true);
                                                }
                                                e.stopPropagation();
                                            }, "aria-label": `${choice} - please specify` }))] }, idx));
                            })] })] }), _jsx(BottomSection, { text: question.buttonText || 'Submit', submitDisabled: isSubmitDisabled(), appearance: appearance, onSubmit: handleSubmit, onPreviewSubmit: handleSubmit, skipSubmitButton: shouldSkipSubmit })] }));
}
const threeScaleEmojis = [dissatisfiedEmoji, neutralEmoji, satisfiedEmoji];
const fiveScaleEmojis = [veryDissatisfiedEmoji, dissatisfiedEmoji, neutralEmoji, satisfiedEmoji, verySatisfiedEmoji];
const fiveScaleNumbers = [1, 2, 3, 4, 5];
const sevenScaleNumbers = [1, 2, 3, 4, 5, 6, 7];
const tenScaleNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
function getScaleNumbers(scale) {
    switch (scale) {
        case 5:
            return fiveScaleNumbers;
        case 7:
            return sevenScaleNumbers;
        case 10:
            return tenScaleNumbers;
        default:
            return fiveScaleNumbers;
    }
}
