import React, { useState } from "react";
import { X } from "lucide-react";

interface QuickFillDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staffProfiles: any[];
}

export const QuickFillDrawer: React.FC<QuickFillDrawerProps> = ({
  isOpen,
  onClose,
  staffProfiles,
}) => {
  const [scope, setScope] = useState("single");
  const [selectedStaff, setSelectedStaff] = useState("");

  const [action, setAction] = useState("create");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg z-40 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          QuickFill
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Action</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => setAction("create")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                action === "create"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setAction("edit")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                action === "edit"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setAction("delete")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                action === "delete"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Delete
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Scope</h3>
          <div className="space-y-4">
            <div>
              <input
                type="radio"
                id="single-staff"
                name="scope"
                value="single"
                checked={scope === "single"}
                onChange={() => setScope("single")}
                className="mr-2"
              />
              <label htmlFor="single-staff">Single Staff</label>
            </div>
            {scope === "single" && (
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="">Select a staff member</option>
                {staffProfiles.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name}
                  </option>
                ))}
              </select>
            )}
            <div>
              <input
                type="radio"
                id="all-staff"
                name="scope"
                value="all"
                checked={scope === "all"}
                onChange={() => setScope("all")}
                className="mr-2"
              />
              <label htmlFor="all-staff">All Staff</label>
            </div>
            <div>
              <input
                type="radio"
                id="filtered-staff"
                name="scope"
                value="filtered"
                checked={scope === "filtered"}
                onChange={() => setScope("filtered")}
                className="mr-2"
              />
              <label htmlFor="filtered-staff">Filtered Staff</label>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Date Range</h3>
          <div className="flex space-x-4">
            <div>
              <label
                htmlFor="start-date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                name="start-date"
                value={startDate.toISOString().slice(0, 10)}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="end-date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                name="end-date"
                value={endDate.toISOString().slice(0, 10)}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Shift Presets
          </h3>
          <div className="flex space-x-4">
            <button className="px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white">
              Day (08:00-15:00)
            </button>
            <button className="px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white">
              Eve (14:00-21:00)
            </button>
            <button className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
              + New preset
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Common Templates
          </h3>
          <div className="flex space-x-4">
            <button className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
              2-2-3
            </button>
            <button className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
              5-2
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Role & Seat/Zone
          </h3>
          <div className="flex space-x-4">
            <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white text-gray-900">
              <option value="">Select a role</option>
              <option value="tca">TCA</option>
            </select>
            <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white text-gray-900">
              <option value="">Select a seat group or zone</option>
            </select>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-700">
              Will create <strong>42 shifts</strong> •{" "}
              <strong>3 conflicts</strong>
            </p>
          </div>
        </div>
        <button className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl">
          Generate Roster
        </button>
      </div>
    </div>
  );
};
