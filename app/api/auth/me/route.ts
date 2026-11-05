import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authenticated = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ authenticated });
}
