import React, { useEffect, useRef, useImperativeHandle } from "react";

const AutoHeightInput = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
    const { onInput, value, className } = props;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => textareaRef.current!);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = "24px";
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            {...props}
            ref={textareaRef}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                }
            }}
            onInput={(e) => {
                if (onInput) onInput(e);
                
                adjustHeight();
            }}
            className={`${className} resize-none overflow-hidden`}
        />
    );
});

AutoHeightInput.displayName = "AutoHeightInput";

export default AutoHeightInput;
