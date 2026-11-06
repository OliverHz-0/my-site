"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useApi } from "@/lib/use-api";
import { Icon, type IconName } from "../icons";
import { addDays, formatDay, formatWeekday, shanghaiToday } from "../research/digest/dates";
import {
  DRAFT_STAGE,
  PROJECT_STATUS,
  RESOURCE_TYPE,
  SUBMISSION_STATUS,
  URGENCY,
  formatCents,
  formatMonth,
} from "./format";

type Digest = { id: string; title: string; journal: string; url: string; saved: boolean };
type Draft = { id: string; title: string; stage: string; updatedAt: string };
type Submission = { id: string; title: string; journal: string; status: string; nextAction: string };
type Resource = { id: string; type: string; title: string; url: string; tags: string[] };
type Project = { id: string; name: string; client: string; status: string; progress: number; dueDate: string };
type Report = { month: string; incomeCents: number; expenseCents: number; netCents: number };
type Reminder = { id: string; title: string; urgency: string; dueDate: string; done: boolean };
type List<T> = { items: T[] };

const LIST_LIMIT = 3;

// 工作台的接口都需要登录；会话失效时回到登录页，登录后再回来。
function useTileApi<T>(path: string) {
  const api = useApi<T>(path);
  const router = useRouter();
  const unauthorized = api.failure?.status === 401;
  useEffect(() => {
    if (unauthorized) router.replace("/login?next=%2Fdashboard");
  }, [unauthorized, router]);
  return api;
}

type TileApi<T> = ReturnType<typeof useTileApi<T>>;

export function Dashboard() {
  const today = shanghaiToday();

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <p className="dash-date">
            <Icon name="calendar" />
            <time dateTime={today}>
              {formatDay(today)} {formatWeekday(today)}
            </time>
          </p>
          <h1>工作台</h1>
        </div>
        <nav className="pill-tabs" aria-label="工作台分区">
          <a href="#research">科研区</a>
          <a href="#learning">学习区</a>
          <a href="#work">工作区</a>
        </nav>
      </header>

      <div className="dash-zones">
        <Zone id="research" title="科研区" icon="research">
          <div className="zone-grid zone-grid--research">
            <DigestTile today={today} />
            <DraftsTile />
            <SubmissionsTile />
          </div>
        </Zone>
        <Zone id="learning" title="学习区" icon="learning" entry={{ href: "/learning", label: "进入学习区" }}>
          <ResourcesTile />
        </Zone>
        <Zone id="work" title="工作区" icon="work" entry={{ href: "/work", label: "进入工作区" }}>
          <div className="zone-grid zone-grid--work">
            <ReportTile month={today.slice(0, 7)} />
            <ProjectsTile />
            <RemindersTile />
          </div>
        </Zone>
      </div>
    </div>
  );
}

function Zone({
  id,
  title,
  icon,
  entry,
  children,
}: {
  id: string;
  title: string;
  icon: IconName;
  entry?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section className={`zone zone--${id}`} id={id} aria-labelledby={`${id}-title`}>
      <div className="zone-head">
        <span className="zone-icon">
          <Icon name={icon} />
        </span>
        <h2 id={`${id}-title`}>{title}</h2>
        {entry && <EntryLink href={entry.href}>{entry.label}</EntryLink>}
      </div>
      {children}
    </section>
  );
}

function EntryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="entry-link" href={href}>
      {children}
      <Icon name="arrow" className="icon entry-arrow" />
    </Link>
  );
}

function Tile<T>({
  title,
  icon,
  api,
  entry,
  feature,
  className = "",
  children,
}: {
  title: string;
  icon: IconName;
  api: TileApi<T>;
  entry?: { href: string; label: string };
  feature?: boolean;
  className?: string;
  children: (data: T) => ReactNode;
}) {
  return (
    <article className={`tile${feature ? " tile--feature" : ""} ${className}`} aria-busy={api.loading}>
      <header className="tile-head">
        <h3>
          <Icon name={icon} />
          {title}
        </h3>
        {entry && <EntryLink href={entry.href}>{entry.label}</EntryLink>}
      </header>
      {api.loading && (
        <div className="tile-skeleton" role="status" aria-label={`正在加载${title}`}>
          <span />
          <span />
          <span />
        </div>
      )}
      {api.failure && api.failure.status !== 401 && (
        <div className="tile-error" role="alert">
          <p>{title}没有加载出来：{api.failure.message}</p>
          <button type="button" className="btn btn--secondary" onClick={api.reload}>
            <Icon name="retry" />
            重新加载
          </button>
        </div>
      )}
      {api.failure?.status === 401 && <p className="tile-note">登录已失效，正在前往登录页…</p>}
      {api.data && children(api.data)}
    </article>
  );
}

function Stat({ value, unit, label }: { value: ReactNode; unit?: string; label: string }) {
  return (
    <p className="stat">
      <span className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </span>
      <span className="stat-label">{label}</span>
    </p>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="tile-empty">{children}</p>;
}

function DigestTile({ today }: { today: string }) {
  const api = useTileApi<{ date: string; items: Digest[] }>("/api/research/digests");
  return (
    <Tile title="今日精选" icon="calendar" api={api} feature className="tile--digest" entry={{ href: "/research/digest", label: "打开每日资讯" }}>
      {(data) => {
        if (data.items.length === 0) {
          const previous = addDays(data.date, -1);
          return (
            <div className="digest-empty">
              <span className="digest-empty-icon">
                <Icon name="inbox" />
              </span>
              <div>
                <p className="digest-empty-title">{data.date === today ? "今天还没有推送" : `${formatDay(data.date)}没有推送`}</p>
                <p className="digest-empty-text">精选按天更新，可以先看往日的文章。</p>
              </div>
              <Link className="btn btn--primary" href={`/research/digest?date=${previous}`}>
                查看{formatDay(previous)}的精选
                <Icon name="arrow" />
              </Link>
            </div>
          );
        }
        const saved = data.items.filter((item) => item.saved).length;
        return (
          <>
            <div className="stat-row">
              <Stat value={data.items.length} unit="篇" label={`${formatDay(data.date)}精选`} />
              <Stat value={saved} unit="篇" label="已收藏" />
            </div>
            <ul className="tile-list">
              {data.items.slice(0, LIST_LIMIT).map((item) => (
                <li key={item.id}>
                  <a className="tile-item-title" href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                    <span className="sr-only">（在新标签页打开）</span>
                  </a>
                  <span className="tile-meta">{item.journal}</span>
                </li>
              ))}
            </ul>
          </>
        );
      }}
    </Tile>
  );
}

function DraftsTile() {
  const api = useTileApi<List<Draft>>("/api/research/drafts");
  return (
    <Tile title="选题与写作" icon="pen" api={api} entry={{ href: "/research/writing", label: "打开写作" }}>
      {(data) => (
        <>
          <Stat
            value={data.items.filter((d) => d.stage !== "done").length}
            unit="篇"
            label="未完成的选题和草稿"
          />
          {data.items.length === 0 ? (
            <Empty>还没有选题和草稿。</Empty>
          ) : (
            <ul className="tile-list">
              {data.items.slice(0, LIST_LIMIT).map((draft) => (
                <li key={draft.id}>
                  <span className="tile-item-title">{draft.title}</span>
                  <span className="chip">{DRAFT_STAGE[draft.stage] ?? draft.stage}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Tile>
  );
}

function SubmissionsTile() {
  const api = useTileApi<List<Submission>>("/api/research/submissions");
  return (
    <Tile title="发表跟踪" icon="send" api={api} entry={{ href: "/research/publications", label: "打开发表跟踪" }}>
      {(data) => (
        <>
          <Stat
            value={data.items.filter((s) => !["published", "rejected"].includes(s.status)).length}
            unit="篇"
            label="在投稿件"
          />
          {data.items.length === 0 ? (
            <Empty>还没有登记稿件。</Empty>
          ) : (
            <ul className="tile-list">
              {data.items.slice(0, LIST_LIMIT).map((s) => (
                <li key={s.id}>
                  <span className="tile-item-title">{s.title}</span>
                  <span className="chip">{SUBMISSION_STATUS[s.status] ?? s.status}</span>
                  <span className="tile-meta">
                    {s.journal} · 下一步：{s.nextAction}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Tile>
  );
}

function ResourcesTile() {
  const api = useTileApi<List<Resource>>("/api/learning/resources");
  return (
    <Tile title="资料列表" icon="learning" api={api}>
      {(data) => (
        <>
          <Stat value={data.items.length} unit="份" label="已收录资料" />
          {data.items.length === 0 ? (
            <Empty>还没有收录资料。</Empty>
          ) : (
            <ul className="tile-list">
              {data.items.slice(0, LIST_LIMIT + 2).map((r) => (
                <li key={r.id}>
                  <a className="tile-item-title" href={r.url} target="_blank" rel="noopener noreferrer">
                    {r.title}
                    <span className="sr-only">（在新标签页打开）</span>
                  </a>
                  <span className="chip">{RESOURCE_TYPE[r.type] ?? r.type}</span>
                  {r.tags.length > 0 && <span className="tile-meta">{r.tags.join("、")}</span>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Tile>
  );
}

function ReportTile({ month }: { month: string }) {
  const api = useTileApi<Report>(`/api/work/report?month=${month}`);
  return (
    <Tile title="本月收益报表" icon="wallet" api={api} className="tile--report">
      {(report) => (
        <div className="report">
          <Stat value={formatCents(report.netCents)} label={`${formatMonth(report.month)}净收益`} />
          <dl className="report-rows">
            <div>
              <dt>收入</dt>
              <dd>{formatCents(report.incomeCents)}</dd>
            </div>
            <div>
              <dt>支出</dt>
              <dd>{formatCents(report.expenseCents)}</dd>
            </div>
          </dl>
        </div>
      )}
    </Tile>
  );
}

function ProjectsTile() {
  const api = useTileApi<List<Project>>("/api/work/projects");
  return (
    <Tile title="接单项目进度" icon="work" api={api}>
      {(data) => (
        <>
          <Stat value={data.items.filter((p) => p.status === "in_progress").length} unit="个" label="进行中的项目" />
          {data.items.length === 0 ? (
            <Empty>还没有接单项目。</Empty>
          ) : (
            <ul className="tile-list">
              {data.items.slice(0, LIST_LIMIT).map((p) => (
                <li key={p.id}>
                  <span className="tile-item-title">{p.name}</span>
                  <span className="chip">{PROJECT_STATUS[p.status] ?? p.status}</span>
                  <span className="tile-meta">
                    {p.client} · 截止 {p.dueDate}
                  </span>
                  <span className="progress">
                    <span
                      className="progress-bar"
                      role="progressbar"
                      aria-label={`${p.name}进度`}
                      aria-valuenow={p.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }} />
                    </span>
                    <span className="progress-value">{p.progress}%</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Tile>
  );
}

function RemindersTile() {
  const api = useTileApi<List<Reminder>>("/api/work/reminders");
  return (
    <Tile title="紧急提醒" icon="bell" api={api}>
      {(data) => {
        const open = data.items
          .filter((r) => !r.done)
          .sort(
            (a, b) =>
              (URGENCY[a.urgency]?.rank ?? 9) - (URGENCY[b.urgency]?.rank ?? 9) || a.dueDate.localeCompare(b.dueDate),
          );
        return (
          <>
            <Stat value={open.filter((r) => r.urgency === "high").length} unit="条" label="未完成的紧急事项" />
            {open.length === 0 ? (
              <Empty>没有未完成的提醒。</Empty>
            ) : (
              <ul className="tile-list">
                {open.slice(0, LIST_LIMIT).map((r) => (
                  <li key={r.id}>
                    <span className="tile-item-title">{r.title}</span>
                    <span className={`chip${r.urgency === "high" ? " chip--strong" : ""}`}>
                      {URGENCY[r.urgency]?.label ?? r.urgency}
                    </span>
                    <span className="tile-meta">截止 {r.dueDate}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        );
      }}
    </Tile>
  );
}
