import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as yup from 'yup';
import { styled, Text, IconWrapper } from 'components/ui-blocks';
import { ErrorStack } from './Validation';
import get from "lodash/get";
import set from "lodash/set";
import { Clipboard } from 'lucide-react';

// Utility to create the validation schema from properties
const createValidationSchema = (properties) => {
    const shape = {};
    if (properties) {
        Object.keys(properties).forEach((key) => {
            const field = properties[key];
            if (field.type === 'string') {
                shape[key] = yup.string();
            } else if (field.type === 'number') {
                shape[key] = yup.number();
            } else if (field.type === 'array') {
                shape[key] = yup.array().of(yup.object(createValidationSchema(field.items.properties)));
            } else if (field.type === 'object') {
                shape[key] = yup.object(createValidationSchema(field.properties));
            }
        });
    }
    return shape;
};

// Styled components
const StyledField = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '$2',
    marginLeft: '$8',
});

const StyledInput = styled('input', {
    width: '100%',
    color: 'inherit',
    padding: '$2',
    margin: '$2',
    fontSize: '16px'
});

const PasteButton = styled('button', {
    position: 'absolute',
    right: '12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '$textColors$secondary',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '4px',
    '&:hover': {
        color: '$colors$primary',
        backgroundColor: '$colors$dark10'
    },
    '&:active': {
        transform: 'scale(0.95)'
    }
});

const StyledLabel = styled(Text, {
    fontWeight: 'bold',
});

const StyledObjectLabel = styled(Text, {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '$colors$primary',
});

const StyledErrorText = styled(Text, {
    color: 'red',
    fontSize: '12px',
});

const JsonFormEditor = ({ jsonValue, schema, validationErrors, onChange, onValidate }) => {
    // Handle case where schema or schema.definitions is missing
    const schemaDefinition = schema?.definitions && schema.$ref
        ? schema.definitions[schema.$ref.replace('#/definitions/', '')]
        : schema; // Fall back to schema directly if no definitions or $ref

    const properties = schemaDefinition?.properties || schema?.properties || {};

    // Safely parse JSON and handle potential errors
    const parseJsonValue = useCallback((value: string) => {
        try {
            const parsed = value ? JSON.parse(value) : {};
            return parsed.value || {};
        } catch (e) {
            console.error('Failed to parse JSON value:', e);
            return {};
        }
    }, []);

    // Local state for display - this is what the user sees and types into
    const [localValues, setLocalValues] = useState(() => parseJsonValue(jsonValue));
    const [errors, setErrors] = useState({}); // State for validation errors

    // Refs to track state without causing re-renders
    const localValuesRef = useRef(localValues);
    const isDirtyRef = useRef(false);
    const isExternalUpdateRef = useRef(false);

    // Update ref whenever local values change
    useEffect(() => {
        localValuesRef.current = localValues;
    }, [localValues]);

    // Sync with external changes (e.g., switching between editor modes)
    useEffect(() => {
        const parsed = parseJsonValue(jsonValue);
        const currentLocal = localValuesRef.current;

        // Only update if this is an external change (not from our own commit)
        // and the values are actually different
        if (!isDirtyRef.current && JSON.stringify(parsed) !== JSON.stringify(currentLocal)) {
            isExternalUpdateRef.current = true;
            setLocalValues(parsed);
            setErrors({});
        }
    }, [jsonValue, parseJsonValue]);

    // memoize validation schema so we don't rebuild on every keystroke
    const validationSchema = useMemo(() => {
        return yup.object().shape(createValidationSchema(properties));
    }, [properties]);

    // Validation function
    const validateValues = useCallback(async (vals) => {
        try {
            await validationSchema.validate(vals, { abortEarly: false });
            setErrors({});
            onValidate?.(true);
            return true;
        } catch (err: any) {
            const formattedErrors = (err.inner || []).reduce((acc, curr) => {
                acc[curr.path] = curr.message;
                return acc;
            }, {} as Record<string, string>);
            setErrors(formattedErrors);
            onValidate?.(false);
            return false;
        }
    }, [validationSchema, onValidate]);

    // Commit changes to parent
    const commitChanges = useCallback(() => {
        if (!isDirtyRef.current) return;

        const currentValues = localValuesRef.current;
        let currentJson: Record<string, any>;

        try {
            currentJson = jsonValue ? JSON.parse(jsonValue) : { value: {} };
        } catch {
            currentJson = { value: {} };
        }

        const updatedJSON = {
            ...currentJson,
            value: currentValues,
        };

        const updatedJsonString = JSON.stringify(updatedJSON, null, 2);

        // Validate and propagate
        validateValues(currentValues);
        onChange?.(updatedJsonString);

        // Mark as clean
        isDirtyRef.current = false;
    }, [jsonValue, onChange, validateValues]);

    // Handle input changes - update local state immediately
    const handleChange = useCallback((fieldPath: string, newValue: any) => {
        setLocalValues(prev => {
            const updated = { ...prev } as any;
            set(updated, fieldPath, newValue);
            return updated;
        });

        // Mark as dirty
        isDirtyRef.current = true;
    }, []);

    // Handle blur - commit changes when user leaves a field
    const handleBlur = useCallback(() => {
        commitChanges();
    }, [commitChanges]);

    // Setup cleanup handlers for page navigation, visibility changes, etc.
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                commitChanges();
            }
        };

        const handleBeforeUnload = () => {
            commitChanges();
        };

        // Commit on scroll (debounced via the scroll end)
        let scrollTimeout: NodeJS.Timeout;
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                commitChanges();
            }, 150);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('scroll', handleScroll, true);
            clearTimeout(scrollTimeout);
            // Final commit on unmount
            commitChanges();
        };
    }, [commitChanges]);

    // Handle paste from clipboard
    const handlePaste = async (fieldPath: string) => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                handleChange(fieldPath, text);
                commitChanges();
                // Show success feedback
                const button = document.getElementById(`paste-button-${fieldPath}`);
                if (button) {
                    const originalHTML = button.innerHTML;
                    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`;
                    setTimeout(() => {
                        if (button) button.innerHTML = originalHTML;
                    }, 2000);
                }
            }
        } catch (err) {
            console.error('Failed to read from clipboard:', err);
        }
    };

    // Render a single field
    const renderField = (key: string, fieldPath: string = key) => {
        const value = get(localValues, fieldPath);
        const isAddressField = /address|addr|recipient|sender|from/i.test(key);

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return (
                <StyledField key={fieldPath}>
                    <StyledObjectLabel>{formatMainTitle(key)}</StyledObjectLabel>
                    {Object.keys(value).map((subKey) =>
                        renderField(subKey, `${fieldPath}.${subKey}`)
                    )}
                </StyledField>
            );
        } else if (Array.isArray(value)) {
            return (
                <StyledField key={fieldPath}>
                    <StyledObjectLabel>{formatMainTitle(key)}</StyledObjectLabel>
                    {value.map((item, index) => (
                        <StyledField key={`${fieldPath}[${index}]`}>
                            {Object.keys(item).map((subKey) =>
                                renderField(subKey, `${fieldPath}[${index}].${subKey}`)
                            )}
                        </StyledField>
                    ))}
                </StyledField>
            );
        } else {
            return (
                <StyledField key={fieldPath}>
                    <StyledLabel htmlFor={fieldPath}>{formatMainTitle(key)}</StyledLabel>
                    <>
                        <StyledInput
                            id={fieldPath}
                            name={fieldPath}
                            type="text"
                            onChange={(e) => handleChange(fieldPath, e.target.value)}
                            onBlur={handleBlur}
                            value={value ?? ''}
                            style={isAddressField ? { paddingRight: '40px' } : {}}
                        />
                        {isAddressField && (
                            <PasteButton
                                id={`paste-button-${fieldPath}`}
                                onClick={() => handlePaste(fieldPath)}
                                title="Paste from clipboard"
                            >
                                <IconWrapper icon={<Clipboard size={16} />} />
                            </PasteButton>
                        )}
                    </>
                    {errors[fieldPath] && <StyledErrorText>{errors[fieldPath]}</StyledErrorText>}
                </StyledField>
            );
        }
    };

    return (
        <StyledDivForContainer>
            <ErrorStack validationErrors={validationErrors} />
            <StyledFormWrapper>
                {Object.keys(localValues).map((key) => renderField(key, key))}
            </StyledFormWrapper>
        </StyledDivForContainer>
    );
};

const StyledDivForContainer = styled('div', {
    margin: '$2',
    color: '$textColors$secondary',
});

const StyledFormWrapper = styled('div', {
    textColor: '$textColors$secondary',
    fontSize: '12px',
    fontFamily: 'Inter',
});

function formatMainTitle(title) {
    // First handle snake_case by replacing underscores with spaces
    let formattedTitle = title.replace(/_/g, ' ');

    // Then handle camelCase by adding spaces before capital letters
    formattedTitle = formattedTitle.replace(/([A-Z])/g, ' $1').trim();

    // Capitalize the first letter of each word
    formattedTitle = formattedTitle.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return formattedTitle;
}

export default JsonFormEditor;
