import React, { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContextValue";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("fets-point-theme");
    return saved === "dark";
  });

  useEffect(() => {
    localStorage.setItem("fets-point-theme", isDarkMode ? "dark" : "light");

    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
