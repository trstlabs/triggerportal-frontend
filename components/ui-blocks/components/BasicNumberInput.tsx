
import React, { forwardRef, useRef, useState } from 'react'


export const BasicNumberInput = forwardRef((props: any, ref: any) => (
    <input ref={ref} type="number" {...props} />
))
BasicNumberInput.displayName = 'BasicNumberInput'

export const useTriggerInputFocus = () => {
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const bind = {
        button: {
            onClick: () => {
                inputRef.current?.focus()
            },
        },
        input: {
            ref: inputRef,
            onFocus: () => setIsFocused(true),
            onBlur: () => setIsFocused(false),
        },
    }

    return { isFocused, bind }
}
