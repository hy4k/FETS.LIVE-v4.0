import { useBranch } from "./useBranch";

// Hook for branch-specific data filtering
export function useBranchFilter() {
  const { activeBranch } = useBranch();

  const getFilter = () => {
    if (activeBranch === "global") {
      return {}; // No filter for global view
    }
    return { branch_location: activeBranch };
  };

  const applyFilter = (query: any) => {
    if (activeBranch === "global") {
      return query; // No filter for global view
    }
    return query.eq("branch_location", activeBranch);
  };

  return {
    filter: getFilter(),
    applyFilter,
    isGlobalView: activeBranch === "global",
  };
}
