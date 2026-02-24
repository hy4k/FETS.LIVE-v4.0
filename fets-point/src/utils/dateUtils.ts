// Indian Standard Time (IST) utilities for consistent date handling
// IST is UTC+5:30

/**
 * Convert a date to IST and format as YYYY-MM-DD string
 * @param date - Date object or ISO string
 * @returns Date string in YYYY-MM-DD format in IST
 */
export const formatDateForIST = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Use toLocaleDateString with IST timezone to get correct date
  const istDate = dateObj.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return istDate; // This returns in YYYY-MM-DD format
};

/**
 * Create a date object in IST from a date string
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object adjusted for IST
 */
export const createISTDate = (dateString: string): Date => {
  // Create date in local timezone to maintain the exact date intended
  const [year, month, day] = dateString
    .split("-")
    .map((num) => parseInt(num, 10));
  // Use local timezone construction to avoid automatic UTC conversion
  return new Date(year, month - 1, day, 12, 0, 0); // Set to noon to avoid DST issues
};

/**
 * Get current date in IST as YYYY-MM-DD string
 * @returns Current date string in IST
 */
export const getCurrentISTDateString = (): string => {
  // Get current date directly in IST timezone
  const now = new Date();
  return now.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * Check if a date is today in IST
 * @param date - Date to check
 * @returns True if date is today in IST
 */
export const isToday = (date: Date): boolean => {
  const today = getCurrentISTDateString();
  const checkDate = formatDateForIST(date);
  return today === checkDate;
};

/**
 * Format date for display in IST
 * @param date - Date object or string
 * @returns Formatted date string for display
 */
export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? createISTDate(date) : date;
  return dateObj.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

/**
 * Get month year string for display in IST
 * @param date - Date object
 * @returns Month and year string
 */
export const getMonthYearIST = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};
