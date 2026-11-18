import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type ErrorCode =
  | "validation_error"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal_error";

export interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown,
): NextResponse<ErrorBody> {
  const body: ErrorBody =
    details === undefined
      ? { error: { code, message } }
      : { error: { code, message, details } };
  return NextResponse.json(body, { status });
}

export function validationError(
  error: ZodError,
): NextResponse<ErrorBody> {
  return errorResponse(
    400,
    "validation_error",
    "Request validation failed.",
    error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  );
}

export interface ListMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export function listResponse<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number,
): NextResponse<{ data: T[]; meta: ListMeta }> {
  return NextResponse.json({
    data: items,
    meta: {
      page,
      page_size: pageSize,
      total,
      total_pages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    },
  });
}