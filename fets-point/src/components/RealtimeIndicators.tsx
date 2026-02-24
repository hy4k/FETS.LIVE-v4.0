import { useState, useEffect } from "react";
import { Wifi, WifiOff, Activity, Clock } from "lucide-react";
import { useRealtimeStatus } from "../hooks/useRealtime";
import { formatDistanceToNow } from "date-fns";

interface RealtimeIndicatorProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showLastUpdate?: boolean;
  className?: string;
}

export function RealtimeIndicator({
  size = "sm",
  showLabel = true,
  showLastUpdate = false,
  className = "",
}: RealtimeIndicatorProps) {
  const { isConnected, lastUpdate, reconnectAttempts } = useRealtimeStatus();
  const [isPulsing, setIsPulsing] = useState(false);

  // Trigger pulse animation on connection changes
  useEffect(() => {
    if (lastUpdate) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const containerClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={`flex items-center gap-2 ${containerClasses[size]} ${className}`}
    >
      {/* Connection Status Icon */}
      <div className="relative flex items-center">
        {isConnected ? (
          <div
            className={`rounded-full bg-green-500 ${sizeClasses[size]} ${
              isPulsing ? "animate-pulse" : ""
            }`}
          >
            <Wifi className={`${sizeClasses[size]} text-white p-0.5`} />
          </div>
        ) : (
          <div
            className={`rounded-full bg-red-500 ${sizeClasses[size]} animate-pulse`}
          >
            <WifiOff className={`${sizeClasses[size]} text-white p-0.5`} />
          </div>
        )}

        {/* Pulse ring for active updates */}
        {isConnected && isPulsing && (
          <div
            className={`absolute rounded-full bg-green-400 ${sizeClasses[size]} animate-ping opacity-75`}
          ></div>
        )}
      </div>

      {/* Status Label */}
      {showLabel && (
        <span
          className={`font-medium ${
            isConnected ? "text-green-600" : "text-red-600"
          }`}
        >
          {isConnected ? "Live" : "Offline"}
          {reconnectAttempts > 0 && ` (${reconnectAttempts} retries)`}
        </span>
      )}

      {/* Last Update Time */}
      {showLastUpdate && lastUpdate && (
        <span className="text-gray-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(lastUpdate, { addSuffix: true })}
        </span>
      )}
    </div>
  );
}

interface LiveDataBadgeProps {
  count?: number;
  label: string;
  isActive?: boolean;
  className?: string;
}

export function LiveDataBadge({
  count,
  label,
  isActive = false,
  className = "",
}: LiveDataBadgeProps) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-gray-100 text-gray-800 border border-gray-200"
        }`}
      >
        {typeof count !== "undefined" && (
          <span className="mr-1 font-bold">{count}</span>
        )}
        {label}
      </span>

      {/* Live indicator */}
      {isActive && (
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
        </span>
      )}
    </div>
  );
}

interface ActivityPulseProps {
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "green" | "blue" | "yellow" | "red";
  className?: string;
}

export function ActivityPulse({
  isActive = false,
  size = "md",
  color = "green",
  className = "",
}: ActivityPulseProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  const colorClasses = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  if (!isActive) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gray-300 rounded-full ${className}`}
      ></div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse`}
      ></div>
      <div
        className={`absolute inset-0 ${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-ping opacity-75`}
      ></div>
    </div>
  );
}

interface RealtimeStatusCardProps {
  title: string;
  subscriptions: { [key: string]: boolean };
  lastUpdate?: Date;
  className?: string;
}

export function RealtimeStatusCard({
  title,
  subscriptions,
  lastUpdate,
  className = "",
}: RealtimeStatusCardProps) {
  const allConnected = Object.values(subscriptions).every(Boolean);
  const connectedCount = Object.values(subscriptions).filter(Boolean).length;
  const totalCount = Object.keys(subscriptions).length;

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <RealtimeIndicator size="sm" showLabel={false} />
      </div>

      <div className="space-y-2">
        {Object.entries(subscriptions).map(([name, isConnected]) => (
          <div key={name} className="flex items-center justify-between">
            <span className="text-xs text-gray-600 capitalize">{name}</span>
            <ActivityPulse
              isActive={isConnected}
              size="sm"
              color={isConnected ? "green" : "red"}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Connected: {connectedCount}/{totalCount}
          </span>
          {lastUpdate && (
            <span>{formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
          )}
        </div>
      </div>
    </div>
  );
}
