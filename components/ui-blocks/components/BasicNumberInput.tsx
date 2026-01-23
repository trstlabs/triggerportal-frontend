
import React from 'react'


export const BasicNumberInput = (props: any) => <input type="number" {...props} />

export const useTriggerInputFocus = (ref: any) => {
    return () => ref.current?.focus()
}
