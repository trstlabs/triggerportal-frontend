
import React, { useState } from 'react'

import { Button } from './Button'

export const ButtonWithDropdown = ({ label, children }: { label: any, children: any }) => {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: 'relative' }}>
            <Button onClick={() => setOpen(!open)}>{label}</Button>
            {open && <div style={{ position: 'absolute', top: '100%' }}>{children}</div>}
        </div>
    )
}
