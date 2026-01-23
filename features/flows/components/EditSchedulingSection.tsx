import { Inline, Text, Button, styled, useControlTheme } from 'components/ui-blocks'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useState, useEffect } from 'react'
import { __TEST_MODE__ } from '../../../util/constants'

const StyledDatePicker = styled(DatePicker, {
  width: '165px',
  height: '32px',
  padding: '8px 6px',
  borderRadius: '4px',
  border: '1px solid $borderColors$selected',
  fontSize: '10px',
  color: '$colors$dark',
  backgroundColor: '$colors$light10',
  '&:focus': {
    outline: 'none',
    borderColor: '$primary'
  },
  '& .react-datepicker': {
    fontFamily: 'inherit',
  },
  '& .react-datepicker__header': {
    backgroundColor: '$colors$light',
  },
  '& .react-datepicker__current-month': {
    color: '$colors$text',
  },
  '& .react-datepicker-time__header': {
    color: '$colors$text',
  },
  '& .react-datepicker__day-name': {
    color: '$colors$text',
  },
  '& .react-datepicker__day': {
    color: '$colors$text',
  },
  '& .react-datepicker__time-name': {
    color: '$colors$text',
  },
  '& .react-datepicker__time-container': {
    width: '100px',
  },
  '& .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box': {
    width: '100%',
  },
  '& .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list': {
    backgroundColor: '$colors$dark90',
  },
  '& .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li': {
    color: '$colors$text',
  },
})

const intervalOptions = [
  { label: 'None', value: 0 },
  __TEST_MODE__ ? { label: '1 minute', value: 60 * 1000 } : { label: '30 minutes', value: 30 * 60 * 1000 },
  __TEST_MODE__ ? { label: '2 minutes', value: 2 * 60 * 1000 } : { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '2 hours', value: 2 * 60 * 60 * 1000 },
  { label: '3 hours', value: 3 * 60 * 60 * 1000 },
  { label: '4 hours', value: 4 * 60 * 60 * 1000 },
  { label: '6 hours', value: 6 * 60 * 60 * 1000 },
  { label: '8 hours', value: 8 * 60 * 60 * 1000 },
  { label: '12 hours', value: 12 * 60 * 60 * 1000 },
  { label: '1 day', value: 24 * 60 * 60 * 1000 },
  { label: '2 days', value: 2 * 24 * 60 * 60 * 1000 },
  { label: '3 days', value: 3 * 24 * 60 * 60 * 1000 },
  { label: '4 days', value: 4 * 24 * 60 * 60 * 1000 },
  { label: '5 days', value: 5 * 24 * 60 * 60 * 1000 },
  { label: '1 week', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '2 weeks', value: 14 * 24 * 60 * 60 * 1000 },
  { label: '3 weeks', value: 21 * 24 * 60 * 60 * 1000 },
  { label: '4 weeks', value: 28 * 24 * 60 * 60 * 1000 },
  { label: '1 month', value: 30 * 24 * 60 * 60 * 1000 },
  { label: '2 months', value: 60 * 24 * 60 * 60 * 1000 },
  { label: '3 months', value: 90 * 24 * 60 * 60 * 1000 },
  { label: '6 months', value: 180 * 24 * 60 * 60 * 1000 }
]

type EditSchedulingSectionProps = {
  updatedFlowParams: {
    startAt?: number;
    interval?: number;
    endTime?: number
  }
  startAt?: number
  interval?: number
  endTime?: number
  setUpdateFlow: (params: { startAt?: number | Date; interval?: number; endTime?: number | Date }) => void
  isExecutingUpdateFlow?: boolean
  updateOnButtonClick?: boolean
  disableRecurring?: boolean
}

export function EditSchedulingSection({
  updatedFlowParams,
  setUpdateFlow,
  isExecutingUpdateFlow,
  updateOnButtonClick = false,
  disableRecurring = false,
}: EditSchedulingSectionProps) {

  const StyledDiv = styled('div', {

    padding: '$4',
    borderRadius: '$2',
  })

  const StyledGrid = styled('div', {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '$6',
  })

  const themeController = useControlTheme()
  // Local state for editing
  const [startAt, setStartAt] = useState<Date | null>(updatedFlowParams.startAt ? new Date(updatedFlowParams.startAt) : null)
  const [interval, setInterval] = useState<number>(updatedFlowParams.interval || intervalOptions[0].value)
  const [endTime, setEndTime] = useState<Date | null>(updatedFlowParams.endTime ? new Date(updatedFlowParams.endTime) : null)
  // Duration in ms between start and end when using the "End after" select
  const [endTimeInterval, setEndTimeInterval] = useState<number>(0)

  const handleEndTimeChange = (date: Date) => {
    setEndTime(date)
    updateField('endTime', date)
  }

  const handleEndTimeIntervalChange = (value: number) => {

    setEndTimeInterval(value)

    const start = startAt && startAt.getTime() > 0 ? startAt.getTime() : Date.now() + 60000 * 5

    const newEndTime = new Date(start + value)
    setEndTime(newEndTime)
    updateField('endTime', newEndTime)

  }

  useEffect(() => {
    if (updatedFlowParams.startAt) {
      setStartAt(new Date(updatedFlowParams.startAt))
    }
    if (disableRecurring && updatedFlowParams.interval !== undefined) {
      setInterval(0)
      setStartAt(null)

    } else if (updatedFlowParams.interval !== undefined) {
      setInterval(updatedFlowParams.interval)
    }
    if (updatedFlowParams.endTime) {
      const startMs = updatedFlowParams.startAt ?? interval
      const diff = Math.max(0, updatedFlowParams.endTime - startMs)
      setEndTime(new Date(updatedFlowParams.endTime))
      setEndTimeInterval(diff)
    }
  }, [updatedFlowParams])

  const handleRightAwayClick = () => {
    const now = new Date();
    // Round down seconds to 0 and add 10 minutes
    const tenMinutesFromNow = new Date(now);
    tenMinutesFromNow.setMinutes(tenMinutesFromNow.getMinutes() + 10);
    tenMinutesFromNow.setSeconds(0, 0);

    setStartAt(tenMinutesFromNow);
    updateField('startAt', tenMinutesFromNow);
  }

  const handleNoneClick = () => {

    setStartAt(null)
    updateField('startAt', 0)
  }

  const updateField = (field: string, value: any) => {
    if (!updateOnButtonClick) {
      const params: { startAt?: number | Date; interval?: number; endTime?: number | Date } = {};
      if (value !== undefined && value !== null) {
        params[field] = field === 'startAt' ? (value instanceof Date ? value.getTime() : value) : value;
      }
      console.log(params)
      setUpdateFlow(params);
    }
  };


  return (
    <StyledDiv>
      <StyledGrid>
        {!disableRecurring && <Inline gap={2} align="center" style={{ marginBottom: '$4' }}>
          <Text variant="caption" style={{ minWidth: '45px' }}>Start</Text>
          <Inline gap={1}>
            <StyledDatePicker
              selected={startAt}
              onChange={(date: Date) => {
                setStartAt(date)

                updateField('startAt', date)
              }}
              placeholderText="On First Run"
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"

            />
            <Button
              style={
                { marginLeft: '2px' }
              }
              variant="secondary"
              onClick={handleRightAwayClick}
              disabled={false}
            >
              Now
            </Button>
            <Button
              style={
                { marginLeft: '2px' }
              }
              variant="secondary"
              onClick={handleNoneClick}
              disabled={startAt == null}
            >
              None
            </Button>
          </Inline>
        </Inline>}

        <Inline gap={2} align="center" style={{ marginBottom: '$4' }}>
          <Text variant="caption" style={{ minWidth: '45px' }}>Interval</Text>
          <select
            value={disableRecurring ? 0 : interval}
            onChange={e => {
              if (disableRecurring) return
              const value = Number(e.target.value)
              setInterval(value)
              updateField('interval', value)
            }}
            disabled={disableRecurring}
            style={{
              width: '165px',
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid $borderColors$inactive',
              fontSize: '12px',
              color: themeController?.theme.name === 'dark' ? '#ffffff' : '#000000',
              backgroundColor: themeController?.theme.name === 'dark' ? '#1f1f1f' : '#ffffff',
            }}
          >
            {!disableRecurring && intervalOptions.map(option => (
              <option
                key={option.value}
                value={option.value}
                style={{ color: themeController?.theme.name === 'dark' ? '#ffffff' : '#000000', backgroundColor: themeController?.theme.name === 'dark' ? '#1f1f1f' : '#ffffff' }}
              >
                {option.label}
              </option>
            ))}
          </select>
        </Inline>

        <Inline gap={2} align="center" style={{ marginBottom: '$4' }}>
          <Text variant="caption" style={{ minWidth: '45px' }}>End</Text>
          <StyledDatePicker
            selected={endTime}
            onChange={handleEndTimeChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            minDate={startAt || new Date()}
            dateFormat="MMMM d, yyyy h:mm aa"
          />
          <select
            value={endTimeInterval}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              handleEndTimeIntervalChange(value);
            }}
            style={{
              width: '80px',
              padding: '8px',
              borderRadius: '4px',
              border: (endTime && startAt && endTime.getTime() === startAt.getTime() + endTimeInterval) ? '2px solid $borderColors$selected' : '0.5px solid $borderColors$inactive',
              fontSize: '10px',
              color: themeController?.theme.name === 'dark' ? '#ffffff' : '#000000',
              backgroundColor: themeController?.theme.name === 'dark' ? '#1f1f1f' : '#ffffff',
              marginLeft: '1px'
            }}
          >
            <option value={0}>Select</option>
            {intervalOptions.slice(2).map(option => (
              <option
                key={option.value}
                value={option.value}
                style={{ color: themeController?.theme.name === 'dark' ? '#ffffff' : '#000000', backgroundColor: themeController?.theme.name === 'dark' ? '#1f1f1f' : '#ffffff' }}
              >
                {option.label}
              </option>
            ))}
          </select>
        </Inline>

      </StyledGrid>
      {updateOnButtonClick && (
        <Button
          disabled={isExecutingUpdateFlow}
          onClick={() => {
            setUpdateFlow({
              startAt: startAt ? startAt.getTime() : undefined,
              interval,
              endTime: endTime ? endTime.getTime() : undefined,
            });
          }}
        >
          Update
        </Button>
      )}
    </StyledDiv>
  )
}
