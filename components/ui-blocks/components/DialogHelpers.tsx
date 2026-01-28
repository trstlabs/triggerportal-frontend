
import { styled } from '../theme'

export const DialogButtons = styled('div', {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '$space$2',
    marginTop: '$space$4',
})

export const DialogDivider = styled('hr', {
    border: 'none',
    borderTop: '1px solid $colors$black10',
    margin: '$space$4 0',
})
