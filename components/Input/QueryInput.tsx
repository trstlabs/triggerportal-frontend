import { Inline, SearchIcon, Text } from 'components/ui-blocks'
import React, { HTMLProps, useEffect, useRef } from 'react'

type QueryInputProps = {
  searchQuery: string
  onQueryChange: (query: string) => void
} & HTMLProps<HTMLInputElement>

export const QueryInput = ({
  searchQuery,
  onQueryChange,
  ...inputProps
}: QueryInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()

    return () => {
      onQueryChange('')
    }
  }, [onQueryChange])

  return (
    <Inline gap={5} css={{ margin: '0 $7', width: '100%' }}>
      <SearchIcon color="tertiary" />
      <Text variant="secondary">
        <input
          ref={inputRef}
          type="text"
          lang="en-US"
          placeholder="Search..."
          value={searchQuery}
          onChange={({ target: { value } }) => onQueryChange(value)}
          autoComplete="off"
          style={{ width: '100%' }}
          {...inputProps}
        />
      </Text>
    </Inline>
  )
}
