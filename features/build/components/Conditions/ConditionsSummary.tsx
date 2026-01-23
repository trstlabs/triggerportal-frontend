import {
  Text,
  Column,
  Inline,
} from 'components/ui-blocks'
import React from 'react'
import { ExecutionConditions, ExecutionConfiguration, Comparison, FeedbackLoop } from 'intentojs/dist/codegen/intento/intent/v1/flow'
import { convertMicroDenomToDenom, resolveDenomSync } from '../../../../util/conversion'

interface ConditionsSummaryProps {
  conditions?: ExecutionConditions
  configuration?: ExecutionConfiguration
}

export const ConditionsSummary: React.FC<ConditionsSummaryProps> = ({ conditions, configuration }) => {
  if (!conditions && !configuration) {
    return null;
  }

  // Helper function to describe a comparison operator
  const getOperatorDescription = (operator: number): string => {
    switch (operator) {
      case 0: return 'equals';
      case 1: return 'contains';
      case 2: return 'not contains';
      case 3: return 'smaller than';
      case 4: return 'larger than';
      case 5: return 'greater than or equal';
      case 6: return 'smaller than or equal';
      case 7: return 'starts with';
      case 8: return 'ends with';
      case 9: return 'not equal';
      default: return 'unknown operator';
    }
  };

  // Helper function to format a feedback loop description
  const formatFeedbackLoop = (loop: FeedbackLoop): string => {
    // Extract the field name from the path for more readable output
    const sourceParts = loop.responseKey.split('.');
    const targetParts = loop.msgKey.split('.');

    // Check for array notation like [0]
    let sourceField = sourceParts[sourceParts.length - 1];
    let targetField = targetParts[targetParts.length - 1];
    let sourceIndex = -1;
    let targetIndex = -1;

    // Extract array indices if present
    const sourceMatch = sourceField.match(/\[(\d+)\]/);
    if (sourceMatch) {
      sourceIndex = parseInt(sourceMatch[1]);
      sourceField = sourceParts[sourceParts.length - 2] || 'item';
    }

    const targetMatch = targetField.match(/\[(\d+)\]/);
    if (targetMatch) {
      targetIndex = parseInt(targetMatch[1]);
      targetField = targetParts[targetParts.length - 2] || 'item';
    }

    // Check if it's likely an amount field
    const isAmountField = sourceField.toLowerCase().includes('amount') || targetField.toLowerCase().includes('amount');

    let sourceDescription = `${sourceField}${sourceIndex >= 0 ? ` (item ${sourceIndex})` : ''}`;
    let targetDescription = `${targetField}${targetIndex >= 0 ? ` (item ${targetIndex})` : ''}`;

    if (isAmountField) {
      return `Use amount${sourceIndex >= 0 ? ` (item ${sourceIndex})` : ''} from message ${loop.responseIndex + 1} response as the amount${targetIndex >= 0 ? ` (item ${targetIndex})` : ''} for message ${loop.msgsIndex + 1}`;
    } else {
      return `Use ${sourceDescription} from message ${loop.responseIndex + 1} response as the ${targetDescription} for message ${loop.msgsIndex + 1}`;
    }
  };

  // Helper function to format a comparison description
  const formatComparison = (comp: Comparison): string => {
    // Check if this is an ICQ config comparison
    if (comp.icqConfig) {
      const { queryType, connectionId } = comp.icqConfig;
      const queryTypeName = queryType?.split('/')[1] || 'query';
      return `Check if ${queryTypeName} query response on connection ${connectionId} is ${getOperatorDescription(comp.operator)} ${comp.operand}`;
    }

    // Extract the field name from the path for more readable output
    const sourceParts = comp.responseKey?.split('.') || [];
    if (sourceParts.length === 0) {
      return `Check if condition is ${getOperatorDescription(comp.operator)} ${comp.operand}`;
    }

    // Check for array notation like [0]
    let sourceField = sourceParts[sourceParts.length - 1];
    let sourceIndex = -1;

    // Extract array index if present
    const sourceMatch = sourceField.match(/\[(\d+)\]/);
    if (sourceMatch) {
      sourceIndex = parseInt(sourceMatch[1]);
      sourceField = sourceParts[sourceParts.length - 2] || 'item';
    }

    // Check if it's likely an amount field and parse the operand
    const isAmountField = sourceField.toLowerCase().includes('amount');
    let sourceDescription = `${sourceField}${sourceIndex >= 0 ? ` (item ${sourceIndex})` : ''}`;

    if (isAmountField) {
      // Try to extract the amount and denom from the operand
      const match = comp.operand?.match(/([\d.]+)\s*([a-zA-Z]+)/);
      if (match) {
        const [_, amount, denom] = match;
        return `Check if amount${sourceIndex >= 0 ? ` (item ${sourceIndex})` : ''} from message ${comp.responseIndex + 1} response is ${getOperatorDescription(comp.operator)} ${convertMicroDenomToDenom(amount, 6)} ${resolveDenomSync(denom)}`;
      }
    }

    // Default format for non-amount fields or if parsing fails
    return `Check if ${sourceDescription} from message ${comp.responseIndex + 1} response is ${getOperatorDescription(comp.operator)} "${comp.operand}"`;
  };

  // Create the content to be displayed
  const content = (
    <Column css={{ gap: '$6' }}>

      {/* Feedback Loops */}
      {conditions?.feedbackLoops && conditions.feedbackLoops.length > 0 && (
        <Column css={{ gap: '$2', padding: '$3', background: '$colors$dark5', borderRadius: '8px' }}>
          <Text variant="primary" css={{ fontWeight: 'medium', fontSize: '14px' }}>Feedback Loops</Text>
          {conditions.feedbackLoops.map((loop, index) => (
            <Text key={`loop-${index}`} variant="body" color="tertiary" css={{ paddingLeft: '$4', fontSize: '12px' }}>
              • {formatFeedbackLoop(loop)}
            </Text>
          ))}
        </Column>
      )}

      {/* Comparisons */}
      {conditions?.comparisons && conditions.comparisons.length > 0 && (
        <Column css={{ gap: '$2', padding: '$3', background: '$colors$dark5', borderRadius: '8px' }}>
          <Text variant="primary" css={{ fontWeight: 'medium', fontSize: '14px' }}>Comparisons</Text>
          {conditions.comparisons.map((comp, index) => (
            <Text key={`comp-${index}`} variant="body" color="tertiary" css={{ paddingLeft: '$4', fontSize: '12px' }}>
              • {formatComparison(comp)}
            </Text>
          ))}
          {conditions.useAndForComparisons && (
            <Inline css={{ paddingLeft: '$4' }}>
              {conditions.useAndForComparisons ? <Text variant="body" color="tertiary" css={{ fontWeight: 'medium', fontSize: '12px' }}>  • Use AND for comparisons </Text> : <Text variant="body" color="tertiary" css={{ fontWeight: 'medium', fontSize: '12px' }}>  • Use OR for comparisons </Text>}
            </Inline>
          )}
          {conditions.comparisons?.find((comp) => comp.differenceMode) && (
            <Inline css={{ paddingLeft: '$4' }}>
              {conditions.comparisons?.find((comp) => comp.differenceMode) ? <Text variant="body" color="tertiary" css={{ fontWeight: 'medium', fontSize: '12px' }}>  • Use difference mode </Text> : <Text variant="body" color="tertiary" css={{ fontWeight: 'medium', fontSize: '12px' }}>  • Use static mode </Text>}
            </Inline>
          )}
        </Column>
      )}

      {/* Stoplights */}
      {conditions && (
        (conditions.stopOnSuccessOf?.length > 0 ||
          conditions.stopOnFailureOf?.length > 0 ||
          conditions.skipOnSuccessOf?.length > 0 ||
          conditions.skipOnFailureOf?.length > 0) && (
          <Column css={{ gap: '$2', padding: '$3', background: '$colors$dark5', borderRadius: '8px' }}>
            <Text variant="primary" css={{ fontWeight: 'medium', fontSize: '14px' }}>Flow Dependencies</Text>

            {conditions.stopOnSuccessOf && conditions.stopOnSuccessOf.length > 0 && (
              <Inline css={{ paddingLeft: '$4' }}>
                <Text variant="body" css={{ fontWeight: 'medium', fontSize: '12px' }}>Stop on success of flows: </Text>
                <Text variant="body" color="tertiary" css={{ fontSize: '12px' }}>{conditions.stopOnSuccessOf.join(', ')}</Text>
              </Inline>
            )}

            {conditions.stopOnFailureOf && conditions.stopOnFailureOf.length > 0 && (
              <Inline css={{ paddingLeft: '$4' }}>
                <Text variant="body" css={{ fontWeight: 'medium', fontSize: '12px' }}>Stop on failure of flows: </Text>
                <Text variant="body" color="tertiary" css={{ fontSize: '12px' }}>{conditions.stopOnFailureOf.join(', ')}</Text>
              </Inline>
            )}

            {conditions.skipOnSuccessOf && conditions.skipOnSuccessOf.length > 0 && (
              <Inline css={{ paddingLeft: '$4' }}>
                <Text variant="body" css={{ fontWeight: 'medium', fontSize: '12px' }}>Skip on success of flows: </Text>
                <Text variant="body" color="tertiary" css={{ fontSize: '12px' }}>{conditions.skipOnSuccessOf.join(', ')}</Text>
              </Inline>
            )}

            {conditions.skipOnFailureOf && conditions.skipOnFailureOf.length > 0 && (
              <Inline css={{ paddingLeft: '$4' }}>
                <Text variant="body" css={{ fontWeight: 'medium', fontSize: '12px' }}>Skip on failure of flows: </Text>
                <Text variant="body" color="tertiary" css={{ fontSize: '12px' }}>{conditions.skipOnFailureOf.join(', ')}</Text>
              </Inline>
            )}

          </Column>
        )
      )}

      {/* Configuration */}
      {configuration && (
        <Column css={{ gap: '$2', padding: '$3', background: '$colors$dark5', borderRadius: '8px' }}>
          <Text variant="primary" css={{ fontWeight: 'medium', fontSize: '14px' }}>Configuration</Text>
          <Column css={{ gap: '$1' }}>
            {configuration.saveResponses && (
              <Text variant="body" color="tertiary" css={{ paddingLeft: '$4', fontSize: '12px' }}>• Save responses for conditional logic</Text>
            )}
            {configuration.updatingDisabled && (
              <Text variant="body" color="tertiary" css={{ paddingLeft: '$4', fontSize: '12px' }}>• Flow settings cannot be updated</Text>
            )}
            {configuration.stopOnFailure && (
              <Text variant="body" color="tertiary" css={{ paddingLeft: '$4', fontSize: '12px' }}>• Stop on any errors or missing responses</Text>
            )}
            {configuration.stopOnSuccess && (
              <Text variant="body" color="tertiary" css={{ paddingLeft: '$4', fontSize: '12px' }}>• Stop when execution is successful</Text>
            )}
            {configuration.stopOnTimeout && (
              <Text variant="body" color="tertiary" css={{ paddingLeft: '$4', fontSize: '12px' }}>• Stop when execution times out</Text>
            )}
            {configuration.walletFallback && (
              <Text variant="body" color="tertiary" css={{ paddingLeft: '$4', fontSize: '12px' }}>• Use owner balance as fallback for fees</Text>
            )}
          </Column>
        </Column>
      )}
    </Column>
  );

  // Otherwise just return the content
  return content;
};
