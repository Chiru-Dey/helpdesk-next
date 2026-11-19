export type ErrorCode =
  | "validation_error"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unprocessable"
  | "internal_error";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function unauthorized(message = "Authentication required."): ApiError {
  return new ApiError(401, "unauthenticated", message);
}

export function forbidden(message = "You do not have permission."): ApiError {
  return new ApiError(403, "forbidden", message);
}

export function notFound(message = "Resource not found."): ApiError {
  return new ApiError(404, "not_found", message);
}

export function conflict(message: string): ApiError {
  return new ApiError(409, "conflict", message);
}

export function unprocessable(message: string, details?: unknown): ApiError {
  return new ApiError(422, "unprocessable", message, details);
}