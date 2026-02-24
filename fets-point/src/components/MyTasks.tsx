import React from "react";

const MyTasks = ({ tasks, isLoading, error, openTaskModal }) => {
  return (
    <div className="flex-1 bg-slate-100 rounded-xl p-4 mt-8 overflow-y-auto">
      <h2 className="font-bold text-slate-800 mb-4">My Tasks</h2>
      {isLoading ? (
        <p>Loading tasks...</p>
      ) : error ? (
        <p className="text-center text-red-500">
          Error loading tasks. Please try again later.
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <li
                key={task.id}
                onClick={() => openTaskModal(task)}
                className="bg-white p-3 rounded-lg text-sm cursor-pointer hover:bg-slate-50 shadow-sm border border-slate-200"
              >
                <p className="font-semibold text-slate-800">{task.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Assigned by: {task.assigned_by?.full_name}
                </p>
              </li>
            ))
          ) : (
            <p className="text-center text-slate-500 text-sm italic mt-4">
              No tasks assigned.
            </p>
          )}
        </ul>
      )}
    </div>
  );
};

export default MyTasks;
