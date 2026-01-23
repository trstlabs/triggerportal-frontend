import { Dialog, Inline, useOnClickOutside } from 'components/ui-blocks'
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react'

import { MessageSelectorToggle } from './MessageSelectorToggle'
import { CosmosMessageSelector } from './CosmosMessageSelector'
import { schemaNames } from '../../../../util/scripts/schemas/msgs/schemaNames'

export const MessageSelector = ({
  index,
  msgTypeName,
  setSchema,
  setExample,
}: {
  index: number
  msgTypeName: string
  setSchema: Dispatch<SetStateAction<boolean>>
  setExample: (index: number, msg: any) => void
}): JSX.Element => {
  const wrapperRef = useRef<HTMLDivElement>()
  const [messageList, setMessageList] = useState<ListType[]>([])
  const [schemas, setSchemas] = useState<any>({})

  // Helper function to dynamically load schemas by name
  const loadSchemas = async () => {

    const loadedSchemas: any = {}
    for (const schemaName of schemaNames) {
      try {
        // Dynamically import each schema JSON file
        const schema = await import(`../../../../util/scripts/schemas/msgs/${schemaName}.json`)
        loadedSchemas[schemaName] = schema.default || schema
      } catch (error) {
        console.error(`Failed to load schema ${schemaName}:`, error)
      }
    }
    setSchemas(loadedSchemas)
  }

  useEffect(() => {
    loadSchemas()
  }, [])

  useEffect(() => {
    if (Object.keys(schemas).length > 0) {
      // Create message list only after schemas are loaded
      const msgList: ListType[] = Object.keys(schemas).map((key) => ({
        key,
        name: key.split('_').find((name) => name.includes('Msg')) || '',
        value: schemas[key],
      }))
      setMessageList(msgList)
    }
  }, [schemas])

  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [isInputForSearchFocused, setInputForSearchFocused] = useState(false)
  const [filteredMessageList, setFilteredMessageList] = useState([])
  const [isMessageListShowing, setMessageListShowing] = useState(false)

  useOnClickOutside([wrapperRef], () => {
    // setMessageListShowing(false)
  })

  useEffect(() => {
    const newList = filterMessageList(messageList, messageSearchQuery)
    setFilteredMessageList(newList)
  }, [messageList, messageSearchQuery])

  // Helper function to filter message list based on search query
  function filterMessageList(list, query) {
    return list.filter((message) =>
      message.name.toLowerCase().includes(query.toLowerCase())
    )
  }

  return (
    <Inline css={{ display: 'grid' }}>
      {isMessageListShowing && (
        <Dialog isShowing={true} onRequestClose={undefined}>
          <CosmosMessageSelector
            isInputForSearchFocused={isInputForSearchFocused}
            wrapperRef={wrapperRef}
            messageSearchQuery={messageSearchQuery}
            msgTypeName={msgTypeName}
            filteredMessageList={filteredMessageList}
            index={index}
            setMessageSearchQuery={setMessageSearchQuery}
            setInputForSearchFocused={setInputForSearchFocused}
            setSchema={setSchema}
            setExample={setExample}
            setMessageListShowing={setMessageListShowing}
          />
        </Dialog>
      )}
      {!isMessageListShowing && (
        <MessageSelectorToggle
          messageName={msgTypeName}
          isSelecting={isMessageListShowing}
          onToggle={() => setMessageListShowing((isShowing) => !isShowing)}
        />
      )}
    </Inline>
  )
}

export type ListType = { key: string; name: string; value: any }
