/**
 * Centralized Error Handling Utilities
 * Provides consistent error handling across the application
 */

import { toast } from "react-hot-toast";
import type { PostgrestError } from "@supabase/supabase-js";

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

/**
 * Error type classification
 */
export enum ErrorType {
  NETWORK = "NETWORK",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  VALIDATION = "VALIDATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}

/**
 * Classify error based on code or message
 */
export function classifyError(error: any): ErrorType {
  const code = error?.code || error?.status;
  const message = error?.message?.toLowerCase() || "";

  // Network errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    code === "ECONNREFUSED"
  ) {
    return ErrorType.NETWORK;
  }

  // Authentication errors
  if (
    code === "401" ||
    code === "PGRST301" ||
    message.includes("not authenticated")
  ) {
    return ErrorType.AUTHENTICATION;
  }

  // Authorization errors
  if (
    code === "403" ||
    code === "PGRST403" ||
    message.includes("not authorized")
  ) {
    return ErrorType.AUTHORIZATION;
  }

  // Validation errors
  if (code === "400" || code === "PGRST400" || code === "22P02") {
    return ErrorType.VALIDATION;
  }

  // Not found errors
  if (code === "404" || code === "PGRST116" || message.includes("not found")) {
    return ErrorType.NOT_FOUND;
  }

  // Conflict errors
  if (code === "409" || code === "23505") {
    return ErrorType.CONFLICT;
  }

  // Server errors
  if (code === "500" || code?.toString().startsWith("5")) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  const errorType = classifyError(error);
  const originalMessage = error?.message || "An unexpected error occurred";

  switch (errorType) {
    case ErrorType.NETWORK:
      return "Network error. Please check your internet connection and try again.";

    case ErrorType.AUTHENTICATION:
      return "Your session has expired. Please log in again.";

    case ErrorType.AUTHORIZATION:
      return "You do not have permission to perform this action.";

    case ErrorType.VALIDATION:
      return "Invalid data provided. Please check your input and try again.";

    case ErrorType.NOT_FOUND:
      return "The requested resource was not found.";

    case ErrorType.CONFLICT:
      return "This record already exists or conflicts with existing data.";

    case ErrorType.SERVER:
      return "Server error. Please try again later or contact support.";

    default:
      return originalMessage;
  }
}

/**
 * Log error to console (can be extended to send to logging service)
 */
export function logError(error: any, context?: string) {
  const errorInfo: AppError = {
    message: error?.message || "Unknown error",
    code: error?.code,
    details: error?.details || error,
    timestamp: new Date(),
  };

  console.error(`[Error${context ? ` - ${context}` : ""}]:`, errorInfo);

  // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
  // Example: Sentry.captureException(error, { contexts: { custom: { context } } })
}

/**
 * Handle error with toast notification
 */
export function handleError(
  error: any,
  context?: string,
  customMessage?: string
) {
  logError(error, context);

  const message = customMessage || getUserFriendlyMessage(error);
  toast.error(message);
}

/**
 * Handle success with toast notification
 */
export function handleSuccess(message: string) {
  toast.success(message);
}

/**
 * Retry mechanism for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Wrap async operation with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorContext?: string,
  customErrorMessage?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, errorContext, customErrorMessage);
    return null;
  }
}

/**
 * Parse Supabase error
 */
export function parseSupabaseError(error: PostgrestError): AppError {
  return {
    message: error.message,
    code: error.code,
    details: error.details,
    timestamp: new Date(),
  };
}

/**
 * Validation helper
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(
    (field) => !data[field] || data[field].toString().trim() === ""
  );

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(", ")}`,
      missing[0]
    );
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s+()-]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
}
