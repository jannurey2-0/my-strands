import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
    errorInfo: undefined
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // If a fallback UI is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-xl">Something went wrong</CardTitle>
                  <CardDescription>
                    We're sorry, but an unexpected error occurred.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/10 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">
                    Don't worry! This is likely a temporary issue. Here's what you can do:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-3">
                    <li>Click "Try Again" to retry the last action</li>
                    <li>Click "Refresh Page" to reload the entire page</li>
                    <li>If the problem persists, please contact support</li>
                  </ul>
                  <details className="mt-3">
                    <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                      Technical Details (for developers)
                    </summary>
                    <div className="mt-2 p-3 bg-destructive/5 rounded border border-destructive/20">
                      <p className="text-xs font-mono text-destructive break-all">{this.state.error?.toString()}</p>
                      {this.state.errorInfo && (
                        <details className="mt-2">
                          <summary className="text-xs text-destructive/80 cursor-pointer">Stack Trace</summary>
                          <pre className="text-xs mt-1 overflow-auto">{this.state.errorInfo.componentStack}</pre>
                        </details>
                      )}
                    </div>
                  </details>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={this.handleRetry} className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2"
                  >
                    Refresh Page
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/dashboard'}
                    className="flex items-center gap-2"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;