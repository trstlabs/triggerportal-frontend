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

export const themeAtom = atomWithStorage<ThemeAtomType>('@theme', defaultThemeState)
