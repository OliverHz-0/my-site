import { workbenchResponse } from "@/lib/workbench-db";

export const runtime = "nodejs";

export function GET(request: Request) {
  return workbenchResponse("transactions", request);
}

export function POST(request: Request) {
  return workbenchResponse("transactions", request);
}
