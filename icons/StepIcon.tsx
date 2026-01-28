import { Inline, Text } from 'components/ui-blocks'

export const StepIcon = ({ step }) => {
  // Calculate padding based on the step number's length to maintain the aspect ratio
  const paddingSize = step.toString().length > 1 ? '$2' : '$3';

  return (
    <Inline
      css={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '30px', // Fixed width
        height: '30px', // Fixed height to maintain a 1:1 aspect ratio
        borderRadius: '50%', // Ensures a circular shape
        padding: `${paddingSize}`,
        backgroundColor: '$colors$brand20',
      }}
    >
      <Text color="brand" variant="link">
        {step}
      </Text>
    </Inline>
  )
}
