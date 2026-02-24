export interface SessionFilters {
  date?: string; // For a single day: 'YYYY-MM-DD'
  startDate?: string; // For a date range
  endDate?: string; // For a date range
  branch?: "calicut" | "cochin" | "global";
  clientName?: string;
  // This assumes the 'status' column from the previous suggestion was added
  status?: "scheduled" | "live" | "completed" | "cancelled" | "postponed";
}
