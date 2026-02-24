import React from "react";
import DayCell from "./DayCell";

interface StaffRowProps {
  staff: any;
  weekDays: Date[];
  weekData: any;
  onCellClick: (profileId: string, date: Date) => void;
  getCurrentUserStaffProfile: () => any;
}

const StaffRow: React.FC<StaffRowProps> = ({
  staff,
  weekDays,
  weekData,
  onCellClick,
  getCurrentUserStaffProfile,
}) => {
  const currentStaffProfile = getCurrentUserStaffProfile();
  const isMyRow = currentStaffProfile?.id === staff.id;

  const handleStaffNameClick = () => {
    // TODO: Open bulk operations modal
    console.log("Opening bulk operations for:", staff.full_name);
  };

  return (
    <div className={`staff-row ${isMyRow ? "my-row" : ""}`}>
      {/* Staff name */}
      <div
        className="staff-name"
        onClick={handleStaffNameClick}
        title="Click to open bulk operations"
      >
        <div className="staff-info">
          <div className="staff-full-name">{staff.full_name}</div>
          <div className="staff-department">{staff.department}</div>
        </div>
      </div>

      {/* Day cells for this staff member */}
      <div className="day-cells">
        {weekDays.map((date) => {
          const dateKey = date.toISOString().split("T")[0];
          const dayData = weekData[dateKey] || {};

          return (
            <DayCell
              key={dateKey}
              date={date}
              staff={staff}
              dayData={dayData}
              onCellClick={onCellClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default StaffRow;
