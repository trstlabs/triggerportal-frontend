
import { useState, useEffect } from 'react'
import { config } from '../theme/theme'

export function useMedia(query: string) {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        // Check if config.media exists and has the query key
        const mediaQuery = config.media?.[query] || query
        // If it's a key from stitches config, it might be wrapped in parentheses or not.
        // Stitches media queries are usually like '(min-width: 640px)'.

        const mql = window.matchMedia(mediaQuery)
        setMatches(mql.matches)

        const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [query])

    return matches
}
