import {
  Button,
  Card,
  CardContent,
  ToggleSwitch,
  Tooltip,
} from 'components/ui-blocks'
import React, { useState } from 'react'
import { ExecutionConfiguration } from 'intentojs/dist/codegen/intento/intent/v1/flow'

type ConfigurationProps = {
  config: ExecutionConfiguration
  useAndForComparisons: boolean
  disabled?: boolean
  onChange: (config: ExecutionConfiguration, useAndForComparisons: boolean) => void
}

export const Configuration = ({
  config,
  useAndForComparisons,
  disabled,
  onChange,
}: ConfigurationProps) => {
  const [isConfigItemsShowing, _setConfigItemsShowing] = useState(!disabled)

  function saveResponses() {
    // Create a deep copy of the config to avoid mutation issues
    const newConfig = {
      ...config,
      saveResponses: !config.saveResponses
    }
    onChange(newConfig, useAndForComparisons)
  }

  function updatingDisabled() {
    // Create a deep copy of the config to avoid mutation issues
    const newConfig = {
      ...config,
      updatingDisabled: !config.updatingDisabled
    }
    onChange(newConfig, useAndForComparisons)
  }

  function stopOnFail() {
    // Create a deep copy of the config to avoid mutation issues
    const newConfig = {
      ...config,
      stopOnFailure: !config.stopOnFailure
    }
    onChange(newConfig, useAndForComparisons)
  }

  function stopOnSuccess() {
    // Create a deep copy of the config to avoid mutation issues
    const newConfig = {
      ...config,
      stopOnSuccess: !config.stopOnSuccess
    }
    onChange(newConfig, useAndForComparisons)
  }

  function stopOnTimeout() {
    // Create a deep copy of the config to avoid mutation issues
    const newConfig = {
      ...config,
      stopOnTimeout: !config.stopOnTimeout
    }
    onChange(newConfig, useAndForComparisons)
  }
  function fallback() {
    // Create a deep copy of the config to avoid mutation issues
    const newConfig = {
      ...config,
      walletFallback: !config.walletFallback
    }
    onChange(newConfig, useAndForComparisons)
  }
  function useAnd() {
    onChange(config, !useAndForComparisons)
  }

  return (
    <>
      {isConfigItemsShowing && (
        <Card
          css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
          variant="secondary"
          disabled
        >
          <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
            <Tooltip
              label={
                'If set to true, message responses i.e. outputs may be used as inputs for new flows'
              }
            ><Button
              variant="ghost"
              size="large"
              css={{ columnGap: '$4', margin: '$2' }}
              onClick={() => saveResponses()}
              iconLeft={
                <ToggleSwitch
                  id="saveresp"
                  name="msgsresp"
                  onChange={() => saveResponses()}
                  checked={config.saveResponses}
                  optionLabels={['Save money', 'Save Responses']}
                />
              }
            >
                Save Responses
              </Button></Tooltip>

            <Tooltip
              label={
                'If set to true, the flow settings can not be updated'
              }
            ><Button
              variant="ghost"
              size="large"
              css={{ columnGap: '$4', margin: '$2' }}
              onClick={() => updatingDisabled()}
              iconLeft={
                <ToggleSwitch
                  id="saveresp"
                  name="msgsresp"
                  onChange={() => updatingDisabled()}
                  checked={config.updatingDisabled}
                  optionLabels={['Save money', 'Save Responses']}
                />
              }
            >
                Updating Disabled
              </Button></Tooltip>
            <Tooltip
              label={'If set to true, stops on any errors that occur or when comparison can not be made due to missing response'}
            ><Button
              variant="ghost"
              size="large"
              css={{ columnGap: '$4', margin: '$2' }}
              onClick={() => stopOnFail()}
              iconLeft={
                <ToggleSwitch
                  id="needsuccess"
                  name="needsuccess"
                  onChange={() => stopOnFail()}
                  checked={config.stopOnFailure}
                  optionLabels={['needsuccess', 'dontstoponfail']}
                />
              }
            >
                Stop on Fail
              </Button></Tooltip>
            <Tooltip
              label={
                'If set to true, stops when execution of the messages was succesfull'
              }
            ><Button
              variant="ghost"
              size="large"
              css={{ columnGap: '$4', margin: '$2' }}
              onClick={() => stopOnSuccess()}
              iconLeft={
                <ToggleSwitch
                  id="needfail"
                  name="needfail"
                  onChange={() => stopOnSuccess()}
                  checked={config.stopOnSuccess}
                  optionLabels={['needfail', 'dont stop']}
                />
              }
            >
                Stop on Success
              </Button></Tooltip>
            <Tooltip
              label={
                'If set to true, stops when execution of the messages when message times out'
              }
            ><Button
              variant="ghost"
              size="large"
              css={{ columnGap: '$4', margin: '$2' }}
              onClick={() => stopOnTimeout()}
              iconLeft={
                <ToggleSwitch
                  id="timeout"
                  name="timeout"
                  onChange={() => stopOnTimeout()}
                  checked={config.stopOnTimeout}
                  optionLabels={['timeout', 'dont timeout']}
                />
              }
            >
                Stop on Timeout
              </Button></Tooltip>
            <Tooltip
              label={
                'If set to true, as a fallback, the owner balance is used to pay for local fees'
              }
            ><Button
              variant="ghost"
              size="large"
              css={{ columnGap: '$4', margin: '$2' }}
              onClick={() => fallback()}
              iconLeft={
                <ToggleSwitch
                  id="fallback"
                  name="fallback"
                  onChange={() => fallback()}
                  checked={config.walletFallback}
                  optionLabels={['no fallback', 'fallback']}
                />
              }
            >
                Wallet Fallback
              </Button></Tooltip>

            <Tooltip
              label={
                'If set to true, will use AND for comparisons. On default execution happends when any condition returns true.'
              }
            ><Button
              variant="ghost"
              size="large"
              css={{ columnGap: '$4', margin: '$2' }}
              onClick={() => useAnd()}
              iconLeft={
                <ToggleSwitch
                  id="and"
                  name="and"
                  onChange={() => useAnd()}
                  checked={useAndForComparisons}
                  optionLabels={['and', 'or']}
                />
              }
            >
                Use AND for Comparisons
              </Button></Tooltip>
          </CardContent>
        </Card >
      )}
    </>
  )
}
