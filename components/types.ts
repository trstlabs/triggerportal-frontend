import React, { ComponentPropsWithRef, ElementType, HTMLProps } from 'react'

export type RenderAsType = keyof React.JSX.IntrinsicElements | ElementType

export type GetRenderAsProps<T extends RenderAsType> =
  T extends React.JSX.IntrinsicElements
  ? HTMLProps<T>
  : T extends ElementType
  ? ComponentPropsWithRef<T>
  : {}
