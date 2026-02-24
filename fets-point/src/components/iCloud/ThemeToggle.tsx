import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <motion.button
      className="theme-toggle"
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="theme-toggle-track">
        <motion.div
          className="theme-toggle-thumb"
          animate={{
            x: isDark ? 24 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          <motion.div
            className="theme-icon"
            animate={{
              rotate: isDark ? 180 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            {isDark ? <Moon size={14} /> : <Sun size={14} />}
          </motion.div>
        </motion.div>
      </div>
    </motion.button>
  );
}
