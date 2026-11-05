import { Placeholder } from "../placeholder";

export default function LearningPage() {
  return (
    <Placeholder
      title="学习区"
      description="存放电子书、视频链接、高价值推文和教程。"
      endpoint="/api/learning/resources"
    />
  );
}
