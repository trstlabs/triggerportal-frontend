import React, { useState } from 'react'
import { Text } from 'components/ui-blocks'

// Define props for QueryTypeDropdown
type QueryTypeDropdownProps = {
    label: string
    value: string // Assuming the value will be a string representing the query path
    onChange: (value: string) => void // Update onChange to accept the string directly
    options: { [key: string]: string } // Mapping of query type keys to labels
    disabled?: boolean
}

const QueryTypeDropdown = ({
    label,
    value,
    onChange,
    options,
    disabled,
}: QueryTypeDropdownProps) => {
    const [customInput, setCustomInput] = useState('')

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value
        setCustomInput('') // Clear custom input when selecting from dropdown
        onChange(selectedValue)
    }

    const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        setCustomInput(inputValue)
        onChange(inputValue) // Pass the custom input to onChange
    }

    return (
        <div>
            <Text variant="caption" color="secondary" align="left">{label}</Text>
            <Text>
                <select
                    value={value}
                    onChange={handleSelectChange}
                    disabled={disabled}
                    style={{
                        width: '50%',
                        padding: '8px',
                        margin: '8px',
                        borderColor: 'var(--input-border-color)',  // Use themed color
                        backgroundColor: 'var(--input-background-color)', // Use themed color
                        color: 'var(--input-text-color)', // Use themed color
                        borderRadius: '4px',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                    }}
                >
                    <option value="">Select a query type...</option> {/* Placeholder option */}
                    {Object.entries(options).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    value={customInput}
                    onChange={handleCustomInputChange}
                    placeholder="Custom query path"
                    style={{
                        width: '50%',
                        padding: '8px',
                        margin: '8px',
                        borderColor: 'var(--input-border-color)',  // Use themed color
                        backgroundColor: 'var(--input-background-color)', // Use themed color
                        color: 'var(--input-text-color)', // Use themed color
                        borderRadius: '4px',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                    }}
                />
            </Text>
        </div>
    )
}

export default QueryTypeDropdown

// Example usage of the QueryTypeDropdown
export const QueryTypeOptions = {
    "store/bank/key": "Bank Key",
    "store/staking/key": "Staking Key",
    "store/other/key": "Other Key", // Add more options as needed
}

