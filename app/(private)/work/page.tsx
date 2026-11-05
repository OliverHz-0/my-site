import { Placeholder } from "../placeholder";

export default function WorkPage() {
  return (
    <Placeholder
      title="工作区"
      description="副业接单、完成进展、流水报表和紧急事项提醒。"
      endpoint="/api/work/projects"
    />
  );
}
