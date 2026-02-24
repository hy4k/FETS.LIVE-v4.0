import { motion } from "framer-motion";

interface StatusIndicatorProps {
  status: "active" | "inactive" | "warning" | "success" | "error";
  size?: "small" | "medium" | "large";
  animated?: boolean;
  label?: string;
}

export function StatusIndicator({
  status,
  size = "medium",
  animated = true,
  label,
}: StatusIndicatorProps) {
  const sizeClasses = {
    small: "status-indicator--small",
    medium: "status-indicator--medium",
    large: "status-indicator--large",
  };

  const statusClasses = {
    active: "status-indicator--active",
    inactive: "status-indicator--inactive",
    warning: "status-indicator--warning",
    success: "status-indicator--success",
    error: "status-indicator--error",
  };

  const Component = animated ? motion.div : "div";
  const animationProps = animated
    ? {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 30,
          delay: 0.3,
        },
      }
    : {};

  return (
    <div className="status-indicator-container">
      <Component
        className={`status-indicator ${sizeClasses[size]} ${statusClasses[status]}`}
        {...animationProps}
      >
        <div className="status-indicator-dot" />
        {status === "active" && animated && (
          <motion.div
            className="status-indicator-pulse"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </Component>

      {label && <span className="status-indicator-label">{label}</span>}
    </div>
  );
}
