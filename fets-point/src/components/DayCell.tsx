import React, { useState } from "react";

interface DayCellProps {
  date: Date;
  staff: any;
  dayData: any;
  onCellClick: (profileId: string, date: Date) => void;
}

const DayCell: React.FC<DayCellProps> = ({
  date,
  staff,
  dayData,
  onCellClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Map shift codes to the new color system
  const getStatusColor = (shiftCode: string) => {
    switch (shiftCode?.toUpperCase()) {
      case "D":
      case "HD":
      case "OT":
        return "bg-green-500"; // Working
      case "RD":
      case "TOIL":
        return "bg-yellow-500"; // Off
      case "L":
        return "bg-red-500"; // Leave
      case "TRAINING":
        return "bg-blue-500"; // Training
      default:
        return "bg-gray-200"; // No schedule
    }
  };

  const getStatusName = (shiftCode: string) => {
    switch (shiftCode?.toUpperCase()) {
      case "D":
        return "Day Shift";
      case "HD":
        return "Half Day";
      case "OT":
        return "Overtime";
      case "RD":
        return "Rest Day";
      case "TOIL":
        return "Time Off";
      case "L":
        return "Leave";
      case "TRAINING":
        return "Training";
      default:
        return "No Schedule";
    }
  };

  // Check if it's a weekend for background shading
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isToday = date.toDateString() === new Date().toDateString();

  const handleCellClick = () => {
    onCellClick(staff.id, date);
  };

  const statusColorClass = getStatusColor(dayData.shift_code);
  const statusName = getStatusName(dayData.shift_code);

  return (
    <div
      className={`day-cell ${isWeekend ? "weekend" : ""} ${
        isToday ? "today" : ""
      } ${statusColorClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCellClick}
      title={`${staff.full_name} - ${date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })} - ${statusName}${
        dayData.overtime_hours ? ` (+${dayData.overtime_hours}h OT)` : ""
      }`}
    >
      {/* Status indicator (color block only, no text) */}
      <div className="status-block"></div>

      {/* Warning dot for overlapping leaves */}
      {dayData.hasWarning && <div className="warning-dot"></div>}

      {/* Overtime indicator */}
      {dayData.overtime_hours && dayData.overtime_hours > 0 && (
        <div className="overtime-indicator"></div>
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <div className="hover-tooltip">
          <div className="tooltip-date">
            {date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="tooltip-status">{statusName}</div>
          {dayData.overtime_hours && (
            <div className="tooltip-hours">+{dayData.overtime_hours}h OT</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DayCell;
