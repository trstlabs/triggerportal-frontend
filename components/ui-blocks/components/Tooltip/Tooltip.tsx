import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { ReactElement, ReactNode } from 'react'
import { keyframes, styled } from '../../theme'
import { Text } from '../Text'
import { Inline } from '../Inline'

const slideUpAndFade = keyframes({
    '0%': { opacity: 0, transform: 'translateY(2px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
})

const slideRightAndFade = keyframes({
    '0%': { opacity: 0, transform: 'translateX(-2px)' },
    '100%': { opacity: 1, transform: 'translateX(0)' },
})

const slideDownAndFade = keyframes({
    '0%': { opacity: 0, transform: 'translateY(-2px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
})

const slideLeftAndFade = keyframes({
    '0%': { opacity: 0, transform: 'translateX(2px)' },
    '100%': { opacity: 1, transform: 'translateX(0)' },
})

const StyledContent = styled(TooltipPrimitive.Content, {
    borderRadius: '4px',
    padding: '$3 $4',
    fontSize: '$fontSizes$product$body',
    lineHeight: 1,
    color: '$textColors$primary',
    backgroundColor: '$backgroundColors$tooltip',
    opacity: 0.9,
    boxShadow: '0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)',
    userSelect: 'none',
    zIndex: 9999, // Ensure it sits on top of modals
    '@media (prefers-reduced-motion: no-preference)': {
        animationDuration: '400ms',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform, opacity',
        '&[data-state="delayed-open"]': {
            '&[data-side="top"]': { animationName: slideDownAndFade },
            '&[data-side="right"]': { animationName: slideLeftAndFade },
            '&[data-side="bottom"]': { animationName: slideUpAndFade },
            '&[data-side="left"]': { animationName: slideRightAndFade },
        },
    },
})

const StyledArrow = styled(TooltipPrimitive.Arrow, {
    fill: '$backgroundColors$tooltip',
})

type TooltipProps = {
    children: ReactElement
    label?: string | ReactNode
    body?: string | ReactNode
    icon?: ReactElement
    placement?: 'top' | 'right' | 'bottom' | 'left'
    [key: string]: any
}

export function Tooltip({
    children,
    label,
    placement = 'bottom',
    body,
    icon,
    ...props
}: TooltipProps) {

    const tooltipContent = (
        <div data-tooltip-content=''>
            <Text
                as='div'
                variant='caption'
                color='primary'
                css={icon && body ? { paddingTop: '$1' } : undefined}
            >
                {label}
            </Text>
            {body && (
                <Text
                    as='div'
                    variant='caption'
                    color='tertiary'
                    css={icon ? { paddingBottom: '$1' } : undefined}
                >
                    {body}
                </Text>
            )}
        </div>
    )

    const content = icon ? (
        <Inline gap={3} align={body ? 'flex-start' : 'center'}>
            <div style={{ color: 'var(--primary)', fontSize: '24px' }}>{icon}</div>
            {tooltipContent}
        </Inline>
    ) : (
        tooltipContent
    )

    return (
        <TooltipPrimitive.Provider>
            <TooltipPrimitive.Root delayDuration={200}>
                <TooltipPrimitive.Trigger asChild>
                    {children}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <StyledContent side={placement} sideOffset={5} {...props}>
                        {content}
                        <StyledArrow />
                    </StyledContent>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    )
}

