import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  chartTitle: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ChartErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Chart Error in ${this.props.chartTitle}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="h-80 flex items-center justify-center">
          <CardContent className="text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Unable to display chart</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {this.props.chartTitle} data is temporarily unavailable
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;