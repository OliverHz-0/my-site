import { Placeholder } from "../../placeholder";

export default function WritingPage() {
  return (
    <Placeholder
      title="选题与写作"
      description="记录选题思考，撰写草稿，并用 AI 润色。"
      endpoint="/api/research/drafts"
    />
  );
}
