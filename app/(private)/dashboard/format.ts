const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });

export function formatCents(cents: number): string {
  return money.format(cents / 100);
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  return `${year}年${Number(m)}月`;
}

export const DRAFT_STAGE: Record<string, string> = {
  idea: "选题",
  drafting: "撰写中",
  polishing: "润色中",
  done: "已完成",
};

export const SUBMISSION_STATUS: Record<string, string> = {
  preparing: "准备中",
  submitted: "已投稿",
  under_review: "审稿中",
  revision: "修改中",
  accepted: "已接收",
  published: "已发表",
  rejected: "未录用",
};

export const RESOURCE_TYPE: Record<string, string> = {
  ebook: "电子书",
  video: "视频",
  post: "推文",
  tutorial: "教程",
};

export const PROJECT_STATUS: Record<string, string> = {
  lead: "洽谈中",
  in_progress: "进行中",
  delivered: "已交付",
  paid: "已收款",
  cancelled: "已取消",
};

export const URGENCY: Record<string, { label: string; rank: number }> = {
  high: { label: "紧急", rank: 0 },
  medium: { label: "一般", rank: 1 },
  low: { label: "不急", rank: 2 },
};
