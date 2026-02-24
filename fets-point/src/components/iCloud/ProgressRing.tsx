import { motion } from "framer-motion";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  className = "",
  showPercentage = false,
  color = "var(--fets-primary-yellow)",
  backgroundColor = "rgba(255, 255, 255, 0.2)",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`progress-ring ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="progress-ring__svg">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          className="progress-ring__background"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="progress-ring__progress"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
            delay: 0.5,
          }}
          style={{
            transformOrigin: `${size / 2}px ${size / 2}px`,
            transform: "rotate(-90deg)",
          }}
        />
      </svg>

      {showPercentage && (
        <div className="progress-ring__text">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            {progress}%
          </motion.span>
        </div>
      )}
    </div>
  );
}
