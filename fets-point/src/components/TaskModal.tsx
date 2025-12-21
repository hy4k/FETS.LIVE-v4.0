
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTaskMutations } from '../hooks/useFetsConnect';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { z } from 'zod';
import { taskSchema } from '../lib/validators';

const TaskModal = ({
  isOpen,
  onClose,
  task,
  currentUserProfile,
  staffList,
}) => {
  const queryClient = useQueryClient();
  const { addTask, updateTask, isAdding, isUpdating } = useTaskMutations(
    currentUserProfile?.id
  );
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    status: 'pending',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assigned_to: task.assigned_to,
        due_date: task.due_date
          ? format(new Date(task.due_date), 'yyyy-MM-dd')
          : '',
        status: task.status || 'pending',
      });
    } else if (currentUserProfile) {
      setFormData({
        title: '',
        description: '',
        assigned_to: currentUserProfile.id || '',
        due_date: '',
        status: 'pending',
      });
    }
  }, [task, isOpen, currentUserProfile]);

  if (!currentUserProfile) {
    return null;
  }

  const handleSave = async () => {
    try {
      const validatedData = taskSchema.parse(formData);

      if (task) {
        await updateTask({
          id: task.id,
          ...validatedData,
        });
      } else {
        await addTask({
          ...validatedData,
          title: validatedData.title!, // Assert non-null since schema validates it
          assigned_to: validatedData.assigned_to!,
          assigned_by: currentUserProfile.id,
        });
      }
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error saving task:', error);
        toast.error('Failed to save task. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200"
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">
            {task ? 'Task Details' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="font-semibold">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full mt-1 p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="font-semibold">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full mt-1 p-2 border rounded-md"
              rows={3}
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Assign To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) =>
                  setFormData({ ...formData, assigned_to: e.target.value })
                }
                className="w-full mt-1 p-2 border rounded-md"
                disabled={!!task}
              >
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                className="w-full mt-1 p-2 border rounded-md"
                disabled={!!task}
              />
            </div>
          </div>
          {task && (
            <div>
              <label className="font-semibold">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isAdding || isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold disabled:opacity-50"
          >
            {isAdding || isUpdating
              ? 'Saving...'
              : task
                ? 'Update Task'
                : 'Create Task'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TaskModal;
