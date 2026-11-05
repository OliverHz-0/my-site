export type DigestItemData = {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  publishedAt: string;
  doi: string | null;
  url: string;
  summaryZh: string;
  whyRelevant: string;
  saved: boolean;
};

export function DigestItem({
  item,
  saved,
  pending,
  onToggle,
}: {
  item: DigestItemData;
  saved: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  const titleChars = Array.from(item.title);
  const titleEnd = titleChars.pop();
  const titleHead = titleChars.join("");

  return (
    <li className="digest-item">
      <div className="digest-item-body">
        <p className="digest-meta">
          <span className="digest-journal">{item.journal}</span>
          <span aria-hidden="true"> · </span>
          <time dateTime={item.publishedAt}>{item.publishedAt}</time>
        </p>
        <h2 className="digest-title">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {titleHead}
            {/* 图标和最后一个字绑在一起，换行时不会单独落到下一行。 */}
            <span className="digest-title-end">
              {titleEnd}
              <svg className="digest-external" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M3.5 2.5h6v6M9.5 2.5l-7 7" />
              </svg>
            </span>
            <span className="sr-only">（在新标签页打开）</span>
          </a>
        </h2>
        <p className="digest-authors">{item.authors.join("、")}</p>
        <p className="digest-summary">{item.summaryZh}</p>
        <p className="digest-why">
          <span className="digest-why-label">相关性</span>
          {item.whyRelevant}
        </p>
      </div>
      {/* 请求进行中不用 disabled：按钮要保留键盘焦点，重复点击在 onToggle 里忽略。 */}
      <button
        type="button"
        className="digest-save"
        data-saved={saved}
        aria-pressed={saved}
        aria-busy={pending}
        aria-label={`${saved ? "已收藏" : "收藏"}：${item.title}`}
        title={saved ? "取消收藏" : "收藏"}
        onClick={onToggle}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 2.5h8v11l-4-2.8-4 2.8z" />
        </svg>
        {saved ? "已收藏" : "收藏"}
      </button>
    </li>
  );
}
