import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import {
  CheckIcon,
  ChevronUpDownIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { useBranch } from "../hooks/useBranch";
import { BranchType } from "../contexts/BranchContext";

interface BranchToggleProps {
  className?: string;
}

export function BranchToggle({ className = "" }: BranchToggleProps) {
  const {
    activeBranch,
    setActiveBranch,
    viewMode,
    setViewMode,
    canAccessBranch,
    canUseDualMode,
    isSwitching,
  } = useBranch();

  const [isDual, setIsDual] = useState(viewMode === "dual");

  const branches: { id: BranchType; name: string; color: string }[] = [
    { id: "calicut", name: "Calicut", color: "bg-yellow-400" },
    { id: "cochin", name: "Cochin", color: "bg-emerald-400" },
  ];

  if (canUseDualMode()) {
    branches.push({
      id: "global",
      name: "Global",
      color: "bg-gradient-to-r from-blue-400 to-purple-500",
    });
  }

  const currentBranch = branches.find((b) => b.id === activeBranch);

  const handleBranchSelect = (branchId: BranchType) => {
    if (canAccessBranch(branchId)) {
      setActiveBranch(branchId);
    }
  };

  const handleDualModeToggle = () => {
    const newDualState = !isDual;
    setIsDual(newDualState);
    setViewMode(newDualState ? "dual" : "single");
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Branch Toggle Dropdown */}
      <Listbox value={activeBranch} onChange={handleBranchSelect}>
        <div className="relative">
          <Listbox.Button
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg border border-white/20 hover:bg-white/95 transition-all duration-200"
            aria-label={`Current branch: ${currentBranch?.name}`}
          >
            <div
              key={activeBranch} // Re-trigger animation on change
              className="flex items-center space-x-2 animate-in fade-in duration-300"
            >
              <span className="sr-only">{currentBranch?.name}</span>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    currentBranch?.color || "bg-gray-400"
                  }`}
                />
                <span className="text-sm font-semibold text-gray-800">
                  {isSwitching
                    ? "Switching..."
                    : currentBranch?.name || "Unknown"}
                </span>
              </div>
            </div>
            <ChevronUpDownIcon className="w-5 h-5 text-gray-500" />
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-2 w-48 origin-top-right rounded-xl bg-white/80 backdrop-blur-lg shadow-2xl ring-1 ring-black ring-opacity-5 p-2 z-50 focus:outline-none">
              <div className="space-y-1">
                {branches.map((branch) => {
                  const accessible = canAccessBranch(branch.id);
                  const isActive = branch.id === activeBranch;
                  return (
                    <Listbox.Option
                      key={branch.id}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-150 ${
                        isActive
                          ? "bg-blue-500/10 text-blue-700"
                          : accessible
                          ? "text-gray-800 hover:bg-blue-500/5"
                          : "text-gray-400 cursor-not-allowed"
                      } rounded-lg`}
                      value={branch.id}
                      disabled={!accessible}
                      onClick={() =>
                        accessible && handleBranchSelect(branch.id)
                      }
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${branch.color} ${
                          !accessible && "opacity-50"
                        }`}
                      />
                      <span className="font-medium">{branch.name}</span>
                      {isActive && (
                        <CheckIcon className="w-5 h-5 ml-auto text-blue-600" />
                      )}
                    </Listbox.Option>
                  );
                })}
              </div>
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>

      {/* Dual View Toggle */}
      {canUseDualMode() && (
        <button
          onClick={handleDualModeToggle}
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 ${
            isDual
              ? "bg-blue-500/10 text-blue-700"
              : "bg-white/90 backdrop-blur-sm text-gray-600"
          } shadow-lg border border-white/20 hover:bg-blue-500/5`}
          aria-label="Toggle dual view"
        >
          {isDual ? (
            <BuildingOffice2Icon className="w-5 h-5" />
          ) : (
            <GlobeAltIcon className="w-5 h-5" />
          )}
          <span className="text-sm font-semibold">
            {isDual ? "Dual" : "Single"}
          </span>
        </button>
      )}
    </div>
  );
}
