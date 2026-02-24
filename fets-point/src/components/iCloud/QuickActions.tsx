import { motion } from "framer-motion";
import {
  Plus,
  FileText,
  AlertTriangle,
  BarChart3,
  UserPlus,
} from "lucide-react";
import { GlassCard } from "./GlassCard";

interface QuickActionsProps {
  onNavigate?: (tab: string) => void;
}

interface ActionButton {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  color: string;
  description: string;
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  const actions: ActionButton[] = [
    {
      id: "add-candidate",
      label: "Add Candidate",
      icon: UserPlus,
      onClick: () => onNavigate?.("candidate-tracker"),
      color: "var(--fets-primary-yellow)",
      description: "Register new exam candidate",
    },
    {
      id: "create-exam",
      label: "Create Exam",
      icon: Plus,
      onClick: () => onNavigate?.("fets-calendar"),
      color: "var(--fets-action-green)",
      description: "Schedule new examination",
    },
    {
      id: "report-incident",
      label: "Report Incident",
      icon: AlertTriangle,
      onClick: () => onNavigate?.("log-incident"),
      color: "#ef4444",
      description: "Log system or exam issue",
    },
    {
      id: "view-reports",
      label: "View Reports",
      icon: BarChart3,
      onClick: () => onNavigate?.("fets-intelligence"),
      color: "#8b5cf6",
      description: "Access analytics dashboard",
    },
  ];

  return (
    <GlassCard className="quick-actions">
      <div className="quick-actions-header">
        <h3>Quick Actions</h3>
        <p>Common tasks and shortcuts</p>
      </div>

      <div className="actions-grid">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <motion.button
              key={action.id}
              className="action-button"
              onClick={action.onClick}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: "easeOut",
              }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              whileTap={{
                scale: 0.95,
                transition: { duration: 0.1 },
              }}
            >
              <div
                className="action-icon"
                style={{ backgroundColor: action.color }}
              >
                <Icon size={20} />
              </div>

              <div className="action-content">
                <span className="action-label">{action.label}</span>
                <span className="action-description">{action.description}</span>
              </div>

              <div className="action-arrow">
                <div className="arrow-icon" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </GlassCard>
  );
}
