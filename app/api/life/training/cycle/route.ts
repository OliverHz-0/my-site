import { workbenchResponse } from "@/lib/workbench-db";

export const runtime = "nodejs";

export function GET(request: Request) {
  return workbenchResponse("cycle", request);
}

export function PUT(request: Request) {
  return workbenchResponse("cycle", request);
}
