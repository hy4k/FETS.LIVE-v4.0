import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  routeName?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  retryAttempts: number;
}

export class LazyErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryAttempts: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `lazy_error_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(
      `LazyErrorBoundary caught an error in ${
        this.props.routeName || "unknown route"
      }:`,
      error,
      errorInfo
    );

    // Enhanced error logging for lazy loading issues
    console.group(`🔴 Lazy Loading Error - ${this.state.errorId}`);
    console.error("Route:", this.props.routeName);
    console.error("Error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    console.error("Retry Attempts:", this.state.retryAttempts);
    console.groupEnd();
  }

  handleRetry = () => {
    if (this.state.retryAttempts < this.maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: undefined,
        errorId: undefined,
        retryAttempts: prevState.retryAttempts + 1,
      }));
      this.props.onRetry?.();
    }
  };

  handleGoBack = () => {
    this.props.onGoBack?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryAttempts < this.maxRetries;

      // Route-specific error UI
      return (
        <div className="golden-theme min-h-[500px] flex items-center justify-center p-6">
          <div className="text-center max-w-lg bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-yellow-200">
            <div className="mb-6">
              <AlertTriangle className="h-20 w-20 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Failed to Load {this.props.routeName || "Module"}
              </h1>
              <p className="text-gray-600 mb-4">
                There was an issue loading this part of the application. This
                could be due to a network problem or a temporary issue.
              </p>

              {this.state.errorId && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Error ID:</strong> {this.state.errorId}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Retry attempts: {this.state.retryAttempts} /{" "}
                    {this.maxRetries}
                  </p>
                </div>
              )}
            </div>

            {/* Development error details */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 p-4 bg-red-50 rounded-lg text-left border border-red-200">
                <summary className="cursor-pointer font-medium text-red-800 hover:text-red-900">
                  🔧 Development Error Details
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Error Message:
                    </p>
                    <p className="text-sm text-red-700 font-mono bg-red-100 p-2 rounded">
                      {this.state.error.message}
                    </p>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Stack Trace:
                      </p>
                      <pre className="text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Loading ({this.maxRetries -
                    this.state.retryAttempts}{" "}
                  left)
                </button>
              )}

              {this.props.onGoBack && (
                <button
                  onClick={this.handleGoBack}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </button>
              )}

              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Reload App
              </button>
            </div>

            {!canRetry && (
              <p className="mt-4 text-sm text-red-600 font-medium">
                Maximum retry attempts reached. Please reload the application.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
