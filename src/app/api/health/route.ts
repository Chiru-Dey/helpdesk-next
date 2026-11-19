import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  await headers();
  return NextResponse.json({ status: "ok", service: "helpdesk", timestamp: new Date().toISOString() });
}