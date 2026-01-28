import { Spinner as InterchainSpinner } from '@interchain-ui/react'
import { styled } from '../theme'
import { ComponentProps } from 'react'

const SpinnerContainer = styled('div', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
        visible: {
            true: { opacity: 1 },
            false: { opacity: 0, pointerEvents: 'none' }
        }
    }
})

type SpinnerProps = ComponentProps<typeof SpinnerContainer> & {
    isLoading?: boolean
    size?: number | string
    instant?: boolean
    color?: string
}


export const Spinner = ({
    size = 24,
    instant = false,
    isLoading = true,
    color,
    ...props
}: SpinnerProps) => {
    // Note: The previous implementation had logic where isLoading=true meant HIDDEN unless instant=true.
    // This seems counter-intuitive and likely a legacy quirk or bug.
    // However, looking at usages, the component is conditionally rendered when needed.
    // So we will assume if this component is rendered, it should be visible.
    // valid usage: <Spinner /> -> shows spinner.

    // Map legacy 'small'/'medium'/'large' to numbers or pass through if supported?
    // Interchain UI usually handles numbers well.
    let finalSize = size;
    if (size === 'small') finalSize = 16;
    if (size === 'medium') finalSize = 24;
    if (size === 'large') finalSize = 32;

    return (
        <SpinnerContainer visible={true} {...props}>
            <InterchainSpinner
                size={finalSize as any}
                color={color as any}
            />
        </SpinnerContainer>
    )
}