import * as DialogPrimitive from '@radix-ui/react-dialog'
import { keyframes, styled } from '../theme'
import { ReactNode } from 'react'
import { Text } from './Text'

type DialogProps = {
    isShowing: boolean
    onRequestClose: () => void
    children: ReactNode
    title?: string
}

const overlayShow = keyframes({
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
})

const contentShow = keyframes({
    '0%': { opacity: 0, transform: 'translate(-50%, -48%) scale(0.96)' },
    '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
})

const StyledOverlay = styled(DialogPrimitive.Overlay, {
    backgroundColor: 'rgba(0, 0, 0, 0.44)',
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    '@media (prefers-reduced-motion: no-preference)': {
        animation: `${overlayShow} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
    },
})

const StyledContent = styled(DialogPrimitive.Content, {
    backgroundColor: '$backgroundColors$base',
    borderRadius: '$3',
    boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90vw',
    maxWidth: '500px',
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: '$4',
    zIndex: 1001,
    '@media (prefers-reduced-motion: no-preference)': {
        animation: `${contentShow} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
    },
    '&:focus': { outline: 'none' },
})

const StyledTitle = styled(DialogPrimitive.Title, {
    margin: 0,
    fontWeight: 500,
    color: '$textColors$primary',
    fontSize: 17,
})

const StyledCloseButton = styled(DialogPrimitive.Close, {
    fontFamily: 'inherit',
    borderRadius: '100%',
    height: 25,
    width: 25,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '$textColors$tertiary',
    position: 'absolute',
    top: 10,
    right: 10,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',

    '&:hover': { backgroundColor: '$colors$dark5', color: '$textColors$primary' },
    '&:focus': { boxShadow: '0 0 0 2px $colors$brand90' },
})

export const Dialog = ({ isShowing, onRequestClose, children, title }: DialogProps) => {
    return (
        <DialogPrimitive.Root open={isShowing} onOpenChange={(open) => !open && onRequestClose()}>
            <DialogPrimitive.Portal>
                <StyledOverlay />
                <StyledContent>
                    {title && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: title ? 20 : 0 }}>
                            <StyledTitle>
                                <Text variant="subheading">{title}</Text>
                            </StyledTitle>
                            <StyledCloseButton aria-label="Close">
                                <CloseIcon />
                            </StyledCloseButton>
                        </div>
                    )}
                    {!title && (
                        <StyledCloseButton aria-label="Close">
                            <CloseIcon />
                        </StyledCloseButton>
                    )}
                    {children}
                </StyledContent>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

const CloseIcon = () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.1929 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.1929 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
        />
    </svg>
)

export const DialogHeader = styled('div', {
    padding: '$6',
    textAlign: 'center'
})

export const DialogContent = styled('div', {
    padding: '$6'
})
