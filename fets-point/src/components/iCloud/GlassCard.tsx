import { ReactNode, forwardRef } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "secondary" | "accent";
  elevation?: "low" | "medium" | "high";
  blur?: "light" | "medium" | "heavy";
  style?: React.CSSProperties;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className = "",
      onClick,
      variant = "default",
      elevation = "medium",
      blur = "medium",
      style,
    },
    ref
  ) => {
    const baseClasses = "premium-glass-card";
    const variantClasses = {
      default: "glass-card--default",
      primary: "glass-card--primary",
      secondary: "glass-card--secondary",
      accent: "accent-glow-card",
    };
    const elevationClasses = {
      low: "elevation-1",
      medium: "elevation-2",
      high: "elevation-3",
    };
    const blurClasses = {
      light: "glass-card--blur-light",
      medium: "glass-card--blur-medium",
      heavy: "frosted-card",
    };

    const classes = [
      baseClasses,
      variantClasses[variant],
      elevationClasses[elevation],
      blurClasses[blur],
      onClick ? "glass-card--clickable" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (onClick) {
      return (
        <motion.button
          className={classes}
          onClick={onClick}
          style={style}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{
            scale: 1.02,
            y: -6,
            transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
          }}
          whileTap={{
            scale: 0.98,
            y: -2,
            transition: { duration: 0.1 },
          }}
        >
          <div className="premium-glass-card__content">{children}</div>
        </motion.button>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={classes}
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="premium-glass-card__content">{children}</div>
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
