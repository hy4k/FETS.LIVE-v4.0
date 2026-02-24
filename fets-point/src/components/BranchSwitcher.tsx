import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { useBranch } from "../hooks/useBranch";
import { useAuth } from "../hooks/useAuth";
import {
  canSwitchBranches,
  formatBranchName,
  getAvailableBranches,
} from "../utils/authUtils";

export function BranchSwitcher() {
  const { activeBranch, setActiveBranch } = useBranch();
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Only show for super admins - check AFTER all hooks
  if (!canSwitchBranches(profile?.email, profile?.role)) {
    return null;
  }

  const availableBranches = getAvailableBranches(profile?.email, profile?.role);

  const handleBranchChange = (branch: string) => {
    setActiveBranch(branch as any);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/10 hover:bg-black/20 transition-all duration-200 shadow-sm border border-black/10"
        title="Switch Branch (Super Admin)"
      >
        <MapPin className="h-4 w-4 text-black" />
        <span className="text-sm font-semibold text-black hidden sm:inline">
          Switch Branch
        </span>
        <ChevronDown
          className={`h-4 w-4 text-black transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          <div className="py-1">
            {availableBranches.map((branch) => (
              <button
                key={branch}
                onClick={() => handleBranchChange(branch)}
                className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors duration-150 flex items-center gap-2 ${
                  activeBranch === branch
                    ? "bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-900 border-l-4 border-amber-500"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span>{formatBranchName(branch)}</span>
                {activeBranch === branch && (
                  <span className="ml-auto">
                    <svg
                      className="w-4 h-4 text-amber-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium">
              Super Admin Access
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
