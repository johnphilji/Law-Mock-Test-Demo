/**
 * Typed API response helpers.
 *
 * Every API endpoint must use these helpers to ensure a consistent response
 * format throughout the application:
 *
 * Success: { success: true, data: T }
 * Error:   { success: false, error: { code: string, message: string, fieldErrors?: ... } }
 *
 * Usage:
 *   return apiSuccess(data, 200);
 *   return apiError(error);
 *
 * Compatible with Zod v4.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAppError, ValidationError } from "./errors";
import logger from "./logger";

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// =============================================================================
// SUCCESS HELPER
// =============================================================================

export function apiSuccess<T>(
  data: T,
  status: 200 | 201 | 202 | 204 = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

// =============================================================================
// ERROR HELPER
// =============================================================================

/**
 * Converts any thrown error into a consistent API error response.
 *
 * SECURITY: Never returns stack traces or internal details.
 * Logs full error details server-side for debugging.
 */
export function apiError(
  error: unknown,
  requestContext?: { path?: string; userId?: string },
): NextResponse<ApiErrorResponse> {
  // Handle Zod v4 validation errors.
  if (error instanceof z.ZodError) {
    // Zod v4: use .format() to get field-level errors
    const formatted = error.format();
    const fieldErrors: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(formatted)) {
      if (key === "_errors") continue;
      if (value && typeof value === "object" && "_errors" in value) {
        const errors = (value as { _errors: string[] })._errors;
        if (errors.length > 0) {
          fieldErrors[key] = errors;
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The request contains invalid data.",
          fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  // Handle our custom operational errors.
  if (isAppError(error)) {
    if (!error.isOperational) {
      logger.error(
        { err: error, ...requestContext },
        "Unexpected internal error",
      );
    }

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };

    if (error instanceof ValidationError && error.fieldErrors) {
      response.error.fieldErrors = error.fieldErrors;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Unknown error — log the full details but return a generic message.
  logger.error(
    { err: error, ...requestContext },
    "Unhandled error in API route",
  );

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    },
    { status: 500 },
  );
}
