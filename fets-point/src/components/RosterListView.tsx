import { Schedule, StaffProfile } from "../types/shared";

interface RosterListViewProps {
  schedules: Schedule[];
  staffProfiles: StaffProfile[];
}

export function RosterListView({
  schedules,
  staffProfiles,
}: RosterListViewProps) {
  const getStaffName = (profileId: string): string => {
    const staff = staffProfiles.find((s) => s.id === profileId);
    return staff?.full_name || "Unknown Staff";
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
              Date
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
              Staff Name
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
              Shift
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
              Overtime
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td className="py-3 px-4 text-sm text-gray-800">
                {schedule.date}
              </td>
              <td className="py-3 px-4 text-sm text-gray-800">
                {getStaffName(schedule.profile_id)}
              </td>
              <td className="py-3 px-4 text-sm text-gray-800">
                {schedule.shift_code}
              </td>
              <td className="py-3 px-4 text-sm text-gray-800">
                {schedule.overtime_hours}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
