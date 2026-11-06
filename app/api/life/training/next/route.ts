import { workbenchResponse } from "@/lib/workbench-db";

export const runtime = "nodejs";

export function PUT(request: Request) {
  return workbenchResponse("next", request);
}

export function DELETE(request: Request) {
  return workbenchResponse("next", request);
}
