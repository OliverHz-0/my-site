import { workbenchResponse } from "@/lib/workbench-db";

export const runtime = "nodejs";

export function PUT(request: Request, context: { params: Promise<{ date: string }> }) {
  return workbenchResponse("weights", request, context);
}

export function DELETE(request: Request, context: { params: Promise<{ date: string }> }) {
  return workbenchResponse("weights", request, context);
}
