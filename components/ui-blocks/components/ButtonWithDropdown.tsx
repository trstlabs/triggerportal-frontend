
import React, { useState } from 'react'

import { Button } from './Button'
import { Card } from './Card'

export const ButtonWithDropdown = ({ label, children, iconRight, variant }: { label: any, children: any, iconRight?: any, variant?: any }) => {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: 'relative' }}>
            <Button onClick={() => setOpen(!open)} iconRight={iconRight} variant={variant}>{label}</Button>
            {open && <div style={{ position: 'absolute', top: '100%', zIndex: 10 }}>
                <Card variant="primary">
                    {children}
                </Card>
            </div>}
        </div>
    )
}
