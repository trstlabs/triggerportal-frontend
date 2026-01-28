import {

  Card,
  CardContent,
  Button,
  Text,
  Inline,
  Tooltip,
  ChevronIcon, Chevron,
  IconWrapper,
  PlusIcon,
} from 'components/ui-blocks'
import React, { useState } from 'react'
import { Comparison, ExecutionConditions, FeedbackLoop } from 'intentojs/dist/codegen/intento/intent/v1/flow'
import { FieldArray } from './Fields'
import { ComparisonForm } from './ComparisonForm'
import { FeedbackLoopForm } from './FeedbackLoopForm'


type ConditionsProps = {
  conditions: ExecutionConditions
  disabled?: boolean
  onChange: (conditions: ExecutionConditions) => void
}

export const Conditions = ({
  conditions,
  disabled,
  onChange,
}: ConditionsProps) => {

  const [showStoplights, setShowStoplights] = useState(false)
  const [showFeedbackLoops, setShowFeedbackLoops] = useState(false)
  const [showComparisons, setShowComparisons] = useState(false)

  const handleInputChange = (field: keyof ExecutionConditions, value: any) => {
    // Create a deep copy of the conditions to avoid mutation issues
    const newConditions = {
      ...conditions,
      [field]: Array.isArray(value) ? [...value] : value
    }
    onChange(newConditions)
  }

  const handleChangeComparison = (index, value: any) => {
    // Create a deep copy of the conditions to avoid mutation issues
    const newComparisons = [...conditions.comparisons];

    if (value === undefined) {
      newComparisons.splice(index, 1);
    } else {
      newComparisons[index] = value;
    }

    const newConditions = {
      ...conditions,
      comparisons: newComparisons
    };

    onChange(newConditions);
  }

  const handleChangeFeedbackLoop = (index, value: any) => {
    // Create a deep copy of the conditions to avoid mutation issues
    const newFeedbackLoops = [...conditions.feedbackLoops];

    if (value === undefined) {
      newFeedbackLoops.splice(index, 1);
    } else {
      newFeedbackLoops[index] = value;
    }

    const newConditions = {
      ...conditions,
      feedbackLoops: newFeedbackLoops
    };

    onChange(newConditions);
  }

  const handleAddFeedbackLoop = () => {
    const newValue: FeedbackLoop = {
      flowId: BigInt(0),
      responseIndex: 0,
      responseKey: "",
      valueType: "string",
      msgsIndex: 0,
      msgKey: "",
      differenceMode: false,
    }

    // Create a new conditions object with the updated feedbackLoops array
    const newConditions = {
      ...conditions,
      feedbackLoops: [...conditions.feedbackLoops, newValue]
    }

    onChange(newConditions)
  }

  const handleAddComparison = () => {
    const newValue: Comparison = {
      flowId: BigInt(0),
      responseIndex: 0,
      responseKey: "",
      valueType: "string",
      operator: -1,
      operand: "",
      differenceMode: false,
    }

    // Create a new conditions object with the updated comparisons array
    const newConditions = {
      ...conditions,
      comparisons: [...(conditions.comparisons || []), newValue]
    }

    onChange(newConditions)
  }



  return (
    <>
      {!disabled && (
        <Card
          css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
          variant="secondary"
          disabled>
          <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
            <Inline justifyContent="space-between" >
              <Button css={{ marginBottom: '$6' }}
                onClick={() => {
                  if (conditions.feedbackLoops[0] == undefined) {
                    handleAddFeedbackLoop();
                  }
                  setShowFeedbackLoops(!showFeedbackLoops)
                }}
                variant="ghost"
                iconRight={
                  <IconWrapper
                    size="medium"
                    rotation="-90deg"
                    color="tertiary"
                    icon={showFeedbackLoops ? <ChevronIcon rotation="90deg" /> : <Chevron />}
                  />}>
                Feedback Loops
              </Button>

            </Inline>

            {showFeedbackLoops &&
              conditions.feedbackLoops.map(((feedbackLoop, index) => (
                <FeedbackLoopForm
                  feedbackLoop={feedbackLoop}
                  onChange={(value) => handleChangeFeedbackLoop(index, value)}
                  setDisabled={() => setShowComparisons(!showComparisons)}
                />
              )))
            }
            {showFeedbackLoops && <Button css={{ marginBottom: '$6' }}
              onClick={() => handleAddFeedbackLoop()}
              variant="ghost"
              icon={
                <IconWrapper
                  size="medium"
                  rotation="-90deg"
                  color="tertiary"
                  icon={<PlusIcon />}
                />
              } />

            }
            <Inline justifyContent="space-between" >
              <Button css={{ marginBottom: '$6' }}
                onClick={() => {
                  if (conditions.comparisons[0] == undefined) {
                    handleAddComparison();
                  }
                  setShowComparisons(!showComparisons)
                }
                }
                variant="ghost"
                iconRight={
                  <IconWrapper
                    size="medium"
                    rotation="-90deg"
                    color="tertiary"
                    icon={showComparisons ? <ChevronIcon rotation="90deg" /> : <Chevron />}
                  />}>
                Comparisons</Button>

            </Inline>

            {showComparisons && (
              conditions.comparisons?.map(((comparison, index) =>
                <ComparisonForm
                  comparison={comparison}
                  onChange={(value) => handleChangeComparison(index, value)}
                  setDisabled={() => setShowComparisons(!showComparisons)}
                />

              )))
            }
            {showComparisons && <Button css={{ marginBottom: '$6' }}
              onClick={() => handleAddComparison()}
              variant="ghost"
              icon={
                <IconWrapper
                  size="medium"
                  rotation="-90deg"
                  color="tertiary"
                  icon={<PlusIcon />}
                />} />}
            <Button css={{ marginBottom: '$6' }}
              onClick={() => setShowStoplights(!showStoplights)}
              variant="ghost"
              iconRight={
                <IconWrapper
                  size="large"
                  rotation="-90deg"
                  color="tertiary"
                  icon={showStoplights ? <ChevronIcon rotation="90deg" /> : <Chevron />}
                />}>
              Stoplights
            </Button>
            {showStoplights && <>
              <Card
                variant="secondary"
                disabled
                css={{ padding: '$6', margin: '$2' }}
              >
                <Tooltip
                  label={
                    "Depend execution on result of other flows"}>
                  <Text variant="header" color="secondary" align="center" css={{ marginBottom: '$12', marginTop: '$12' }}>Stoplights </Text>
                </Tooltip>
                {/* <Text variant="body"> Depend execution on result of other intent-based flows</Text> */}
                {/* Add more UI elements to handle other properties of ExecutionConditions */}
                <FieldArray
                  label="Stop On Success Of "
                  values={conditions.stopOnSuccessOf}
                  onChange={(value) => handleInputChange('stopOnSuccessOf', value)}
                  disabled={false}
                />
                <FieldArray
                  label="Stop on Failure Of "
                  values={conditions.stopOnFailureOf}
                  onChange={(value) => handleInputChange('stopOnFailureOf', value)}
                  disabled={false}
                />
                <FieldArray
                  label="Skip On Error Of "
                  values={conditions.skipOnFailureOf}
                  onChange={(value) => handleInputChange('skipOnFailureOf', value)}
                  disabled={false}
                />
                <FieldArray
                  label="Skip On Success Of "
                  values={conditions.skipOnSuccessOf}
                  onChange={(value) => handleInputChange('skipOnSuccessOf', value)}
                  disabled={false}
                /></Card>
            </>
            }
          </CardContent >

        </Card>
      )
      }
    </ >
  )
}
