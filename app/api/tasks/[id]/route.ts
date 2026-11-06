import { workbenchResponse } from "@/lib/workbench-db";

export const runtime = "nodejs";

export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return workbenchResponse("tasks", request, context);
}

export function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return workbenchResponse("tasks", request, context);
}

export function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return workbenchResponse("tasks", request, context);
}
