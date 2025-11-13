import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { window } from '../../../utils/globals';
import { useContext } from 'preact/hooks';
import { SurveyContext } from '../surveys-extension-utils';
import { PostHogLogo } from './PostHogLogo';
export function BottomSection({ text, submitDisabled, appearance, onSubmit, link, onPreviewSubmit, skipSubmitButton, }) {
    const { isPreviewMode } = useContext(SurveyContext);
    return (_jsxs("div", { className: "bottom-section", children: [!skipSubmitButton && (_jsx("button", { className: "form-submit", disabled: submitDisabled, "aria-label": "Submit survey", type: "button", onClick: () => {
                    if (link) {
                        window === null || window === void 0 ? void 0 : window.open(link);
                    }
                    if (isPreviewMode) {
                        onPreviewSubmit === null || onPreviewSubmit === void 0 ? void 0 : onPreviewSubmit();
                    }
                    else {
                        onSubmit();
                    }
                }, children: text })), !appearance.whiteLabel && _jsx(PostHogLogo, {})] }));
}
