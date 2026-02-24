import { createContext } from "react";

export type BranchType = "calicut" | "cochin" | "kannur" | "global";
export type ViewMode = "single" | "dual";

interface BranchStatus {
  branch_name: string;
  workstations_total: number;
  workstations_active: number;
  active_sessions?: number;
  network_status: "optimal" | "moderate" | "issues";
  power_status: "optimal" | "moderate" | "issues";
  staff_total: number;
  staff_present: number;
  system_health: "ok" | "warning" | "critical";
  candidates_today: number;
  incidents_open: number;
  last_updated: string;
}

interface BranchContextType {
  // Current branch selection
  activeBranch: BranchType;
  setActiveBranch: (branch: BranchType) => void;

  // View mode (single/dual)
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Branch access permissions
  userBranchAccess: "calicut" | "cochin" | "kannur" | "both";
  userAccessLevel: "staff" | "admin" | "super_admin";

  // Branch status data
  branchStatus: { [key: string]: BranchStatus };
  loading: boolean;

  // Branch switching animation state
  isSwitching: boolean;

  // Helper functions
  canAccessBranch: (branch: BranchType) => boolean;
  canUseDualMode: () => boolean;
  getBranchTheme: (branch: BranchType) => string;
}

export const BranchContext = createContext<BranchContextType | undefined>(
  undefined
);
