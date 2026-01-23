import React from 'react';
import { styled, Text } from 'components/ui-blocks';

// Styled components
const StyledField = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '$2',
    marginLeft: '$8',
});

const StyledLabel = styled(Text, {
    fontWeight: 'bold',
});

const StyledObjectLabel = styled(Text, {
    fontWeight: 'bold',
    fontSize: '10px',
    color: '$colors$primary',
    background: '$gray200',
});

const StyledValue = styled('div', {
    padding: '$2',
    margin: '$2',
    background: '$gray200',
    borderRadius: '$2',
    fontSize: '12px',
});

const JsonViewer = ({ jsonValue }) => {
    const data = jsonValue || {};

    const renderField = (key, value, baseName = '') => {
        const fieldName = baseName ? `${baseName}.${key}` : key;

        if (typeof value === 'object' && !Array.isArray(value)) {
            return (
                <StyledField key={fieldName}>
                    <StyledObjectLabel>{formatMainTitle(key)}</StyledObjectLabel>
                    {Object.keys(value).map((subKey) => renderField(subKey, value[subKey], fieldName))}
                </StyledField>
            );
        } else if (Array.isArray(value)) {
            return (
                <StyledField key={fieldName}>
                    <StyledObjectLabel>{formatMainTitle(key)}</StyledObjectLabel>
                    {value.map((item, index) => (
                        <StyledField key={index}>
                            {Object.keys(item).map((subKey) => renderField(subKey, item[subKey], `${fieldName}[${index}]`))}
                        </StyledField>
                    ))}
                </StyledField>
            );
        } else {
            return (
                <StyledField key={fieldName}>
                    <StyledLabel>{formatMainTitle(key)}</StyledLabel>
                    <StyledValue>{value?.toString() || '-'}</StyledValue>
                </StyledField>
            );
        }
    };

    return <StyledDivForContainer>{Object.keys(data).map((key) => renderField(key, data[key]))}</StyledDivForContainer>;
};

const StyledDivForContainer = styled('div', {
    margin: '$2',
    color: '$textColors$secondary',
});

function formatMainTitle(title) {
    let formattedTitle = title.replace(/([A-Z])/g, ' $1').trim();
    formattedTitle = formattedTitle.charAt(0).toUpperCase() + formattedTitle.slice(1).toLowerCase();
    formattedTitle = formattedTitle.replace(/\s[a-z]/g, (match) => match.toUpperCase());
    return formattedTitle;
}

export default JsonViewer;
