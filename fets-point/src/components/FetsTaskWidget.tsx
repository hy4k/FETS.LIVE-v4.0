import React, { useState, useEffect } from "react";
import { Plus, Maximize2, GripVertical, Edit, Trash2 } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface Task {
  id: string;
  title: string;
  notes: string;
  priority: "high" | "medium" | "low";
  columnId: string;
  order: number;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface FetsTaskWidgetProps {
  onExpand?: () => void;
}

const PRIORITY_COLORS = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const PRIORITY_LABELS = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function FetsTaskWidget({ onExpand }: FetsTaskWidgetProps) {
  const [columns, setColumns] = useState<Column[]>([
    { id: "todo", title: "To Do", tasks: [] },
    { id: "doing", title: "Doing", tasks: [] },
    { id: "done", title: "Done", tasks: [] },
  ]);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    notes: "",
    priority: "medium" as Task["priority"],
  });

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("fets-tasks");
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setColumns(parsedTasks);
      } catch (error) {
        console.error("Error loading saved tasks:", error);
        // Initialize with sample tasks if loading fails
        initializeSampleTasks();
      }
    } else {
      // Initialize with sample tasks
      initializeSampleTasks();
    }
  }, []);

  // Save tasks to localStorage whenever columns change
  useEffect(() => {
    localStorage.setItem("fets-tasks", JSON.stringify(columns));
  }, [columns]);

  const initializeSampleTasks = () => {
    const sampleTasks: Task[] = [
      {
        id: "1",
        title: "Review candidate tracker reports",
        notes: "Check weekly performance metrics and attendance records",
        priority: "high",
        columnId: "todo",
        order: 0,
      },
      {
        id: "2",
        title: "Update exam schedule calendar",
        notes: "Add new PEARSON sessions for next week",
        priority: "medium",
        columnId: "doing",
        order: 0,
      },
      {
        id: "3",
        title: "Complete staff roster assignments",
        notes: "Finalized duty allocations for September",
        priority: "low",
        columnId: "done",
        order: 0,
      },
    ];

    const initialColumns = [
      { id: "todo", title: "To Do", tasks: [sampleTasks[0]] },
      { id: "doing", title: "Doing", tasks: [sampleTasks[1]] },
      { id: "done", title: "Done", tasks: [sampleTasks[2]] },
    ];

    setColumns(initialColumns);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];

      // Find source and destination columns
      const sourceCol = newColumns.find(
        (col) => col.id === source.droppableId
      )!;
      const destCol = newColumns.find(
        (col) => col.id === destination.droppableId
      )!;

      // Get the task being moved
      const [movedTask] = sourceCol.tasks.splice(source.index, 1);
      movedTask.columnId = destination.droppableId;

      // Insert into destination column
      destCol.tasks.splice(destination.index, 0, movedTask);

      return newColumns;
    });
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      notes: newTask.notes,
      priority: newTask.priority,
      columnId: "todo",
      order: 0,
    };

    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];
      const todoColumn = newColumns.find((col) => col.id === "todo")!;
      todoColumn.tasks.unshift(task);
      return newColumns;
    });

    setNewTask({ title: "", notes: "", priority: "medium" });
    setShowAddTaskModal(false);
  };

  const editTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      notes: task.notes,
      priority: task.priority,
    });
    setShowAddTaskModal(true);
  };

  const updateTask = () => {
    if (!editingTask || !newTask.title.trim()) return;

    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];
      const column = newColumns.find((col) => col.id === editingTask.columnId)!;
      const taskIndex = column.tasks.findIndex((t) => t.id === editingTask.id);

      if (taskIndex !== -1) {
        column.tasks[taskIndex] = {
          ...editingTask,
          title: newTask.title,
          notes: newTask.notes,
          priority: newTask.priority,
        };
      }

      return newColumns;
    });

    setNewTask({ title: "", notes: "", priority: "medium" });
    setEditingTask(null);
    setShowAddTaskModal(false);
  };

  const deleteTask = (taskId: string, columnId: string) => {
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];
      const column = newColumns.find((col) => col.id === columnId)!;
      column.tasks = column.tasks.filter((task) => task.id !== taskId);
      return newColumns;
    });
  };

  const closeModal = () => {
    setShowAddTaskModal(false);
    setEditingTask(null);
    setNewTask({ title: "", notes: "", priority: "medium" });
  };

  return (
    <>
      <div className="standardized-widget">
        {/* Consistent Header Style matching Today's Activity */}
        <div className="unified-widget-header">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">FETS TASK</h2>
            <button
              onClick={onExpand}
              className="expand-button"
              title="Expand to full screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Column Headers with #80c377 color */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div
            className="text-center py-3 px-4 rounded-lg text-white font-semibold"
            style={{
              background: "linear-gradient(135deg, #80c377 0%, #a3d69a 100%)",
            }}
          >
            TO DO
          </div>
          <div
            className="text-center py-3 px-4 rounded-lg text-white font-semibold"
            style={{
              background: "linear-gradient(135deg, #80c377 0%, #a3d69a 100%)",
            }}
          >
            DOING
          </div>
          <div
            className="text-center py-3 px-4 rounded-lg text-white font-semibold"
            style={{
              background: "linear-gradient(135deg, #80c377 0%, #a3d69a 100%)",
            }}
          >
            DONE
          </div>
        </div>

        {/* Workflow Management Style Content - No Scroll */}
        <div className="workflow-content-style no-scroll-widget">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="fets-kanban-board">
              {columns.map((column) => (
                <div key={column.id} className="fets-kanban-column">
                  {/* Column Header */}
                  <div className="fets-column-header">
                    <h4 className="fets-column-title">{column.title}</h4>
                    <span className="fets-column-count">
                      {column.tasks.length}
                    </span>
                  </div>

                  {/* Droppable Column */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`fets-column-dropzone ${
                          snapshot.isDraggingOver ? "fets-column-dragging" : ""
                        }`}
                      >
                        {/* Tasks */}
                        {column.tasks.slice(0, 3).map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`fets-task-card ${
                                  snapshot.isDragging
                                    ? "fets-task-dragging"
                                    : ""
                                }`}
                              >
                                {/* Task Header */}
                                <div className="fets-task-header">
                                  <div className="fets-task-content-wrapper">
                                    <h5 className="fets-task-title">
                                      {task.title}
                                    </h5>
                                  </div>
                                  <div className="fets-task-actions">
                                    <button
                                      onClick={() => editTask(task)}
                                      className="fets-task-action-btn"
                                      title="Edit task"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        deleteTask(task.id, task.columnId)
                                      }
                                      className="fets-task-action-btn"
                                      title="Delete task"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                    <div
                                      {...provided.dragHandleProps}
                                      className="fets-task-drag-handle"
                                    >
                                      <GripVertical className="h-3 w-3" />
                                    </div>
                                  </div>
                                </div>

                                {/* Task Notes (Collapsible) */}
                                {task.notes && (
                                  <p className="fets-task-notes">
                                    {task.notes}
                                  </p>
                                )}

                                {/* Priority Badge with #80c377 color */}
                                <div className="fets-task-footer">
                                  <span
                                    className="fets-priority-badge"
                                    style={{
                                      background:
                                        task.priority === "high"
                                          ? "#e53e3e"
                                          : task.priority === "medium"
                                          ? "#80c377"
                                          : "#80c377",
                                      color: "white",
                                      fontSize: "0.75rem",
                                      fontWeight: "500",
                                      padding: "2px 8px",
                                      borderRadius: "12px",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {PRIORITY_LABELS[task.priority]}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Show count if more than 3 tasks */}
                        {column.tasks.length > 3 && (
                          <div className="fets-more-tasks">
                            <span className="fets-more-tasks-text">
                              +{column.tasks.length - 3} more
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>

          {/* Add Task Button */}
          <div className="mt-4">
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #80c377 0%, #a3d69a 100%)",
                color: "white",
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingTask ? "Edit Task" : "Add New Task"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newTask.notes}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add notes (optional)..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      priority: e.target.value as Task["priority"],
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingTask ? updateTask : addTask}
                disabled={!newTask.title.trim()}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                style={{ background: "#80c377" }}
              >
                {editingTask ? "Update" : "Add"} Task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
