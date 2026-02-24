import {
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useBranch } from "../hooks/useBranch";

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  change = null,
  isCurrency = false,
}: any) => (
  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-bold text-gray-900">
        {isCurrency ? `$${value.toLocaleString()}` : value.toLocaleString()}
      </p>
      {change && (
        <div
          className={`ml-2 flex items-baseline text-sm font-semibold ${
            change.type === "increase" ? "text-green-600" : "text-red-600"
          }`}
        >
          {change.type === "increase" ? (
            <ArrowUpIcon className="h-4 w-4 self-center" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 self-center" />
          )}
          <span>{change.value}</span>
        </div>
      )}
    </div>
  </div>
);

interface BranchStatusBarProps {
  className?: string;
}

export function BranchStatusBar({ className = "" }: BranchStatusBarProps) {
  const { activeBranch, branchStatus, loading, viewMode } = useBranch();

  if (loading) {
    return (
      <div
        className={`w-full p-4 bg-gray-100/50 backdrop-blur-md rounded-2xl shadow-inner ${className}`}
      >
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
          <span className="ml-2 text-sm text-gray-600">
            Loading branch status...
          </span>
        </div>
      </div>
    );
  }

  const currentStatus =
    activeBranch === "global" ? null : branchStatus[activeBranch];

  const renderBranchStatus = (status: any, branchName: string) => {
    if (!status)
      return (
        <div className="text-center text-sm text-gray-500">
          Status unavailable
        </div>
      );

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Active Sessions"
          value={status.active_sessions}
          icon={ComputerDesktopIcon}
          color="text-blue-500"
        />
        <StatCard
          title="Candidates Today"
          value={status.candidates_today}
          icon={UserGroupIcon}
          color="text-purple-500"
        />
        <StatCard
          title="Open Incidents"
          value={status.incidents_open}
          icon={ExclamationTriangleIcon}
          color="text-red-500"
        />
        <StatCard
          title="Network"
          value={status.network_status}
          icon={BoltIcon}
          color={
            status.network_status === "optimal"
              ? "text-green-500"
              : "text-yellow-500"
          }
        />
        <StatCard
          title="Power"
          value={status.power_status}
          icon={BoltIcon}
          color={
            status.power_status === "optimal"
              ? "text-green-500"
              : "text-yellow-500"
          }
        />
        <StatCard
          title="System Health"
          value={status.system_health}
          icon={ComputerDesktopIcon}
          color={
            status.system_health === "ok" ? "text-green-500" : "text-yellow-500"
          }
        />
      </div>
    );
  };

  const renderCompactBranchStatus = (status: any, branchName: string) => {
    if (!status) return <div className="text-xs text-gray-500">N/A</div>;
    return (
      <div className="flex items-center space-x-6">
        {/* Active Sessions */}
        <div className="flex items-center space-x-2">
          <ComputerDesktopIcon className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-gray-800">
            {status.active_sessions}
          </span>
          <span className="text-xs text-gray-500">Sessions</span>
        </div>
        {/* Candidates */}
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="w-5 h-5 text-purple-500" />
          <span className="font-semibold text-gray-800">
            {status.candidates_today}
          </span>
          <span className="text-xs text-gray-500">Candidates</span>
        </div>
        {/* Incidents */}
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <span className="font-semibold text-gray-800">
            {status.incidents_open}
          </span>
          <span className="text-xs text-gray-500">Incidents</span>
        </div>
        {/* Network */}
        <div className="flex items-center space-x-2">
          <BoltIcon
            className={`w-5 h-5 ${
              status.network_status === "optimal"
                ? "text-green-500"
                : "text-yellow-500"
            }`}
          />
          <span className="font-semibold text-gray-800 capitalize">
            {status.network_status}
          </span>
        </div>
        {/* Power */}
        <div className="flex items-center space-x-2">
          <BoltIcon
            className={`w-5 h-5 ${
              status.power_status === "optimal"
                ? "text-green-500"
                : "text-yellow-500"
            }`}
          />
          <span className="font-semibold text-gray-800 capitalize">
            {status.power_status}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            Last updated: {new Date(status.last_updated).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  if (activeBranch === "global") {
    const caliStatus = branchStatus["calicut"];
    const cochinStatus = branchStatus["cochin"];

    if (viewMode === "single") {
      if (!caliStatus || !cochinStatus) {
        return (
          <div className="text-center text-sm text-gray-500">
            Loading global status...
          </div>
        );
      }
      const totalSessions =
        (caliStatus.active_sessions || 0) + (cochinStatus.active_sessions || 0);
      const totalCandidates =
        (caliStatus.candidates_today || 0) +
        (cochinStatus.candidates_today || 0);
      const totalIncidents =
        (caliStatus.incidents_open || 0) + (cochinStatus.incidents_open || 0);

      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`w-full p-4 bg-gray-100/50 backdrop-blur-md rounded-2xl shadow-inner ${className}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Global Status
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                {/* Total Active Sessions */}
                <div className="flex items-center space-x-2">
                  <ComputerDesktopIcon className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-gray-800">
                    {totalSessions}
                  </span>
                  <span className="text-xs text-gray-500">Sessions</span>
                </div>
                {/* Total Candidates */}
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold text-gray-800">
                    {totalCandidates}
                  </span>
                  <span className="text-xs text-gray-500">Candidates</span>
                </div>
                {/* Total Incidents */}
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-gray-800">
                    {totalIncidents}
                  </span>
                  <span className="text-xs text-gray-500">Incidents</span>
                </div>
                {/* Branch Status Summary */}
                <div className="flex items-center space-x-4 pl-4 border-l border-gray-300">
                  <div className="flex items-center space-x-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        caliStatus.system_health === "ok"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    ></div>
                    <span className="text-xs text-gray-600">Calicut</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        cochinStatus.system_health === "ok"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    ></div>
                    <span className="text-xs text-gray-600">Cochin</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      );
    } else {
      // Dual view
      const caliStatus = branchStatus["calicut"];
      const cochinStatus = branchStatus["cochin"];
      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`w-full p-4 space-y-4 bg-gray-100/50 backdrop-blur-md rounded-2xl shadow-inner ${className}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-sm font-semibold text-gray-700">
                  Calicut Branch
                </span>
              </div>
            </div>
            {renderBranchStatus(caliStatus, "Calicut")}
            <div className="border-t border-gray-200/80"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-sm font-semibold text-gray-700">
                  Cochin Branch
                </span>
              </div>
            </div>
            {renderBranchStatus(cochinStatus, "Cochin")}
          </motion.div>
        </AnimatePresence>
      );
    }
  }

  // Single branch view
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`w-full p-4 bg-gray-100/50 backdrop-blur-md rounded-2xl shadow-inner ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                activeBranch === "calicut" ? "bg-yellow-400" : "bg-emerald-400"
              }`}
            ></div>
            <span className="text-sm font-semibold text-gray-700">
              {activeBranch === "calicut" ? "Calicut" : "Cochin"} Branch Status
            </span>
          </div>
        </div>
        <div className="mt-2">
          {renderCompactBranchStatus(
            currentStatus,
            activeBranch === "calicut" ? "Calicut" : "Cochin"
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
