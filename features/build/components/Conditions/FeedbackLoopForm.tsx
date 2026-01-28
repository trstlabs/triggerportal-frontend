import { Card, Text, Tooltip, Button, UnionIcon, ChevronIcon, Chevron, IconWrapper } from "components/ui-blocks"
import { Field } from "./Fields"
import { FeedbackLoop } from "intentojs/dist/codegen/intento/intent/v1/flow"
import ConditionDropdown from "./ConditionDropdown"
import { useState } from "react"
import { ICQConfigForm } from "./ICQConfigForm"


type FeedbackLoopFormProps = {
  feedbackLoop?: FeedbackLoop
  onChange: (value: FeedbackLoop) => void
  onSave?: () => void
  onCancel?: () => void
  setDisabled: () => void
}

export const FeedbackLoopForm = ({ feedbackLoop, onChange, setDisabled }: FeedbackLoopFormProps) => {
  const [showICQConfig, setShowICQConfig] = useState(false)
  const handleIcqChange = (value: any) => {
    let newConditions = feedbackLoop
    feedbackLoop.icqConfig = value
    onChange(newConditions)
  }
  const handleFieldChange = (field: keyof FeedbackLoop, value: any) => {
    const newValue = { ...feedbackLoop, [field]: value }
    onChange(newValue)
  }
  const emptyFields = () => {
    // const newValue = {
    //   flowId: BigInt(0),
    //   responseIndex: 0,
    //   msgsIndex: 0,
    //   responseKey: "",
    //   msgKey: "",
    //   valueType: "",
    //   fromIcq: false,
    // }
    onChange(undefined)
    setDisabled()
  }
  const valueTypeOptions = ['string', 'math.Int', 'sdk.Coin', 'sdk.Coins', '[]string', '[]math.Int', 'math.Dec']
  return (
    <Card
      variant="secondary"
      disabled
      css={{ padding: '$2', margin: '$2', marginTop: '$6' }}
    >
      <Tooltip
        label={
          "Use a response value as a value for a message"}>
        <Text variant="header" align="center" color="secondary" css={{ margin: '$6' }}> Feedback Loop
        </Text>
      </Tooltip>
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <Button
          variant="ghost"
          size="small"
          iconLeft={<UnionIcon />}
          onClick={() => emptyFields()}
        >Discard
        </Button>
      </div>
      <Field
        label="Flow ID (optional)"
        value={feedbackLoop?.flowId?.toString()}
        onChange={(e) => handleFieldChange('flowId', BigInt(e.target.value))}

      />
      <Field
        label="Response Index"
        tooltip="Index of the response object to parse from, optional for Interchain Query"
        value={feedbackLoop?.responseIndex}
        onChange={(e) => handleFieldChange('responseIndex', Number(e.target.value))}

        type="number"
      />
      <Field
        label="Response Key"
        tooltip="Key of the response message (e.g. Amount[0].Amount, FromAddress) "
        type="string"
        value={feedbackLoop?.responseKey}
        onChange={(e) => handleFieldChange('responseKey', e.target.value)}

      />
      <Field
        label="Message Index"
        tooltip="Index of the message to parse into"
        value={feedbackLoop?.msgsIndex}
        onChange={(e) => handleFieldChange('msgsIndex', Number(e.target.value))}

        type="number"
      />
      <Field
        label="Message Key"
        tooltip="Key of the message to replace (e.g. Amount[0].Amount, FromAddress) "
        type="string"
        value={feedbackLoop?.msgKey}
        onChange={(e) => handleFieldChange('msgKey', e.target.value)}

      />
      <ConditionDropdown
        label="Value Type"
        value={feedbackLoop?.valueType}
        onChange={(e) => handleFieldChange('valueType', e.target.value)}

        options={valueTypeOptions}
      />
      <Button css={{ margin: '$6' }}
        onClick={() => setShowICQConfig(!showICQConfig)}
        variant="ghost"
        iconRight={
          <IconWrapper
            size="medium"
            rotation="-90deg"
            color="tertiary"
            icon={showICQConfig ? <ChevronIcon rotation="-90deg" /> : <Chevron />}
          />}>
        Interchain Query
      </Button>
      {
        showICQConfig &&
        <ICQConfigForm
          icqConfig={feedbackLoop?.icqConfig}
          onChange={(value) => handleIcqChange(value)}
          setDisabled={() => setShowICQConfig(!showICQConfig)}
        />
      }
    </Card>
  )
}

