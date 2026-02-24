import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, User } from "lucide-react";

interface TimelineRibbonProps {
  staffProfiles: any[];
  schedules: any[];
  currentDate: Date;
  viewMode: "week" | "2weeks" | "month";
  onNavigate: (direction: "prev" | "next") => void;
  onCellClick: (profileId: string, date: Date) => void;
  getCurrentUserStaffProfile: () => any;
}

// Timeline Ribbon Color Scheme - Matching Reference Image
const TIMELINE_COLORS = {
  D: {
    name: "Working",
    color: "#6fb865", // Green
    textColor: "#ffffff",
  },
  HD: {
    name: "Working",
    color: "#6fb865", // Green
    textColor: "#ffffff",
  },
  L: {
    name: "Leave",
    color: "#dc3545", // Red
    textColor: "#ffffff",
  },
  RD: {
    name: "Day Off",
    color: "#e7bb5a", // Yellow
    textColor: "#000000",
  },
  Training: {
    name: "Training",
    color: "#007bff", // Blue
    textColor: "#ffffff",
  },
  OT: {
    name: "Working",
    color: "#6fb865", // Green (overtime still counts as working)
    textColor: "#ffffff",
  },
  TOIL: {
    name: "Day Off",
    color: "#e7bb5a", // Yellow
    textColor: "#000000",
  },
};

export function TimelineRibbonRoster({
  staffProfiles,
  schedules,
  currentDate,
  viewMode,
  onNavigate,
  onCellClick,
  getCurrentUserStaffProfile,
}: TimelineRibbonProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    profileId: string;
    date: string;
  } | null>(null);

  const currentStaffProfile = getCurrentUserStaffProfile();

  const getViewDateRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    switch (viewMode) {
      case "week": {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return { startDate: startOfWeek, endDate: endOfWeek };
      }
      case "2weeks": {
        const startOf2Weeks = new Date(currentDate);
        startOf2Weeks.setDate(currentDate.getDate() - currentDate.getDay());
        const endOf2Weeks = new Date(startOf2Weeks);
        endOf2Weeks.setDate(startOf2Weeks.getDate() + 13);
        return { startDate: startOf2Weeks, endDate: endOf2Weeks };
      }
      case "month":
      default: {
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        return { startDate: startOfMonth, endDate: endOfMonth };
      }
    }
  };

  const getDaysInView = () => {
    const { startDate, endDate } = getViewDateRange();
    const days = [];
    const currentDay = new Date(startDate);

    while (currentDay <= endDate) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const getScheduleForDate = (profileId: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return schedules.find(
      (s) => s.profile_id === profileId && s.date === dateStr
    );
  };

  const getViewTitle = () => {
    const { startDate, endDate } = getViewDateRange();

    switch (viewMode) {
      case "week":
        return `Week of ${startDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`;
      case "2weeks":
        return `${startDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${endDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`;
      case "month":
      default:
        return currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
    }
  };

  const days = getDaysInView();

  // Group consecutive days with same status for continuous ribbons
  const createTimelineSegments = (profileId: string) => {
    const segments: Array<{
      startDay: number;
      endDay: number;
      color: string;
      textColor: string;
      status: string;
      schedules: any[];
    }> = [];

    let currentSegment: any = null;

    days.forEach((day, index) => {
      const schedule = getScheduleForDate(profileId, day);
      const colorInfo = schedule
        ? TIMELINE_COLORS[schedule.shift_code as keyof typeof TIMELINE_COLORS]
        : null;
      const status = colorInfo ? colorInfo.name : "No Schedule";
      const color = colorInfo ? colorInfo.color : "#f3f4f6";
      const textColor = colorInfo ? colorInfo.textColor : "#6b7280";

      if (
        !currentSegment ||
        currentSegment.color !== color ||
        currentSegment.status !== status
      ) {
        // Start new segment
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = {
          startDay: index + 1,
          endDay: index + 1,
          color,
          textColor,
          status,
          schedules: schedule ? [schedule] : [],
        };
      } else {
        // Extend current segment
        currentSegment.endDay = index + 1;
        if (schedule) {
          currentSegment.schedules.push(schedule);
        }
      }
    });

    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Timeline Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center">
            <Calendar className="h-6 w-6 mr-3" />
            {getViewTitle()}
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate("prev")}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => onNavigate("next")}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Date Ruler */}
        <div className="flex items-center">
          <div className="w-48 flex-shrink-0"></div>
          <div className="flex-1 flex">
            {days.map((day, index) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={day.getTime()}
                  className={`flex-1 text-center py-2 text-sm ${
                    isToday
                      ? "bg-blue-600 rounded"
                      : isWeekend
                      ? "text-gray-400"
                      : ""
                  }`}
                  style={{ minWidth: "30px" }}
                >
                  <div className="font-bold">{day.getDate()}</div>
                  <div className="text-xs opacity-75">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline Ribbons */}
      <div className="divide-y divide-gray-200">
        {staffProfiles.map((staff) => {
          const isMyRow = currentStaffProfile?.id === staff.id;
          const segments = createTimelineSegments(staff.id);

          return (
            <div
              key={staff.id}
              className={`flex items-center py-4 px-6 hover:bg-gray-50 transition-colors ${
                isMyRow ? "bg-blue-50" : ""
              }`}
            >
              {/* Staff Name Column */}
              <div className="w-48 flex-shrink-0 pr-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <div>
                    <div
                      className={`font-semibold ${
                        isMyRow ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      {staff.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {staff.department}
                    </div>
                    {isMyRow && (
                      <div className="text-xs text-blue-600 font-medium">
                        Your Schedule
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline Ribbon */}
              <div className="flex-1 relative h-12">
                <div className="absolute inset-0 flex">
                  {segments.map((segment, segmentIndex) => {
                    const widthPercentage =
                      ((segment.endDay - segment.startDay + 1) / days.length) *
                      100;
                    const leftPercentage =
                      ((segment.startDay - 1) / days.length) * 100;

                    return (
                      <div
                        key={segmentIndex}
                        className="absolute h-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10 rounded-lg"
                        style={{
                          left: `${leftPercentage}%`,
                          width: `${widthPercentage}%`,
                          backgroundColor: segment.color,
                          color: segment.textColor,
                          boxShadow:
                            hoveredCell?.profileId === staff.id
                              ? "0 4px 12px rgba(0,0,0,0.15)"
                              : "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                        onClick={() => {
                          const firstDay = days[segment.startDay - 1];
                          if (firstDay) onCellClick(staff.id, firstDay);
                        }}
                        onMouseEnter={() =>
                          setHoveredCell({
                            profileId: staff.id,
                            date: segment.startDay.toString(),
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`${segment.status} (${
                          segment.startDay === segment.endDay
                            ? `Day ${segment.startDay}`
                            : `Days ${segment.startDay}-${segment.endDay}`
                        })`}
                      >
                        <div className="text-center">
                          <div className="text-xs font-bold">
                            {segment.status}
                          </div>
                          {segment.schedules.some(
                            (s) => s.overtime_hours > 0
                          ) && (
                            <div className="text-xs opacity-90">
                              +
                              {segment.schedules.reduce(
                                (sum, s) => sum + (s.overtime_hours || 0),
                                0
                              )}
                              h OT
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Weekend Shading Overlay */}
                {days.map((day, index) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  if (!isWeekend) return null;

                  const leftPercentage = (index / days.length) * 100;
                  const widthPercentage = (1 / days.length) * 100;

                  return (
                    <div
                      key={`weekend-${index}`}
                      className="absolute inset-y-0 bg-gray-200 opacity-30 pointer-events-none"
                      style={{
                        left: `${leftPercentage}%`,
                        width: `${widthPercentage}%`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Color Legend */}
      <div className="bg-gray-50 p-6 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm font-medium text-gray-700">Working</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: "#e7bb5a" }}
            ></div>
            <span className="text-sm font-medium text-gray-700">Day Off</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm font-medium text-gray-700">Leave</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-700">Training</span>
          </div>
        </div>
      </div>
    </div>
  );
}
