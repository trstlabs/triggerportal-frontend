import { ComponentPropsWithRef, ElementType, HTMLProps, JSX } from 'react'

export type RenderAsType = JSX.IntrinsicElements | ElementType

export type GetRenderAsProps<T extends RenderAsType> = T extends JSX.IntrinsicElements ? HTMLProps<T> : T extends ElementType ? ComponentPropsWithRef<T> : {}
