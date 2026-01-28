import { createTheme } from '@stitches/react'
import { atomWithStorage } from 'jotai/utils'

import { darkTheme, lightTheme } from './theme'
import { darkThemeColorPalette, lightThemeColorPalette } from './colors'

export type ThemeConfig = {
    name: string
    config: ReturnType<typeof createTheme>
    colorPalette: typeof darkThemeColorPalette
}

type ThemeAtomType = {
    theme: ThemeConfig
    themes: Array<ThemeConfig>
    touched: boolean
}

export const lightThemeConfig = {
    name: 'light',
    config: lightTheme,
    colorPalette: lightThemeColorPalette
}

export const darkThemeConfig = {
    name: 'dark',
    config: darkTheme,
    colorPalette: darkThemeColorPalette
}

export const defaultThemes = [lightThemeConfig, darkThemeConfig]

const defaultThemeState: ThemeAtomType = {
    theme: lightThemeConfig,
    themes: defaultThemes,
    touched: false
}


const storage = {
    getItem: (key: string, initialValue: ThemeAtomType) => {
        if (typeof window === 'undefined') return initialValue
        try {
            const item = window.localStorage.getItem(key)
            if (item === null) return initialValue
            const parsed = JSON.parse(item)
            const themeName = parsed?.theme?.name
            const foundTheme = defaultThemes.find((t) => t.name === themeName) || defaultThemes[0]

            return {
                ...initialValue,
                ...parsed,
                theme: foundTheme,
                themes: defaultThemes
            }
        } catch (error) {
            return initialValue
        }
    },
    setItem: (key: string, value: ThemeAtomType) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(value))
        }
    },
    removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key)
        }
    }
}

export const themeAtom = atomWithStorage<ThemeAtomType>('@theme', defaultThemeState, storage)
