import {
  Button,
  ButtonWithDropdown,
  ChevronIcon,
  Column,
  Divider,
  Text,
  ValidIcon,
} from 'components/ui-blocks'

import { SortDirections, SortParameters } from '../hooks/useSortFlows'
type Props = {
  sortParameter: SortParameters
  sortDirection: SortDirections
  onSortParameterChange: (parameter: SortParameters) => void
  onSortDirectionChange: (direction: SortDirections) => void
}

export const ButtonWithDropdownForSorting = ({
  sortParameter,
  sortDirection,
  onSortParameterChange,
  onSortDirectionChange,
}: Props) => {
  function getSortByLabel() {
    if (sortParameter === 'id') {
      return 'Sort by ID'
    }
    if (sortParameter === 'label') {
      return 'Sort by Label'
    }
    if (sortParameter === 'start_time') {
      return 'Sort by Start Time'
    }
    if (sortParameter === 'end_time') {
      return 'Sort by End Time'
    }
    if (sortParameter === 'exec_time') {
      return 'Sort by Execution Time'
    }
    return `Sort by ${sortParameter}`
  }

  return (
    <ButtonWithDropdown
      label={getSortByLabel()}
      iconRight={<ChevronIcon rotation="-90deg" />}
      variant="ghost"
    >
      <Column css={{ padding: '$6 $6 $4' }}>
        <Button
          variant="ghost"
          onClick={() => onSortParameterChange('id')}
          selected={sortParameter === 'id'}
          iconLeft={
            <ValidIcon visible={sortParameter === 'id'} />
          }
        >
          TxID
        </Button>
        <Button
          variant="ghost"
          onClick={() => onSortParameterChange('label')}
          selected={sortParameter === 'label'}
          iconLeft={
            <ValidIcon visible={sortParameter === 'label'} />
          }
        >
          Label
        </Button>
        <Button
          variant="ghost"
          onClick={() => onSortParameterChange('exec_time')}
          selected={sortParameter === 'exec_time'}
          iconLeft={<ValidIcon visible={sortParameter === 'exec_time'} />}
        >
          Execution Time
        </Button>
        <Button
          variant="ghost"
          onClick={() => onSortParameterChange('start_time')}
          selected={sortParameter === 'start_time'}
          iconLeft={<ValidIcon visible={sortParameter === 'start_time'} />}
        >
          Start Time
        </Button>
        <Button
          variant="ghost"
          onClick={() => onSortParameterChange('end_time')}
          selected={sortParameter === 'end_time'}
          iconLeft={<ValidIcon visible={sortParameter === 'end_time'} />}
        >
          End Time
        </Button>
      </Column>
      <Divider />
      <Text variant="legend" css={{ padding: '$8 $6 $4' }}>
        Sorting order
      </Text>
      <Column css={{ padding: '0 $6 $6' }}>
        <Button
          variant="ghost"
          onClick={() => onSortDirectionChange('desc')}
          selected={sortDirection === 'desc'}
          iconLeft={<ValidIcon visible={sortDirection === 'desc'} />}
        >
          Descending
        </Button>
        <Button
          variant="ghost"
          onClick={() => onSortDirectionChange('asc')}
          selected={sortDirection === 'asc'}
          iconLeft={<ValidIcon visible={sortDirection === 'asc'} />}
        >
          Ascending
        </Button>
      </Column>
    </ButtonWithDropdown>
  )
}
