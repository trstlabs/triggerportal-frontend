import { Text, Tooltip } from "components/ui-blocks"
import { StyledInput } from "../BuildComponent"
import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"



export const FieldArray = ({ label, values = [], onChange, disabled }) => {
  // Handle input change event
  const handleChange = (e, index) => {
    const inputValue = e.target.value;
    if (!/^\d*$/.test(inputValue)) {
      toast.error('Please enter a valid number.');
      return;
    }

    const newValues = [...values];
    newValues[index] = inputValue !== '' ? BigInt(inputValue) : '';
    onChange(newValues.filter(v => v !== ''));
  };

  // Add a new input field
  const addField = () => {
    if (values.length < 5) {
      onChange([...values, '']);
    }
  };

  return (
    <div>
      <Text css={{ padding: '$2', margin: '$2' }} variant="caption" color="primary" align="left">
        {label}
      </Text>
      <Text>
        {/*  <Text css={{ padding: '$2', margin: '$2' }} variant="caption" color="secondary" align="left">
          Flow IDs
        </Text> */}
        {values.map((value, index) => (
          <StyledInput
            key={index}
            type="text"
            value={value.toString()}
            onChange={(e) => handleChange(e, index)}
            disabled={disabled}
            style={{ width: '15%', border: '1px ridge #ccc', borderRadius: '8px', marginBottom: '8px' }}
          />
        ))}
        {values.length < 10 && !disabled && (
          <button type="button" onClick={addField} style={{ marginBottom: '8px', fontSize: '11px' }}>
            + Add Flow ID
          </button>
        )}
      </Text>
    </div>
  );
};

type FieldProps = {
  label: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  tooltip?: string
  disabled?: boolean
  type?: string
}
export const Field = ({ label, tooltip, value, onChange, disabled, type = 'text' }: FieldProps) => {
  const [errorInput, setError] = useState<string>("")

  // Function to validate and convert input value
  const parseValue = (inputValue: string): string | number | bigint | null => {
    if (inputValue === '') {
      return null // Handle empty input as null
    }

    // Attempt to parse as BigInt
    try {
      return BigInt(inputValue)
    } catch {
      // If BigInt conversion fails, continue to check for number
    }

    // Attempt to parse as number
    if (!isNaN(Number(inputValue))) {
      return Number(inputValue)
    }

    // Return the original string if it's neither BigInt nor number
    return inputValue
  }

  // Handle input change event
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue: number | bigint | string = e.target.value
    try {
      if (type != "string") {
        const newValue = parseValue(inputValue)
        inputValue = newValue
      }
      if (inputValue === null) {
        // Check if newValue is not a valid number or BigInt
        // throw new Error('Invalid input: not a number')
        inputValue = 0
      }
      setError("") // Clear errorInput if valid
      onChange({ target: { value: inputValue.toString() } } as React.ChangeEvent<HTMLInputElement>)
    } catch (err) {
      console.log(err)
    }
  }
  const [inputWidth, setInputWidth] = useState('auto');
  const inputRef = useRef(null);
  const spanRef = useRef(null);

  useEffect(() => {
    if (spanRef.current) {
      setInputWidth(`${spanRef.current.offsetWidth + 10}px`); // Add padding for caret
    }
  }, [value]);


  return (
    <div>
      {tooltip ? (
        <Tooltip placement="left" label={tooltip}>
          <Text css={{ padding: '$2', margin: '$2' }} variant="caption" color="secondary" align="left">
            {label}
          </Text>
        </Tooltip>
      ) : (
        <Text css={{ padding: '$2', margin: '$2' }} variant="caption" color="secondary" align="left">
          {label}
        </Text>
      )}
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <Text variant="body">
          <StyledInput
            ref={inputRef} // Attach ref to StyledInput
            type={type}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            style={{
              width: inputWidth,
              minWidth: '50px',
              border: 'none',
              borderBottom: '1px solid #ccc', // Subtle light gray line
              padding: '2px 4px',
              outline: 'none',
              fontSize: '16px', // Larger font size for readability
              fontWeight: 400, // Light font weight for modern look
              backgroundColor: 'transparent', // Transparent background for minimal look
              transition: 'border-color 0.2s', // Smooth transition for focus
            }}
            onFocus={(e) => {
              e.target.style.borderBottom = '2px solid #4a90e2'; // Blue bottom border on focus
            }}
            onBlur={(e) => {
              e.target.style.borderBottom = '1px solid #ccc'; // Revert on blur
            }}
          />
          <span
            ref={spanRef}
            style={{
              position: 'absolute',
              visibility: 'hidden',
              whiteSpace: 'pre',
              padding: '0 5px',
              font: 'inherit', // Ensure the span matches the font size and weight of the input
            }}
          >
            {value || ' '}
          </span>
        </Text>
        {errorInput && <Text variant="caption" css={{ marginTop: '2px', color: 'red' }}>{errorInput || 'Unknown error occurred'}</Text>}
      </div>
    </div>
  );
};
