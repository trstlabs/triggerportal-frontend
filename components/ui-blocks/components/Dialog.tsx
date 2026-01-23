
import { BasicModal } from '@interchain-ui/react'
import { ReactNode } from 'react'
import { css, styled } from '../theme'

type DialogProps = {
    isShowing: boolean
    onRequestClose: () => void
    children: ReactNode
}

const overlayClass = css({
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
})

export const Dialog = ({ isShowing, onRequestClose, children }: DialogProps) => {
    return (
        <BasicModal
            title="sfg"
            isOpen={isShowing}
            onClose={onRequestClose}
            renderTrigger={(_) => null} // No trigger needed as we control state
            modalContainerClassName={overlayClass()}
        >
            {children}
        </BasicModal>
    )
}

export const DialogHeader = styled('div', {
    padding: '$6',
    textAlign: 'center'
})

export const DialogContent = styled('div', {
    padding: '$6'
})
