
import { RefObject, useEffect } from 'react'

export const useOnClickOutside = (
    refs: RefObject<HTMLElement> | RefObject<HTMLElement>[],
    handler: (event: MouseEvent | TouchEvent) => void
) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            const elements = Array.isArray(refs) ? refs : [refs]
            const shouldIgnore = elements.some((ref) => {
                const el = ref?.current
                return !el || el.contains(event.target as Node)
            })

            if (shouldIgnore) {
                return
            }

            handler(event)
        }

        document.addEventListener('mousedown', listener)
        document.addEventListener('touchstart', listener)

        return () => {
            document.removeEventListener('mousedown', listener)
            document.removeEventListener('touchstart', listener)
        }
    }, [refs, handler])
}
