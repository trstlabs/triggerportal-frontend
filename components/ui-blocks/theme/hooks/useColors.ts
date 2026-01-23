import { useAtomValue } from 'jotai'

import { themeAtom } from '../themeAtom'
import { usePersistance } from '../../hooks/usePersistance'

export const useColors = () => {
    const { theme } = useAtomValue(themeAtom)
    return usePersistance(theme?.colorPalette)
}
