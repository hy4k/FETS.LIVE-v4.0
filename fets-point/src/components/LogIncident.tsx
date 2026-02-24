import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Calendar,
  Clock,
  User,
  CheckCircle,
  Settings,
  Users,
  MessageSquare,
  Home,
  HelpCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status:
    | "open"
    | "in_progress"
    | "rectified"
    | "reported_to_it"
    | "reported_to_management"
    | "closed";
  reporter: string;
  assigned_to?: string;
  user_id: string;
  is_todo_task: boolean;
  todo_type?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface IncidentFormData {
  title: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status:
    | "open"
    | "in_progress"
    | "rectified"
    | "reported_to_it"
    | "reported_to_management"
    | "closed";
  assigned_to: string;
  is_todo_task: boolean;
  todo_type: string;
  due_date: string;
}

export function LogIncident() {
  const { user, profile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all"); // incidents, todos, all
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<IncidentFormData>({
    title: "",
    description: "",
    category: "other",
    severity: "medium",
    status: "open",
    assigned_to: "",
    is_todo_task: false,
    todo_type: "",
    due_date: "",
  });

  const categories = [
    {
      value: "computer_malfunction",
      label: "Computer Malfunction",
      icon: Settings,
    },
    {
      value: "equipment_issues",
      label: "Equipment Issues",
      icon: AlertTriangle,
    },
    {
      value: "client_communication",
      label: "Client Communication",
      icon: MessageSquare,
    },
    { value: "facility_issues", label: "Facility Issues", icon: Home },
    { value: "staff_issues", label: "Staff Issues", icon: Users },
    { value: "todo_task", label: "Todo Task", icon: CheckCircle },
    { value: "other", label: "Other", icon: HelpCircle },
  ];

  const statuses = [
    { value: "open", label: "Open/New", color: "bg-red-500" },
    { value: "in_progress", label: "In Progress", color: "bg-yellow-500" },
    { value: "rectified", label: "Rectified/Resolved", color: "bg-green-500" },
    { value: "reported_to_it", label: "Reported to IT", color: "bg-blue-500" },
    {
      value: "reported_to_management",
      label: "Reported to Management",
      color: "bg-purple-500",
    },
    { value: "closed", label: "Closed", color: "bg-gray-500" },
  ];

  const severities = [
    { value: "low", label: "Low", color: "bg-gray-500" },
    { value: "medium", label: "Medium", color: "bg-yellow-500" },
    { value: "high", label: "High", color: "bg-orange-500" },
    { value: "critical", label: "Critical", color: "bg-red-500" },
  ];

  const todoTypes = [
    "Drinking water finished",
    "Office supplies to buy",
    "Computer malfunction to report to IT",
    "Call Prometric client",
    "Facility maintenance requests",
    "Other internal tasks",
  ];

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIncidents((data as any) || []);
    } catch (error) {
      console.error("Error loading incidents:", error);
      setError("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError("");

    try {
      const incidentData = {
        ...formData,
        reporter: profile?.full_name || user.email || "Unknown",
        user_id: user.id,
        due_date: formData.due_date || null,
        category: formData.is_todo_task ? "todo_task" : formData.category,
      };

      if (editingIncident) {
        const { error } = await supabase
          .from("incidents")
          .update(incidentData)
          .eq("id", editingIncident.id);

        if (error) throw error;
        setSuccess("Incident updated successfully!");
      } else {
        const { error } = await supabase
          .from("incidents")
          .insert([incidentData]);

        if (error) throw error;
        setSuccess("Incident created successfully!");
      }

      resetForm();
      loadIncidents();
    } catch (error: any) {
      console.error("Error saving incident:", error);
      setError(error.message || "Failed to save incident");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (incident: Incident) => {
    setEditingIncident(incident);
    setFormData({
      title: incident.title,
      description: incident.description,
      category: incident.category,
      severity: incident.severity,
      status: incident.status,
      assigned_to: incident.assigned_to || "",
      is_todo_task: incident.is_todo_task,
      todo_type: incident.todo_type || "",
      due_date: incident.due_date || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (incident: Incident) => {
    if (!confirm("Are you sure you want to delete this incident?")) return;

    try {
      const { error } = await supabase
        .from("incidents")
        .delete()
        .eq("id", incident.id);

      if (error) throw error;
      setSuccess("Incident deleted successfully!");
      loadIncidents();
    } catch (error: any) {
      console.error("Error deleting incident:", error);
      setError(error.message || "Failed to delete incident");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "other",
      severity: "medium",
      status: "open",
      assigned_to: "",
      is_todo_task: false,
      todo_type: "",
      due_date: "",
    });
    setEditingIncident(null);
    setShowModal(false);
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || incident.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" || incident.status === filterStatus;
    const matchesType =
      filterType === "all" ||
      (filterType === "incidents" && !incident.is_todo_task) ||
      (filterType === "todos" && incident.is_todo_task);

    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = statuses.find((s) => s.value === status);
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
          statusConfig?.color || "bg-gray-500"
        }`}
      >
        {statusConfig?.label || status}
      </span>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = severities.find((s) => s.value === severity);
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
          severityConfig?.color || "bg-gray-500"
        }`}
      >
        {severityConfig?.label || severity}
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = categories.find((c) => c.value === category);
    const IconComponent = categoryConfig?.icon || HelpCircle;
    return <IconComponent className="h-4 w-4" />;
  };

  const getIncidentStats = () => {
    const total = incidents.length;
    const open = incidents.filter((i) => i.status === "open").length;
    const inProgress = incidents.filter(
      (i) => i.status === "in_progress"
    ).length;
    const todos = incidents.filter((i) => i.is_todo_task).length;
    const resolved = incidents.filter(
      (i) => i.status === "rectified" || i.status === "closed"
    ).length;

    return { total, open, inProgress, todos, resolved };
  };

  const stats = getIncidentStats();

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <AlertTriangle className="mr-3 h-6 w-6 text-orange-500" />
            Log Incident Management
          </h1>
          <p className="text-gray-600 mt-1">
            Track incidents, issues, and daily tasks
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="fets-orange-card px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="fets-orange-card p-4 rounded-lg">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm opacity-90">Total</div>
        </div>
        <div className="fets-sage-card p-4 rounded-lg">
          <div className="text-2xl font-bold">{stats.open}</div>
          <div className="text-sm opacity-90">Open</div>
        </div>
        <div className="fets-teal-card p-4 rounded-lg">
          <div className="text-2xl font-bold">{stats.inProgress}</div>
          <div className="text-sm opacity-90">In Progress</div>
        </div>
        <div className="golden-card p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.todos}
          </div>
          <div className="text-sm text-gray-600">Todo Tasks</div>
        </div>
        <div className="golden-card p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {stats.resolved}
          </div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="golden-card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incidents..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Types</option>
              <option value="incidents">Incidents Only</option>
              <option value="todos">Todo Tasks Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Incidents List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading incidents...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-600">No incidents found</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="golden-card p-4 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {getCategoryIcon(incident.category)}
                    <h3 className="ml-2 font-semibold text-gray-900">
                      {incident.title}
                    </h3>
                    {incident.is_todo_task && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        TODO
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {incident.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getStatusBadge(incident.status)}
                    {getSeverityBadge(incident.severity)}
                    <span className="text-xs text-gray-500 flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {incident.reporter}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(incident.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {incident.due_date && (
                    <div className="text-xs text-amber-600 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      Due: {new Date(incident.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(incident)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(incident)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingIncident ? "Edit Incident" : "Create New Incident"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Todo Task Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_todo_task"
                    checked={formData.is_todo_task}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_todo_task: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor="is_todo_task"
                    className="text-sm font-medium text-gray-700"
                  >
                    This is a Todo Task
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter incident title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    rows={3}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Describe the incident in detail..."
                  />
                </div>

                {formData.is_todo_task ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Todo Type
                    </label>
                    <select
                      value={formData.todo_type}
                      onChange={(e) =>
                        setFormData({ ...formData, todo_type: e.target.value })
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select todo type...</option>
                      {todoTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      required
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {categories
                        .filter((cat) => cat.value !== "todo_task")
                        .map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          severity: e.target.value as any,
                        })
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {severities.map((sev) => (
                        <option key={sev.value} value={sev.value}>
                          {sev.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as any,
                        })
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      value={formData.assigned_to}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          assigned_to: e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Assign to staff member..."
                    />
                  </div>

                  {formData.is_todo_task && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) =>
                          setFormData({ ...formData, due_date: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="fets-orange-card px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {submitting
                      ? "Saving..."
                      : editingIncident
                      ? "Update"
                      : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
