import type { ErrorInfo, ReactNode } from "react"
import { Component } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-rose-50/80 dark:bg-rose-950/20 p-8 flex flex-col items-center justify-center font-sans">
          <div className="max-w-2xl w-full bg-background border border-destructive/20 rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive border-b border-destructive/10 pb-3">
              <span className="text-xl font-bold">⚠️ React Runtime Error</span>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-foreground text-sm">Error Message:</p>
              <pre className="p-3 bg-muted/50 rounded-lg text-xs font-mono overflow-auto max-h-[100px] border border-border text-destructive">
                {this.state.error?.toString()}
              </pre>
            </div>

            {this.state.errorInfo && (
              <div className="space-y-1">
                <p className="font-semibold text-foreground text-sm">Component Stack Trace:</p>
                <pre className="p-3 bg-muted/50 rounded-lg text-xs font-mono overflow-auto max-h-[300px] border border-border text-muted-foreground font-mono">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  window.location.reload()
                }}
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
