import { Card, Text, Tooltip, Button, UnionIcon, ChevronIcon, Chevron, IconWrapper, ToggleSwitch } from "components/ui-blocks"
import { Field } from "./Fields"
import { ComparisonOperator, Comparison } from "intentojs/dist/codegen/intento/intent/v1/flow"
import ConditionDropdown from "./ConditionDropdown"

import Dropdown from "./Dropdown"
import { useState } from "react"
import { ICQConfigForm } from "./ICQConfigForm"

type ComparisonFormProps = {
  comparison?: Comparison
  onChange: (value: Comparison) => void
  setDisabled: () => void
}

export const ComparisonForm = ({ comparison, onChange, setDisabled }: ComparisonFormProps) => {
  const [showICQConfig, setShowICQConfig] = useState(false)

  const handleIcqChange = (value: any) => {
    let newConditions = comparison
    newConditions.icqConfig = value
    onChange(newConditions)
  }

  const handleFieldChange = (field: keyof Comparison, value: any) => {
    const newValue = { ...comparison, [field]: value }
    onChange(newValue)
  }
  const emptyFields = () => {

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
          "Compare responses to determine if execution should take place"}>
        <Text variant="header" color="secondary" align="center" css={{ margin: '$6' }}> Comparison</Text>
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
        label="Response Index"
        tooltip="Index of the response object to parse, optional for Interchain Query"
        value={comparison?.responseIndex}
        onChange={(e) => handleFieldChange('responseIndex', Number(e.target.value))}

        type="number"
      />
      <Field
        label="Response Key"
        tooltip="Key of the response message, for example: Amount[0].Amount, FromAddress"
        type="string"
        value={comparison?.responseKey}
        onChange={(e) => handleFieldChange('responseKey', e.target.value)}

      />
      <ConditionDropdown
        label="Value Type"
        value={comparison?.valueType}
        onChange={(e) => handleFieldChange('valueType', e.target.value)}

        options={valueTypeOptions}
      />
      <Dropdown
        label="Comparison Operator"
        tooltip="How to compare"
        value={comparison?.operator ?? ComparisonOperator.UNRECOGNIZED}
        onChange={(e) => handleFieldChange('operator', Number(e.target.value))}

        options={ComparisonOperatorLabels}

      />
      <Field
        label="Comparison Operand"
        tooltip="What to compare with"
        type="string"
        value={comparison?.operand}
        onChange={(e) => handleFieldChange('operand', e.target.value)}

      />
      <Button
        variant="ghost"
        size="large"
        css={{ columnGap: '$4', margin: '$2' }}
        onClick={() => handleFieldChange('differenceMode', !comparison?.differenceMode)}
        iconLeft={
          <ToggleSwitch
            id="and"
            name="and"
            onChange={() => handleFieldChange('differenceMode', !comparison?.differenceMode)}
            checked={comparison?.differenceMode}
            optionLabels={['difference', 'static']}
          />
        }
      >
        Difference Mode
      </Button>
      <Field
        label="Flow ID (optional)"
        tooltip="Flow to get the latest response value from, optional"
        value={comparison?.flowId?.toString()}
        onChange={(e) => handleFieldChange('flowId', BigInt(Number(e.target.value)))}

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
          icqConfig={comparison?.icqConfig}
          onChange={(value) => handleIcqChange(value)}
          setDisabled={() => setShowICQConfig(!showICQConfig)}
        />
      }
    </Card>
  )
}


// Map enum values to human-readable labels
export const ComparisonOperatorLabels: { [key in ComparisonOperator]: string } = {
  [ComparisonOperator.EQUAL]: 'Equal',
  [ComparisonOperator.CONTAINS]: 'Contains',
  [ComparisonOperator.NOT_CONTAINS]: 'Not Contains',
  [ComparisonOperator.SMALLER_THAN]: 'Smaller Than',
  [ComparisonOperator.LARGER_THAN]: 'Larger Than',
  [ComparisonOperator.GREATER_EQUAL]: 'Greater Than or Equal',
  [ComparisonOperator.LESS_EQUAL]: 'Less Than or Equal',
  [ComparisonOperator.STARTS_WITH]: 'Starts With',
  [ComparisonOperator.ENDS_WITH]: 'Ends With',
  [ComparisonOperator.NOT_EQUAL]: 'Not Equal',
  [ComparisonOperator.UNRECOGNIZED]: 'Unrecognized'
}