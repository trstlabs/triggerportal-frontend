
import { useState, useCallback } from 'react'

export const useAmountChangeController = ({ amount, onAmountChange }: { amount: number, onAmountChange: (val: number) => void }) => {
    const [value, setValueState] = useState(amount.toString())

    const setValue = useCallback((val: string) => {
        setValueState(val)
        const num = parseFloat(val)
        if (!isNaN(num)) {
            onAmountChange(num)
        }
    }, [onAmountChange])

    return { value, setValue }
}

export const calculateCharactersLength = (val: string) => val.length
