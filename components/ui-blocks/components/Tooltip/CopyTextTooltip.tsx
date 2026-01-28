import React, { ReactElement, useState, useEffect, ReactNode } from 'react'
import { Tooltip } from './Tooltip'

type CopyTextTooltipProps = {
    label: string
    successLabel?: string
    ariaLabel?: string
    value: string
    children: (args: { copied: boolean; onClick: (e: React.MouseEvent) => void }) => ReactNode
}

export const CopyTextTooltip = ({
    label,
    successLabel = 'Copied!',
    ariaLabel,
    value,
    children,
}: CopyTextTooltipProps) => {
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => setCopied(false), 2000)
            return () => clearTimeout(timeout)
        }
    }, [copied])

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(value)
                setCopied(true)
            } else {
                // Fallback or ignore if not supported
                console.warn('Clipboard API not supported')
            }
        } catch (err) {
            console.error('Failed to copy!', err)
        }
    }

    // Ensure children returns a ReactElement as expected by Tooltip
    const childElement = children({ copied, onClick: handleClick }) as ReactElement

    return (
        <Tooltip label={copied ? successLabel : label} aria-label={ariaLabel}>
            {childElement}
        </Tooltip>
    )
}
