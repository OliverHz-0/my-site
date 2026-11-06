import { workbenchResponse } from "@/lib/workbench-db";

export const runtime = "nodejs";

export function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return workbenchResponse("sessions", request, context);
}

export function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return workbenchResponse("sessions", request, context);
}
