import React from 'react'

export class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor (props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    // Update state to show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error and the error info
    console.error('Error occurred:', error)
    console.log('Error info:', errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}
