import { Tooltip as InterchainTooltip } from '@interchain-ui/react'
import { ReactElement, ReactNode } from 'react'

import { Text } from '../Text'
import { Inline } from '../Inline'

type TooltipProps = {
    children: ReactElement
    label?: string | ReactNode
    body?: string | ReactNode
    icon?: ReactElement
    placement?: 'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end'
}

export function Tooltip({
    children,
    label,
    placement = 'bottom',
    body,
    icon
}: TooltipProps) {

    /*
     * - render top offset to compensate for the space that icon takes if there's an icon + body
     * - render bottom offset for body text if we're rendering an icon otherwise let the tooltip
     *   wrapper take care for the offsets
     * */
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

    const title = icon ? (
        <Inline gap={3} align={body ? 'flex-start' : 'center'}>
            {/* We clone the icon to ensure it has the correct props if passed as an element, 
                 though Interchain UI might handle icons differently. 
                 Assuming icon is a ReactElement here similar to before. 
              */}
            {/* 
                Original code was cloning and overriding color/size. 
                If 'icon' is a specific component, we might want to keep that logic if possible 
                or just render it. Let's try to preserve the style intent if possible, 
                but simple rendering is safer for now unless we know the 'icon' type.
            */}
            <div style={{ color: 'var(--primary)', fontSize: '24px' }}>{icon}</div>
            {tooltipContent}
        </Inline>
    ) : (
        tooltipContent
    )

    return (
        <InterchainTooltip
            title={title}
            placement={placement}
        >
            {children}
        </InterchainTooltip>
    )
}

