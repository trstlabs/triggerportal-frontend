import {
  Inline,
  Button,
  Column,
  Text,
  IconWrapper,
  Union,
  Divider,
  ToggleSwitch,
  Card,
  CardContent,
} from 'components/ui-blocks';
import React, { useEffect, useState } from 'react';
import JsonFormEditor from './DynamicForm';
import { JsonCodeMirrorEditor } from './CodeMirror';
import { findFileBySuffix } from './Validation';
import { ExampleChips, ExampleFlowChips } from './ExampleChips';
import { MessageSelector } from './MessageSelector';
import { UnionCallEditor } from './UnionCallEditor';

export const JsonFormWrapper = ({
  index,
  chainSymbol,
  universalId,
  msg,
  setExample,
  setAllMessages,
  handleRemoveMsg,
  handleChangeMsg,
  setIsJsonValid,
  selectedTemplateLabel,
}: {
  index: number
  chainSymbol: string
  universalId?: string
  msg: string
  setExample?: (index: number, msg: any) => void
  setAllMessages?: (msgs: any[]) => void
  handleRemoveMsg: (index: number) => void
  handleChangeMsg: (index: number) => (msg: string) => void
  setIsJsonValid: React.Dispatch<React.SetStateAction<boolean>>
  selectedTemplateLabel?: string | null
}): JSX.Element => {
  const [showJsonForm, setShowJsonForm] = useState(true)
  const [showUnionCallEditor, setShowUnionCallEditor] = useState(false)
  const extractedMsgTypeUrl =
    msg && msg.length > 32 && msg.split('.').find((name) => name.includes('Msg'));
  const extractedMsgPrefix =
    msg && msg.length > 32 && msg.split('/')[1]?.split('.')[0] + " ";
  const extractedMsgModule =
    msg && msg.length > 32 && msg.split('.')[1] + " ";
  const msgTypeNameFile = (extractedMsgTypeUrl && extractedMsgTypeUrl.split('"')[0]) || 'Unknown';
  const msgTypeName = extractedMsgPrefix
    ? extractedMsgPrefix.charAt(0).toUpperCase() +
    extractedMsgPrefix.slice(1) +
    (extractedMsgModule ? extractedMsgModule.charAt(0).toUpperCase() + extractedMsgModule.slice(1) : '') +
    ((extractedMsgTypeUrl && extractedMsgTypeUrl.split('"')[0]) || 'Unknown')
    : 'Unknown';
  const [schema, setSchema] = useState(() => {
    const initialSchema = findFileBySuffix(msgTypeNameFile)
    // If no schema found, return a basic schema that accepts any JSON object
    return initialSchema || {
      type: 'object',
      properties: {},
      additionalProperties: true
    }
  })
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  const [showCustom, setShowCustom] = useState(false)

  // Update schema when msg changes
  useEffect(() => {
    const newSchema = findFileBySuffix(msgTypeNameFile)
    if (newSchema) {
      setSchema(newSchema)
      setLastUpdated(Date.now())
    }
  }, [msg, msgTypeNameFile])

  return (
    <Card
      css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2', width: '100%' }}
      variant="secondary"
      disabled
    >
      <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
        {setExample && <ExampleFlowChips
          chainSymbol={chainSymbol}
          setAllMessages={setAllMessages}
          index={index}
          onCustom={() => setShowCustom(!showCustom)}
          onUnionCall={() => setShowUnionCallEditor(!showUnionCallEditor)}
          selectedTemplateLabel={selectedTemplateLabel}
        />}
        {showUnionCallEditor && (
          <UnionCallEditor
            destinationChainId={universalId}
            onChange={handleChangeMsg(index)}
            onClose={() => setShowUnionCallEditor(false)}
          />
        )}
        {showCustom && setExample && (
          <Inline css={{ justifyContent: 'space-between' }}>
            {(
              <MessageSelector
                msgTypeName={msgTypeName}
                setSchema={setSchema}
                setExample={setExample}
                index={index}
              />
            )}
            <Text variant="legend" color="disabled" align={'center'}>
              <a
                target={'_blank'}
                href="https://chat.openai.com/g/g-cRhoPo6YH-cosmonaut"
                rel="noopener noreferrer"
              >
                <b>Cosmonaut GPT</b>
              </a>
            </Text>
          </Inline>
        )}
        <Column>
          {showCustom && setExample && <ExampleChips
            chainSymbol={chainSymbol}
            setExample={setExample}
            messageIndex={index}
          />}
          {setExample && <Divider offsetY="$6" />}
          <div style={{ margin: '$4', padding: '$4' }}>
            <Inline css={{ justifyContent: 'space-between' }}>
              <Button
                variant="ghost"
                size="large"
                onClick={() => setShowJsonForm((show) => !show)}
                css={{ columnGap: '$12' }}
                disabled={false}
                iconRight={
                  <ToggleSwitch
                    id="advanced-toggle"
                    name="advanced-mode"
                    onChange={() => setShowJsonForm((show) => !show)}
                    checked={!showJsonForm}
                    optionLabels={['Advanced', 'Editor View']}
                  />
                }
              >
                Advanced mode
              </Button>
              {msg && msg.length > 32 && (
                <div style={{ display: 'flex', justifyContent: 'end' }}>
                  <Button
                    variant="ghost"
                    onClick={() => handleRemoveMsg(index)}
                  >
                    <IconWrapper icon={<Union />} />
                    Discard
                  </Button>
                </div>
              )}
            </Inline>

            {showJsonForm ? (
              <JsonFormEditor
                key={`json-editor-${index}-${lastUpdated}`}
                jsonValue={msg}
                schema={schema}
                validationErrors={[]}
                onChange={handleChangeMsg(index)}
                onValidate={(isValid) => {
                  setIsJsonValid(isValid)
                }}
              />
            ) : (
              <JsonCodeMirrorEditor
                key={`code-editor-${index}-${lastUpdated}`}
                jsonValue={msg}
                onChange={handleChangeMsg(index)}
                onValidate={(isValid) => {
                  setIsJsonValid(isValid)
                }}
              />
            )}
          </div>
        </Column>
      </CardContent>
    </Card>

  )
}
