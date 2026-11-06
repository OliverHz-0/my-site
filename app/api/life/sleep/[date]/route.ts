import { workbenchResponse } from "@/lib/workbench-db";

export const runtime = "nodejs";

export function PUT(request: Request, context: { params: Promise<{ date: string }> }) {
  return workbenchResponse("sleep", request, context);
}

export function DELETE(request: Request, context: { params: Promise<{ date: string }> }) {
  return workbenchResponse("sleep", request, context);
}
