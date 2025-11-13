import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { h } from 'preact';
import { renderChildrenAsTextOrHtml } from '../surveys-extension-utils';
import { BottomSection } from './BottomSection';
import { Cancel } from './QuestionHeader';
import { useContext, useEffect } from 'preact/hooks';
import { SurveyContext } from '../surveys-extension-utils';
import { addEventListener } from '../../../utils';
import { window as _window } from '../../../utils/globals';
// We cast the types here which is dangerous but protected by the top level generateSurveys call
const window = _window;
export function ConfirmationMessage({ header, description, contentType, forceDisableHtml, appearance, onClose, }) {
    const { isPopup } = useContext(SurveyContext);
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter' || event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };
        addEventListener(window, 'keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);
    return (_jsxs("div", { className: "thank-you-message", role: "status", tabIndex: 0, "aria-atomic": "true", children: [isPopup && _jsx(Cancel, { onClick: () => onClose() }), _jsx("h3", { className: "thank-you-message-header", children: header }), description &&
                renderChildrenAsTextOrHtml({
                    component: h('p', { className: 'thank-you-message-body' }),
                    children: description,
                    renderAsHtml: !forceDisableHtml && contentType !== 'text',
                }), isPopup && (_jsx(BottomSection, { text: appearance.thankYouMessageCloseButtonText || 'Close', submitDisabled: false, appearance: appearance, onSubmit: () => onClose() }))] }));
}
