import { useContext } from "react";
import { BranchContext } from "../contexts/BranchContextValue";

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}
