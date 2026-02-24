/**
 * Unit Tests for Error Handler Utilities
 */

import { describe, it, expect, vi } from "vitest";
import {
  classifyError,
  getUserFriendlyMessage,
  validateRequired,
  validateEmail,
  validatePhone,
  ValidationError,
  ErrorType,
} from "../utils/errorHandler";

describe("Error Classification", () => {
  it("should classify network errors", () => {
    const error = { message: "network request failed" };
    expect(classifyError(error)).toBe(ErrorType.NETWORK);
  });

  it("should classify authentication errors", () => {
    const error = { code: "401" };
    expect(classifyError(error)).toBe(ErrorType.AUTHENTICATION);
  });

  it("should classify authorization errors", () => {
    const error = { code: "403" };
    expect(classifyError(error)).toBe(ErrorType.AUTHORIZATION);
  });

  it("should classify validation errors", () => {
    const error = { code: "400" };
    expect(classifyError(error)).toBe(ErrorType.VALIDATION);
  });

  it("should classify not found errors", () => {
    const error = { code: "404" };
    expect(classifyError(error)).toBe(ErrorType.NOT_FOUND);
  });

  it("should classify conflict errors", () => {
    const error = { code: "409" };
    expect(classifyError(error)).toBe(ErrorType.CONFLICT);
  });

  it("should classify server errors", () => {
    const error = { code: "500" };
    expect(classifyError(error)).toBe(ErrorType.SERVER);
  });

  it("should classify unknown errors", () => {
    const error = { message: "something went wrong" };
    expect(classifyError(error)).toBe(ErrorType.UNKNOWN);
  });
});

describe("User-Friendly Messages", () => {
  it("should return network error message", () => {
    const error = { message: "network error" };
    const message = getUserFriendlyMessage(error);
    expect(message).toContain("Network error");
  });

  it("should return authentication error message", () => {
    const error = { code: "401" };
    const message = getUserFriendlyMessage(error);
    expect(message).toContain("session has expired");
  });

  it("should return validation error message", () => {
    const error = { code: "400" };
    const message = getUserFriendlyMessage(error);
    expect(message).toContain("Invalid data");
  });
});

describe("Validation Functions", () => {
  describe("validateRequired", () => {
    it("should pass when all required fields are present", () => {
      const data = { name: "John", email: "john@example.com" };
      expect(() => validateRequired(data, ["name", "email"])).not.toThrow();
    });

    it("should throw ValidationError when required field is missing", () => {
      const data = { name: "John" };
      expect(() => validateRequired(data, ["name", "email"])).toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError when required field is empty", () => {
      const data = { name: "John", email: "" };
      expect(() => validateRequired(data, ["name", "email"])).toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError when required field is whitespace", () => {
      const data = { name: "John", email: "   " };
      expect(() => validateRequired(data, ["name", "email"])).toThrow(
        ValidationError
      );
    });
  });

  describe("validateEmail", () => {
    it("should return true for valid email", () => {
      expect(validateEmail("john@example.com")).toBe(true);
      expect(validateEmail("user.name+tag@example.co.uk")).toBe(true);
    });

    it("should return false for invalid email", () => {
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user@.com")).toBe(false);
    });
  });

  describe("validatePhone", () => {
    it("should return true for valid phone numbers", () => {
      expect(validatePhone("1234567890")).toBe(true);
      expect(validatePhone("+1 (234) 567-8900")).toBe(true);
      expect(validatePhone("123-456-7890")).toBe(true);
    });

    it("should return false for invalid phone numbers", () => {
      expect(validatePhone("123")).toBe(false);
      expect(validatePhone("abc")).toBe(false);
      expect(validatePhone("12345")).toBe(false);
    });
  });
});
