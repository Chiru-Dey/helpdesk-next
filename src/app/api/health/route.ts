import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  // Calling a dynamic API like headers() opts this route into dynamic rendering
  // in Next.js 16 with cacheComponents enabled.
  await headers();

  return NextResponse.json({
    status: "ok",
    service: "helpdesk",
    timestamp: new Date().toISOString(),
  });
}