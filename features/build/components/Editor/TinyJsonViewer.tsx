import React, { useState } from 'react';
import { styled, Text, Inline } from 'components/ui-blocks';
import JsonViewer from './JsonViewer';
import { Dialog } from 'components/ui-blocks';

// Styled components to match Conditions and Configuration
const ActionCard = styled('div', {
  cursor: 'pointer',
  padding: '$4',
  margin: '$2',
  borderRadius: '$2',
  backgroundColor: '$colors$dark5',
  backdropFilter: 'blur(8px)',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: '$colors$light20',
  }
});

const ActionTitle = styled(Text, {
  fontWeight: '600',
  fontSize: '17px',
  letterSpacing: '-0.02em',
  marginBottom: '$3',
  color: '$colors$dark70',
  lineHeight: '1.3',
});

const ActionDescription = styled(Text, {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '$colors$dark70',
  marginBottom: '$2',
});

const ActionDetail = styled(Text, {
  fontSize: '13px',
  marginTop: '$1',
  color: '$colors$dark70',
  letterSpacing: '-0.01em',
});

const TokenAmount = styled(Text, {
  fontWeight: '600',
  fontSize: '14px',
  color: '$colors$dark90',
  letterSpacing: '-0.01em',
});

const NestedActionsContainer = styled('div', {
  marginTop: '$4',
  paddingTop: '$3',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'rgba(200, 200, 200, 0.2)',
  '& > div': {
    marginBottom: '$4',
    paddingLeft: '$3',
    paddingBottom: '$2',
    position: 'relative',
    '&:before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '4px',
      bottom: '4px',
      width: '2px',
      background: 'linear-gradient(to bottom, rgba(200, 200, 200, 0.3), rgba(200, 200, 200, 0.1))',
      borderRadius: '4px',
    },
    '&:last-child': {
      marginBottom: 0
    }
  }
});

const SecureTag = styled('div', {
  display: 'flex',
  alignItems: 'center',
  fontSize: '12px',
  fontWeight: '500',
  padding: '$1 $3',
  borderRadius: '12px',
  marginTop: '$3',
  width: 'fit-content',
  background: 'rgba(46, 204, 113, 0.12)',
  color: '$colors$dark70',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  backdropFilter: 'blur(8px)',
});

interface TinyJsonViewerProps {
  jsonValue: any;
  nested?: boolean;
  bgColor?: string;
}

// Modal component for expanded JSON view
interface JsonModalProps {
  isShowing: boolean;
  onRequestClose: () => void;
  data: any;
  bgColor?: string;
}

const JsonModal: React.FC<JsonModalProps> = ({ isShowing, onRequestClose, data, bgColor = '$colors$background' }) => {
  if (!isShowing) return null;

  // Calculate max width based on content length with reasonable bounds
  const jsonString = JSON.stringify(data);
  const contentLength = jsonString.length;

  // Set width based on content length with min and max bounds
  let modalWidth = Math.min(
    Math.max(500, contentLength * 0.7), // Base width on content length
    1200 // Max width
  );

  return (
    <Dialog isShowing={isShowing} onRequestClose={onRequestClose}>
      <div
        style={{
          maxWidth: `${modalWidth}px`,
          width: '150vw',
          maxHeight: '90vh',
          overflow: 'auto',
          backgroundColor: bgColor,
          borderRadius: '8px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div style={{
          padding: '24px',
          backgroundColor: bgColor,
          borderRadius: '8px'
        }}>
          <JsonViewer jsonValue={data} />
        </div>
      </div>
    </Dialog>
  );
};

const TinyJsonViewer: React.FC<TinyJsonViewerProps> = ({ jsonValue, bgColor }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  // Get a friendly description of what the message does
  const getMessageIntent = (typeUrl: string, value: any): string => {
    if (!typeUrl) return 'Unknown action';

    const messageType = typeUrl.split('.').pop()?.replace(/^Msg/, '') || 'Unknown';

    // Handle common message types
    switch (messageType.toLowerCase()) {
      case 'send': {
        let amount = '';
        let recipient = 'recipient';

        if (value && value.amount && Array.isArray(value.amount) && value.amount.length > 0) {
          const coin = value.amount[0];
          const amountValue = parseInt(coin.amount) / 1000000;
          const denom = coin.denom.replace(/^u/, '').toUpperCase();
          amount = `${amountValue} ${denom}`;
        }

        if (value && value.to_address) {
          recipient = value.to_address.substring(0, 8) + '...';
        }

        return amount ? `Send ${amount} to ${recipient}` : 'Send tokens to recipient';
      }

      case 'delegate': {
        let amount = '';
        let validator = 'validator';

        if (value && value.amount && value.amount.amount) {
          const amountValue = parseInt(value.amount.amount) / 1000000;
          const denom = value.amount.denom.replace(/^u/, '').toUpperCase();
          amount = `${amountValue} ${denom}`;
        }

        if (value && value.validator_address) {
          validator = value.validator_address.substring(0, 8) + '...';
        }

        return amount ? `Delegate ${amount} to ${validator}` : 'Delegate tokens to validator';
      }

      case 'undelegate': {
        let amount = '';
        let validator = 'validator';

        if (value && value.amount && value.amount.amount) {
          const amountValue = parseInt(value.amount.amount) / 1000000;
          const denom = value.amount.denom.replace(/^u/, '').toUpperCase();
          amount = `${amountValue} ${denom}`;
        }

        if (value && value.validator_address) {
          validator = value.validator_address.substring(0, 8) + '...';
        }

        return amount ? `Undelegate ${amount} from ${validator}` : 'Undelegate tokens from validator';
      }

      case 'beginredelegate': {
        let amount = '';
        let fromValidator = 'validator';
        let toValidator = 'new validator';

        if (value && value.amount && value.amount.amount) {
          const amountValue = parseInt(value.amount.amount) / 1000000;
          const denom = value.amount.denom.replace(/^u/, '').toUpperCase();
          amount = `${amountValue} ${denom}`;
        }

        if (value && value.validator_src_address) {
          fromValidator = value.validator_src_address.substring(0, 8) + '...';
        }

        if (value && value.validator_dst_address) {
          toValidator = value.validator_dst_address.substring(0, 8) + '...';
        }

        return amount ?
          `Redelegate ${amount} from ${fromValidator} to ${toValidator}` :
          'Redelegate tokens to a different validator';
      }

      case 'withdrawdelegatorreward': {
        let validator = 'validator';

        if (value && value.validator_address) {
          validator = value.validator_address.substring(0, 8) + '...';
        }

        return `Claim staking rewards from ${validator}`;
      }

      case 'vote': {
        let voteOption = '';
        let proposalId = '';

        if (value && value.option) {
          voteOption = value.option.toString().toLowerCase();
          // Convert numeric option to text
          if (voteOption === '1') voteOption = 'Yes';
          else if (voteOption === '2') voteOption = 'Abstain';
          else if (voteOption === '3') voteOption = 'No';
          else if (voteOption === '4') voteOption = 'No with Veto';
        }

        if (value && value.proposal_id) {
          proposalId = `#${value.proposal_id}`;
        }

        return voteOption ?
          `Vote ${voteOption} on proposal ${proposalId}` :
          'Vote on proposal';
      }

      case 'deposit': {
        let amount = '';
        let proposalId = '';

        if (value && value.amount && Array.isArray(value.amount) && value.amount.length > 0) {
          const coin = value.amount[0];
          const amountValue = parseInt(coin.amount) / 1000000;
          const denom = coin.denom.replace(/^u/, '').toUpperCase();
          amount = `${amountValue} ${denom}`;
        }

        if (value && value.proposal_id) {
          proposalId = `#${value.proposal_id}`;
        }

        return amount ?
          `Deposit ${amount} to proposal ${proposalId}` :
          'Deposit tokens to proposal';
      }

      case 'submitproposal':
        return 'Submit a new governance proposal';

      case 'instantiatecode':
      case 'instantiatecontract':
        return 'Create a new smart contract';

      case 'executecontract': {
        let contract = 'contract';

        if (value && value.contract) {
          contract = value.contract.substring(0, 6) + '.. ' + value.contract.substring(value.contract.length - 10, value.contract.length);
        }

        return `Execute smart contract ${contract}`;
      }

      case 'exec': {
        // Try to summarize the contained messages
        const nestedMsgs = [];

        if (value && value.msgs && Array.isArray(value.msgs)) {
          // Process each nested message
          for (const msg of value.msgs) {
            try {
              const parsedMsg = typeof msg === 'string' ? JSON.parse(msg) : msg;
              // Get the type and value of the nested message
              const typeUrl = parsedMsg.typeUrl || parsedMsg['@type'] || parsedMsg.type_url;
              const msgValue = parsedMsg.value || parsedMsg;

              if (typeUrl) {
                // Get a descriptive summary of this message
                const msgIntent = getMessageIntent(typeUrl, msgValue);
                nestedMsgs.push(msgIntent);
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        }

        if (nestedMsgs.length > 0) {
          return `Contains: ${nestedMsgs.join(', ')}`;
        }

        return `Batch of ${value.msgs?.length || 0} actions`;
      }

      case 'storetcode':
        return 'Upload a smart contract';

      case 'transfer': {
        let amount = '';
        let recipient = 'recipient';
        let channel = '';

        if (value && value.token && value.token.amount) {
          const amountValue = parseInt(value.token.amount) / 1000000;
          const denom = value.token.denom.replace(/^u/, '').toUpperCase();
          amount = `${amountValue} ${denom}`;
        }

        if (value && value.receiver) {
          recipient = value.receiver.substring(0, 8) + '...';
        }

        if (value && value.channel_id) {
          channel = `via ${value.channel_id}`;
        }

        return amount ?
          `Transfer ${amount} to ${recipient} ${channel}`.trim() :
          'Transfer tokens via IBC';
      }

      default:
        // Generic description based on the message type
        return messageType.replace(/([A-Z])/g, ' $1').trim();
    }
  };

  // Format an amount with its denomination
  const formatAmount = (amount: any): string => {
    if (!amount) return '';

    if (typeof amount === 'object' && amount.amount && amount.denom) {
      const value = parseInt(amount.amount) / 1000000;
      const denom = amount.denom.replace(/^u/, '').toUpperCase();
      return `${value} ${denom}`;
    }

    if (Array.isArray(amount) && amount.length > 0) {
      return amount.map(coin => formatAmount(coin)).join(', ');
    }

    if (typeof amount === 'string') {
      const match = amount.match(/^(\d+)(.*)$/);
      if (match) {
        const [, value, denom] = match;
        return `${parseInt(value) / 1000000} ${denom.replace(/^u/, '').toUpperCase()}`;
      }
    }

    return String(amount);
  };

  // Helper function to safely parse JSON strings
  const safeJsonParse = (str: string): any => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return { error: 'Invalid message format' };
    }
  };

  // Render a message in a clean style
  const renderAction = () => {
    if (!jsonValue) return <Text>No action data</Text>;

    // Handle MsgExec specially
    if (jsonValue['@type'] && jsonValue['@type'].includes('MsgExec') ||
      (jsonValue.typeUrl && jsonValue.typeUrl.includes('MsgExec'))) {
      // Extract the value object which contains the msgs array
      const valueObj = jsonValue.value || jsonValue;


      // Try different ways to access the msgs array
      let msgs = [];
      if (valueObj.msgs && Array.isArray(valueObj.msgs)) {
        msgs = valueObj.msgs;
      } else if (valueObj.value && valueObj.value.msgs && Array.isArray(valueObj.value.msgs)) {
        msgs = valueObj.value.msgs;
      }

      // If we still don't have msgs, try to parse the jsonValue as a string
      if (msgs.length === 0 && typeof jsonValue === 'string') {
        try {
          const parsed = JSON.parse(jsonValue);
          if (parsed.value && parsed.value.msgs) {
            msgs = parsed.value.msgs;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      // Special handling for the URL format in the example
      if (msgs.length === 0 && typeof jsonValue === 'object' && jsonValue.msgs) {
        const parentMsgs = jsonValue.msgs;
        if (Array.isArray(parentMsgs)) {
          msgs = parentMsgs.map(msg => {
            if (typeof msg === 'string') {
              try {
                const parsed = safeJsonParse(msg);
                console.log('Parsed message:', parsed);
                return parsed;
              } catch (e) {
                console.error('Error parsing message string:', e);
                return msg;
              }
            }
            return msg;
          });
        }
      }

      // If we're still not finding messages, try one more approach with the specific URL format
      if (msgs.length === 0 && typeof jsonValue === 'string') {
        try {
          // This handles the case where the entire jsonValue is a string that needs parsing
          const parsed = safeJsonParse(jsonValue);
          if (parsed && parsed.value && parsed.value.msgs) {
            msgs = parsed.value.msgs;
          }
        } catch (e) {
          console.error('Error parsing jsonValue as string:', e);
        }
      }

      // Extract and summarize the actual messages
      const nestedMessages = [];

      if (Array.isArray(msgs) && msgs.length > 0) {
        for (const msg of msgs) {
          try {
            // Parse the message if it's a string
            const parsedMsg = typeof msg === 'string' ? safeJsonParse(msg) : msg;

            // Get the type and value of the nested message
            const typeUrl = parsedMsg.typeUrl || parsedMsg['@type'] || parsedMsg.type_url;
            const msgValue = parsedMsg.value || parsedMsg;

            if (typeUrl) {
              // Get a descriptive summary of this message
              const msgIntent = getMessageIntent(typeUrl, msgValue);
              nestedMessages.push({
                typeUrl,
                value: msgValue,
                summary: msgIntent
              });
            }
          } catch (e) {
            console.error('Error processing nested message:', e);
            // Skip parsing errors
          }
        }
      }
      // Remove duplicate messages for cleaner display
      const uniqueMessages = [];
      const seenSummaries = new Set();

      for (const msg of nestedMessages) {
        // Create a key based on the message summary and type to detect duplicates
        const key = `${msg.typeUrl}:${msg.summary}`;
        if (!seenSummaries.has(key)) {
          seenSummaries.add(key);
          uniqueMessages.push(msg);
        }
      }

      // Get unique summaries for the description
      const uniqueSummaries = uniqueMessages.map(msg => msg.summary);

      return (
        <ActionCard>
          <ActionTitle>
            {uniqueMessages.length === 1 ?
              uniqueMessages[0].summary :
              `Batch: ${uniqueMessages.length} actions`}
          </ActionTitle>

          {/* Only show the description if it's different from the title */}
          {uniqueMessages.length > 1 && (
            <ActionDescription>
              {uniqueSummaries.join(', ')}
            </ActionDescription>
          )}

          <SecureTag>
            <span style={{ marginRight: '4px' }}>🔒</span> Secure Execution
          </SecureTag>

          {/* Only show the nested container if we have multiple messages */}
          {uniqueMessages.length > 1 && (
            <NestedActionsContainer>
              <ActionDetail css={{ marginBottom: '$2' }}>
                This action contains:
              </ActionDetail>
              {uniqueMessages.map((msg, idx) => (
                <div key={idx}>
                  <ActionTitle style={{ fontSize: '14px', marginBottom: '4px' }}>{msg.summary}</ActionTitle>
                  {/* Display any relevant details from the message */}
                  {msg.value && msg.value.amount && (
                    <Inline css={{ marginTop: '$2', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ActionDetail>Amount</ActionDetail>
                      <TokenAmount>{formatAmount(msg.value.amount)}</TokenAmount>
                    </Inline>
                  )}
                  {msg.value && msg.value.validator_address && (
                    <Inline css={{ marginTop: '$2', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ActionDetail>Validator</ActionDetail>
                      <ActionDetail css={{ color: '$colors$secondary' }}>{msg.value.validator_address.substring(0, 8)}...</ActionDetail>
                    </Inline>
                  )}
                  {msg.value && msg.value.to_address && (
                    <Inline css={{ marginTop: '$2', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ActionDetail>Recipient</ActionDetail>
                      <ActionDetail css={{ color: '$colors$secondary' }}>{msg.value.to_address.substring(0, 8)}...</ActionDetail>
                    </Inline>
                  )}
                </div>
              ))}
            </NestedActionsContainer>
          )}

          {/* For single messages, show the details directly */}
          {uniqueMessages.length === 1 && uniqueMessages[0].value && (
            <div style={{ marginTop: '8px' }}>
              {uniqueMessages[0].value.amount && (
                <Inline css={{ marginTop: '$2', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ActionDetail>Amount</ActionDetail>
                  <TokenAmount>{formatAmount(uniqueMessages[0].value.amount)}</TokenAmount>
                </Inline>
              )}
              {uniqueMessages[0].value.validator_address && (
                <Inline css={{ marginTop: '$2', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ActionDetail>Validator</ActionDetail>
                  <ActionDetail css={{ color: '$colors$secondary' }}>{uniqueMessages[0].value.validator_address.substring(0, 8)}...</ActionDetail>
                </Inline>
              )}
            </div>
          )}
        </ActionCard>
      );
    }

    // Extract type URL and value
    let typeUrl, value;
    if (jsonValue['@type']) {
      typeUrl = jsonValue['@type'];
      value = jsonValue;
    } else if (jsonValue.type_url || jsonValue.typeUrl) {
      typeUrl = jsonValue.type_url || jsonValue.typeUrl;
      value = jsonValue;
    } else {
      typeUrl = 'Unknown';
      value = jsonValue;
    }

    const intent = getMessageIntent(typeUrl, value);
    const messageType = typeUrl.split('.').pop()?.replace(/^Msg/, '') || 'Unknown';

    // Extract key details based on message type
    let details = [];

    if (messageType.toLowerCase() === 'send') {
      if (value.amount) {
        details.push({
          label: 'Amount',
          value: formatAmount(value.amount)
        });
      }
    } else if (messageType.toLowerCase().includes('delegate')) {
      if (value.amount) {
        details.push({
          label: 'Amount',
          value: formatAmount(value.amount)
        });
      }
    }

    return (
      <ActionCard>
        <ActionTitle>{intent}</ActionTitle>

        {details.length > 0 && details.map((detail, idx) => (
          <Inline key={idx} css={{ marginTop: '$2', justifyContent: 'space-between', alignItems: 'center' }}>
            <ActionDetail>{detail.label}</ActionDetail>
            <TokenAmount>{detail.value}</TokenAmount>
          </Inline>
        ))}
      </ActionCard>
    );
  };

  return (
    <>
      <JsonModal
        isShowing={isExpanded}
        onRequestClose={() => setIsExpanded(false)}
        data={jsonValue}
        bgColor={bgColor}
      />
      <div onClick={toggleExpand} style={{ cursor: 'pointer' }}>
        {renderAction()}
      </div>
    </>
  )
};

export default TinyJsonViewer;
