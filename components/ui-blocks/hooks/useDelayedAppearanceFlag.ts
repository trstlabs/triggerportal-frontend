
import { useState, useEffect } from 'react'

export const useDelayedAppearanceFlag = (flag: boolean, delay: number = 0) => {
    const [delayed, setDelayed] = useState(flag)
    useEffect(() => {
        if (flag) {
            setDelayed(true)
        } else {
            const t = setTimeout(() => setDelayed(false), delay)
            return () => clearTimeout(t)
        }
    }, [flag, delay])
    return delayed
}
