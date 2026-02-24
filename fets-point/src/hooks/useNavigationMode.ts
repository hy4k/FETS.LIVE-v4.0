import { create } from "zustand";

export type NavMode = "COMMAND" | "MISSION" | "INTELLIGENCE" | "ADMIN";

interface NavigationState {
  currentMode: NavMode;
  setMode: (mode: NavMode) => void;
}

export const useNavigationMode = create<NavigationState>((set) => ({
  currentMode: "COMMAND",
  setMode: (mode) => set({ currentMode: mode }),
}));

// Mapping helper to determine default tab for each mode
export const getSafeTabForMode = (mode: NavMode): string => {
  switch (mode) {
    case "COMMAND":
      return "command-center";
    case "MISSION":
      return "my-desk";
    case "INTELLIGENCE":
      return "settings"; // FETS Intelligence is 'settings' ID in sidebar
    case "ADMIN":
      return "user-management";
    default:
      return "command-center";
  }
};
