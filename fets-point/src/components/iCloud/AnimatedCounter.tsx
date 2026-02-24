import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  loading?: boolean;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  className = "",
  loading = false,
  suffix = "",
  prefix = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 30,
    mass: 1,
  });
  const display = useTransform(spring, (latest) => Math.round(latest));

  useEffect(() => {
    if (!loading) {
      spring.set(value);
    }
  }, [value, loading, spring]);

  useEffect(() => {
    const unsubscribe = display.onChange((latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [display]);

  if (loading) {
    return (
      <div className={`animated-counter loading ${className}`}>
        <div className="loading-placeholder" />
      </div>
    );
  }

  return (
    <motion.div
      className={`animated-counter ${className}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      {displayValue}
      {suffix}
    </motion.div>
  );
}
