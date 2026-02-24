import React, { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;

      const container = containerRef.current;
      if (!container) return;

      // Only allow pull-to-refresh when at the top of the container
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        setCanPull(true);
      }
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!canPull || disabled || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Prevent default scrolling when pulling down
        e.preventDefault();

        // Apply resistance to the pull
        const resistance = Math.max(0, Math.min(diff * 0.5, threshold * 1.5));
        setPullDistance(resistance);
      }
    },
    [canPull, disabled, isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!canPull || disabled || isRefreshing) return;

    setCanPull(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [canPull, disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  const refreshOpacity = Math.min(pullDistance / threshold, 1);
  const refreshRotation = isRefreshing ? 360 : (pullDistance / threshold) * 180;

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-200"
        style={{
          transform: `translateX(-50%) translateY(${
            pullDistance > 0 ? Math.min(pullDistance - 40, 40) : -50
          }px)`,
          opacity: refreshOpacity,
        }}
      >
        <div className="bg-white rounded-full p-3 shadow-lg border border-gray-200">
          <RefreshCw
            className={`h-5 w-5 text-teal-600 ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: `rotate(${refreshRotation}deg)`,
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          transition: pullDistance === 0 ? "transform 0.3s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
