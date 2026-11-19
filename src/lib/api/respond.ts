import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { ApiError } from "./errors";
import type { PaginationMeta } from "./pagination";

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse<ErrorEnvelope> {
  const body: ErrorEnvelope = { error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return NextResponse.json(body, { status });
}

export function fromApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.code, error.message, error.details);
  }
  console.error("Unhandled error:", error);
  return errorResponse(500, "internal_error", "Unexpected server error.");
}

export function fromZodError(error: ZodError): NextResponse {
  return errorResponse(
    400,
    "validation_error",
    "Request validation failed.",
    error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  );
}

export function listResponse<T>(
  items: T[],
  meta: PaginationMeta,
): NextResponse {
  return NextResponse.json({ items, ...meta });
}