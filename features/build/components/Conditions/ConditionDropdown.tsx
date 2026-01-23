
import React from 'react'
import { Text } from 'components/ui-blocks'


// Define props for ConditionDropdown
type ConditionDropdownProps = {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  options: string[]
}

const ConditionDropdown = ({
  label,
  value,
  onChange,
  disabled,
  options,
}: ConditionDropdownProps) => {
  return (
    <div>
      <Text css={{ padding: '$2', margin: '$2' }} variant="caption" color="secondary" align="left">{label}</Text>
      <Text>
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={{
            width: '50%',
            padding: '4px',
            margin: '4px',
            borderColor: 'var(--input-border-color)', // Use themed color
            backgroundColor: 'var(--input-background-color)', // Use themed color
            color: 'var(--input-text-color)', // Use themed color
            border: 'none',
            borderBottom: '1px solid #ccc', // Subtle light gray line
          }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Text>
    </div>
  )
}

export default ConditionDropdown

