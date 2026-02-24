import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  Calendar,
  ClipboardList,
  UserCheck,
  Bell,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNotifications, Notification } from "../hooks/useNotifications";

interface NotificationBannerProps {
  onNavigate?: (tab: string) => void;
}

const iconMap = {
  AlertTriangle,
  AlertCircle,
  Calendar,
  ClipboardList,
  UserCheck,
  Bell,
};

const colorSchemes = {
  red: {
    bg: "bg-red-50/95",
    border: "border-red-200",
    text: "text-red-900",
    badge: "bg-red-500",
    icon: "text-red-600",
    hover: "hover:bg-red-100",
  },
  orange: {
    bg: "bg-orange-50/95",
    border: "border-orange-200",
    text: "text-orange-900",
    badge: "bg-orange-500",
    icon: "text-orange-600",
    hover: "hover:bg-orange-100",
  },
  blue: {
    bg: "bg-blue-50/95",
    border: "border-blue-200",
    text: "text-blue-900",
    badge: "bg-blue-500",
    icon: "text-blue-600",
    hover: "hover:bg-blue-100",
  },
  purple: {
    bg: "bg-purple-50/95",
    border: "border-purple-200",
    text: "text-purple-900",
    badge: "bg-purple-500",
    icon: "text-purple-600",
    hover: "hover:bg-purple-100",
  },
  green: {
    bg: "bg-green-50/95",
    border: "border-green-200",
    text: "text-green-900",
    badge: "bg-green-500",
    icon: "text-green-600",
    hover: "hover:bg-green-100",
  },
  indigo: {
    bg: "bg-indigo-50/95",
    border: "border-indigo-200",
    text: "text-indigo-900",
    badge: "bg-indigo-500",
    icon: "text-indigo-600",
    hover: "hover:bg-indigo-100",
  },
  gray: {
    bg: "bg-gray-50/95",
    border: "border-gray-200",
    text: "text-gray-900",
    badge: "bg-gray-500",
    icon: "text-gray-600",
    hover: "hover:bg-gray-100",
  },
};

export function NotificationBanner({ onNavigate }: NotificationBannerProps) {
  const { notifications, unreadCount, markAsRead, dismissNotification } =
    useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Get top priority notifications
  const criticalNotifications = notifications.filter(
    (n) => n.priority === "critical"
  );
  const highPriorityNotifications = notifications.filter(
    (n) => n.priority === "high"
  );
  const topNotifications = [
    ...criticalNotifications,
    ...highPriorityNotifications,
  ].slice(0, 3);

  const displayNotifications = showAll ? notifications : topNotifications;

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link && onNavigate) {
      onNavigate(notification.link);
    }
  };

  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    dismissNotification(notificationId);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="relative z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1800px] mx-auto">
        {/* Collapsed View - Scrolling Banner */}
        {!isExpanded && (
          <div className="flex items-center overflow-hidden">
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 flex items-center gap-2">
              <Bell className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-xs tracking-wider uppercase">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-hidden py-2">
              <motion.div
                className="flex gap-8 whitespace-nowrap"
                animate={{
                  x: [0, -1500],
                }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 30,
                    ease: "linear",
                  },
                }}
              >
                {[...displayNotifications, ...displayNotifications].map(
                  (notification: any, index) => {
                    const IconComponent =
                      iconMap[notification.icon as keyof typeof iconMap] ||
                      Bell;
                    const scheme =
                      colorSchemes[
                        notification.color as keyof typeof colorSchemes
                      ] || colorSchemes.gray;

                    return (
                      <div
                        key={`${notification.id}-${index}`}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${scheme.badge}`}
                        ></div>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${scheme.icon}`} />
                          <span
                            className={`text-sm font-semibold ${scheme.text}`}
                          >
                            {notification.title}:
                          </span>
                          <span className="text-sm text-gray-700">
                            {notification.message}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </motion.div>
            </div>

            <button
              onClick={() => setIsExpanded(true)}
              className="flex-shrink-0 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2"
            >
              <span className="text-xs font-semibold">View All</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Expanded View - Full Notification List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Notifications
                      </h3>
                      <p className="text-sm text-gray-600">
                        {unreadCount > 0
                          ? `${unreadCount} unread notification${
                              unreadCount > 1 ? "s" : ""
                            }`
                          : "All caught up!"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {notifications.length > 3 && (
                      <button
                        onClick={() => setShowAll(!showAll)}
                        className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        {showAll
                          ? "Show Less"
                          : `Show All (${notifications.length})`}
                      </button>
                    )}
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                  <AnimatePresence>
                    {displayNotifications.map((notification: any) => {
                      const IconComponent =
                        iconMap[notification.icon as keyof typeof iconMap] ||
                        Bell;
                      const scheme =
                        colorSchemes[
                          notification.color as keyof typeof colorSchemes
                        ] || colorSchemes.gray;

                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`relative ${
                            scheme.bg
                          } backdrop-blur-sm border ${
                            scheme.border
                          } rounded-xl p-4 cursor-pointer transition-all ${
                            scheme.hover
                          } ${
                            !notification.is_read
                              ? "ring-2 ring-offset-2 " + scheme.border
                              : ""
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {!notification.is_read && (
                            <div
                              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${scheme.badge} animate-pulse`}
                            ></div>
                          )}

                          <div className="flex items-start gap-3 mb-2">
                            <div
                              className={`w-10 h-10 ${scheme.bg} border ${scheme.border} rounded-lg flex items-center justify-center flex-shrink-0`}
                            >
                              <IconComponent
                                className={`w-5 h-5 ${scheme.icon}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`font-bold text-sm ${scheme.text} truncate`}
                              >
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {notification.priority === "critical" && "🔴 "}
                                {notification.priority === "high" && "🟠 "}
                                {notification.type.charAt(0).toUpperCase() +
                                  notification.type.slice(1)}
                              </p>
                            </div>
                          </div>

                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(
                                notification.created_at
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <button
                              onClick={(e) => handleDismiss(e, notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
}
