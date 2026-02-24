import { Loader2 } from "lucide-react";

interface LoadingFallbackProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  showLogo?: boolean;
}

export function LoadingFallback({
  message = "Loading...",
  size = "md",
  showLogo = true,
}: LoadingFallbackProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const containerClasses = {
    sm: "min-h-[200px]",
    md: "min-h-[400px]",
    lg: "min-h-[600px]",
  };

  return (
    <div
      className={`golden-theme flex items-center justify-center ${containerClasses[size]} relative`}
    >
      <div className="text-center relative z-10 px-4">
        {showLogo && (
          <div className="golden-logo inline-block mb-6 golden-pulse">
            <img
              src="/fets-point-logo.png"
              alt="FETS POINT"
              className="h-12 w-12 opacity-80"
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mb-4">
          <Loader2
            className={`${sizeClasses[size]} animate-spin text-yellow-400`}
          />
          <span className="golden-subtitle text-lg">{message}</span>
        </div>

        <div className="flex justify-center space-x-1 mb-2">
          <div
            className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>

        <p className="text-sm text-yellow-200 opacity-75">
          FETS POINT Operational Console
        </p>
      </div>
    </div>
  );
}

// Specialized loading components for different contexts
export function PageLoadingFallback({ pageName }: { pageName: string }) {
  return (
    <LoadingFallback
      message={`Loading ${pageName}...`}
      size="md"
      showLogo={true}
    />
  );
}

export function ComponentLoadingFallback({
  componentName,
}: {
  componentName: string;
}) {
  return (
    <LoadingFallback
      message={`Loading ${componentName}...`}
      size="sm"
      showLogo={false}
    />
  );
}

export function RouteLoadingFallback() {
  return (
    <div className="golden-theme min-h-screen flex items-center justify-center">
      <LoadingFallback
        message="Loading Application Module..."
        size="lg"
        showLogo={true}
      />
    </div>
  );
}
