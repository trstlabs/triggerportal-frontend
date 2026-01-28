import { json } from '@codemirror/lang-json'
import ReactCodeMirror from '@uiw/react-codemirror'
import React from 'react'
import { styled, useControlTheme, useMedia } from 'components/ui-blocks'
import { ErrorStack, validateJSON } from './Validation'

interface JsonCodeMirrorEditorProps {
  jsonValue: string
  jsonSchema?: string
  placeholder?: any
  validationErrors?: string[]
  onChange?(val: string): void
  onValidate?(valid: boolean): void
  setValidationErrors?(errors: string[]): void
}

export const JsonCodeMirrorEditor = ({
  jsonValue,
  jsonSchema,
  placeholder,
  validationErrors,
  onChange,
  onValidate,
  setValidationErrors
}: JsonCodeMirrorEditorProps) => {
  const defaultPlaceholder = placeholder || {
    JSON: "'Enter your JSON message here'",
  }
  /*     const isSmall = useMedia('sm'); */
  const isMedium = useMedia('md')
  const themeController = useControlTheme()

  // Use a ref to track the previous value and prevent unnecessary updates
  const prevJsonValueRef = React.useRef(jsonValue);

  // Only update if the incoming value has actually changed
  const handleChange = React.useCallback((val: string) => {
    if (val === prevJsonValueRef.current) return;

    prevJsonValueRef.current = val;
    onChange?.(val);

    // Only validate if we have a validation function
    if (setValidationErrors) {
      try {
        const parsedJSON = JSON.parse(val);
        const errors = validateJSON(parsedJSON, jsonSchema);

        if (errors && errors.length > 0) {
          setValidationErrors(errors);
          onValidate?.(false);
        } else {
          setValidationErrors([]);
          onValidate?.(true);
        }
      } catch (e) {
        // Only show error if the input is not empty
        if (val.trim() !== '') {
          setValidationErrors([`Invalid JSON: ${e.message}`]);
          onValidate?.(false);
        } else {
          setValidationErrors([]);
        }
      }
    }
  }, [jsonSchema, onChange, onValidate, setValidationErrors]);

  // Update the ref when the prop changes
  React.useEffect(() => {
    prevJsonValueRef.current = jsonValue;
  }, [jsonValue]);

  return (
    <StyledDivForContainer>
      {validationErrors && validationErrors.length > 0 && (
        <ErrorStack validationErrors={validationErrors} />
      )}
      <ReactCodeMirror
        width={isMedium ? 'auto' : 'auto'}
        value={jsonValue}
        extensions={[json()]}
        onChange={handleChange}
        theme={themeController.theme.name === 'dark' ? 'dark' : 'light'}
        placeholder={JSON.stringify(defaultPlaceholder, null, 2)}
        style={{
          border: '1px solid var(--colors-dark10)',
          borderRadius: '4px',
          height: '100%',
          minHeight: '200px',
          padding: '8px'
        }}
      />
    </StyledDivForContainer>



  )
}

const StyledDivForContainer = styled('div', {
  borderRadius: '$4',
  width: '100%',
  margin: '$2',
  // transition: 'box-shadow .1s ease-out',
  height: '100%',
  display: 'block',
})
