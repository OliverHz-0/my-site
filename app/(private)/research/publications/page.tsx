import { Placeholder } from "../../placeholder";

export default function PublicationsPage() {
  return (
    <Placeholder
      title="发表跟踪"
      description="跟踪每篇稿件的投稿状态和下一步动作。"
      endpoint="/api/research/submissions"
    />
  );
}
