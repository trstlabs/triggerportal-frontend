import { Button, IconWrapper, Inline, Union, styled } from 'components/ui-blocks'
import React, {
  Dispatch,
  MutableRefObject,
  SetStateAction,
} from 'react'
import { MessageSelectList } from './MessageSelectList'

import { QueryInput } from 'components//Input/QueryInput'


export const CosmosMessageSelector: React.FC<{
  isInputForSearchFocused: boolean
  wrapperRef: MutableRefObject<HTMLDivElement>
  messageSearchQuery: string
  msgTypeName: string
  filteredMessageList: any[]
  index: number
  setMessageSearchQuery: Dispatch<SetStateAction<string>>
  setInputForSearchFocused: Dispatch<SetStateAction<boolean>>
  setSchema: Dispatch<any>
  setExample: (index: number, msg: any) => void
  setMessageListShowing: Dispatch<SetStateAction<boolean>>
}> = ({
  isInputForSearchFocused,
  wrapperRef,
  messageSearchQuery,
  msgTypeName,
  filteredMessageList,
  index,
  setMessageSearchQuery,
  setInputForSearchFocused,
  setSchema,
  setExample,
  setMessageListShowing,
}) => {
    return (
      <>
        <StyledDivForContainer
          selected={isInputForSearchFocused}
          ref={wrapperRef}
        >
          <QueryInput
            searchQuery={messageSearchQuery}
            onQueryChange={setMessageSearchQuery}
            onFocus={() => {
              setInputForSearchFocused(true)
            }}
            onBlur={() => {
              setInputForSearchFocused(false)
            }}
          /><Button
            icon={<IconWrapper icon={<Union />} />}
            variant="ghost"
            onClick={() => setMessageListShowing(false)}
            iconColor="tertiary"
          />
        </StyledDivForContainer>
        <MessageSelectList
          activeMessage={msgTypeName}
          messageList={filteredMessageList}
          onSelect={(msgFile) => {
            console.log('generateDefaultObject1')
            // if (msgFile.value != null) {
            setSchema(msgFile.value)
            console.log('generateDefaultObject')
            // console.log(
            //   generateDefaultObject(
            //     msgFile.value,
            //     msgFile.value.definitions
            //   )
            // )
            setExample(index, {
              typeUrl: "/" + msgFile.key.replaceAll('_', '.'),
              value: generateDefaultObject(
                msgFile.value,
                msgFile.value.definitions
              ),
            })
            setMessageListShowing(false)
            // }
          }}
        />
      </>
    )
  }

function generateDefaultObject(schema: any, definitions: any): any {
  if (schema.$ref) {
    const refSchema = definitions[schema.$ref.replace('#/definitions/', '')]
    return generateDefaultObject(refSchema, definitions)
  } else if (schema.type === 'object') {
    const defaultObject: any = {}
    for (const key in schema.properties) {
      defaultObject[key] = generateDefaultObject(
        schema.properties[key],
        definitions
      )
    }
    return defaultObject
  } else if (schema.type === 'array') {
    return [generateDefaultObject(schema.items, definitions)]
  } else {
    return schema.default !== undefined ? schema.default : ''
  }
}

const selectedVariantForInputWrapper = {
  true: {
    boxShadow: '0 0 0 $space$1 $borderColors$selected',
  },
  false: {
    boxShadow: '0 0 0 $space$1 $colors$dark0',
  },
}

const StyledDivForContainer = styled(Inline, {
  borderRadius: '5px',
  transition: 'box-shadow .1s ease-out',
  variants: {
    selected: selectedVariantForInputWrapper,
  },
})
