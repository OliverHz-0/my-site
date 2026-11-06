import type { ReactNode } from "react";
import { ResearchTabs } from "./research-tabs";

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ResearchTabs />
      {children}
    </>
  );
}
