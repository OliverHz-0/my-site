import type { Metadata } from "next";
import { Dashboard } from "./dashboard";

export const metadata: Metadata = { title: "工作台" };

export default function DashboardPage() {
  return <Dashboard />;
}
