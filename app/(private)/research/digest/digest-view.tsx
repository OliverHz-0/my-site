"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ApiError, apiRequest, useApi } from "@/lib/use-api";
import { addDays, formatDay, formatWeekday, isValidDate, shanghaiToday } from "./dates";
import { DigestItem, type DigestItemData } from "./digest-item";
import { DigestSkeleton } from "./digest-skeleton";
import { Icon } from "../../icons";

type DigestResponse = { date: string; items: DigestItemData[] };

const NOTICE_DURATION = 8000;

function digestHref(pathname: string, date: string | null) {
  return date ? `${pathname}?date=${date}` : pathname;
}

export function DigestView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date") || null;

  const api = useApi<DigestResponse>(
    urlDate ? `/api/research/digests?date=${encodeURIComponent(urlDate)}` : "/api/research/digests",
  );

  // 进行中的收藏：id -> 目标状态。显示时盖在服务端状态上，请求失败只需移除，界面就回滚了。
  const [pendingSaves, setPendingSaves] = useState<ReadonlyMap<string, boolean>>(new Map());
  const inFlightSaves = useRef(new Set<string>());
  const [notice, setNotice] = useState<string | null>(null);
  const [saveUnauthorized, setSaveUnauthorized] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);

  const today = shanghaiToday();
  const date = api.data?.date ?? urlDate ?? today;
  const dateIsValid = isValidDate(date);

  const unauthorized = api.failure?.status === 401 || saveUnauthorized;
  const query = searchParams.toString();
  const currentPath = query ? `${pathname}?${query}` : pathname;
  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`;

  useEffect(() => {
    if (unauthorized) router.replace(loginHref);
  }, [unauthorized, loginHref, router]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION);
    return () => clearTimeout(timer);
  }, [notice]);

  async function toggleSaved(item: DigestItemData) {
    if (inFlightSaves.current.has(item.id)) return;
    inFlightSaves.current.add(item.id);
    const saved = !item.saved;
    setPendingSaves((prev) => new Map(prev).set(item.id, saved));
    setNotice(null);
    try {
      const updated = await apiRequest<DigestItemData>(
        `/api/research/digests/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ saved }),
        },
      );
      api.mutate((data) => ({
        ...data,
        items: data.items.map((other) => (other.id === updated.id ? updated : other)),
      }));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setSaveUnauthorized(true);
      } else {
        const reason = e instanceof ApiError ? e.message : "未知错误";
        setNotice(`${saved ? "收藏" : "取消收藏"}没有成功，已恢复原状态。${reason}`);
      }
    } finally {
      inFlightSaves.current.delete(item.id);
      setPendingSaves((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }
  }

  if (unauthorized) {
    return (
      <StateMessage title="登录已失效" role="alert">
        <p>正在前往登录页，登录后会回到这里。</p>
        <div className="digest-state-actions">
          <Link className="btn btn--primary digest-action" href={loginHref} replace>
            前往登录
          </Link>
        </div>
      </StateMessage>
    );
  }

  const invalidDate = !dateIsValid || api.failure?.code === "INVALID_REQUEST";

  return (
    <>
      {dateIsValid && <DateNav pathname={pathname} date={date} today={today} />}
      <p className="sr-only" role="status">
        {api.loading
          ? "正在加载"
          : api.data
            ? `${formatDay(api.data.date)}，共 ${api.data.items.length} 篇`
            : ""}
      </p>

      {api.loading && <DigestSkeleton />}

      {invalidDate && !api.loading && (
        <StateMessage title="这个日期无法识别" role="alert">
          <p>地址里的日期需要写成 YYYY-MM-DD，例如 {today}。</p>
          <div className="digest-state-actions">
            <Link className="btn btn--primary digest-action" href={pathname}>
              回到今天
            </Link>
          </div>
        </StateMessage>
      )}

      {api.failure && !invalidDate && (
        <StateMessage title="精选没有加载出来" role="alert">
          <p>{api.failure.message}</p>
          <div className="digest-state-actions">
            <button type="button" className="btn btn--primary digest-action" onClick={api.reload}>
              <Icon name="retry" />
              重试
            </button>
          </div>
        </StateMessage>
      )}

      {api.data && dateIsValid && api.data.items.length === 0 && (
        <StateMessage title={api.data.date === today ? "今天还没有推送" : "这一天没有推送"}>
          <p>{formatDay(api.data.date)}没有精选文章，可以看看其他日期。</p>
          <div className="digest-state-actions">
            <Link className="btn btn--primary digest-action" href={digestHref(pathname, addDays(api.data.date, -1))}>
              看前一天
            </Link>
            {api.data.date !== today && (
              <Link className="btn btn--secondary digest-action" href={pathname}>
                回到今天
              </Link>
            )}
          </div>
        </StateMessage>
      )}

      {api.data && api.data.items.length > 0 && (
        <ul className="digest-list">
          {api.data.items.map((item) => (
            <DigestItem
              key={item.id}
              item={item}
              saved={pendingSaves.get(item.id) ?? item.saved}
              pending={pendingSaves.has(item.id)}
              onToggle={() => toggleSaved(item)}
            />
          ))}
        </ul>
      )}

      {/* 玻璃面板的 backdrop-filter 会让 fixed 子元素相对面板定位，所以提示条挂到 body 上。 */}
      {portalReady &&
        createPortal(
          <div className="digest-notice-region" aria-live="assertive">
            {notice && (
              <div className="digest-notice">
                <p>{notice}</p>
                <button type="button" aria-label="关闭提示" title="关闭提示" onClick={() => setNotice(null)}>
                  <Icon name="close" />
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function DateNav({ pathname, date, today }: { pathname: string; date: string; today: string }) {
  const next = addDays(date, 1);
  const nextIsFuture = next > today;

  return (
    <nav className="digest-datenav" aria-label="切换日期">
      <Link className="btn btn--secondary digest-daylink" href={digestHref(pathname, addDays(date, -1))}>
        <Icon name="prev" />
        前一天
      </Link>
      <div className="digest-current">
        <time dateTime={date}>{formatDay(date)}</time>
        <span className="digest-current-sub">
          {formatWeekday(date)}
          {date === today ? (
            " · 今天"
          ) : (
            <>
              {" · "}
              <Link href={pathname}>回到今天</Link>
            </>
          )}
        </span>
      </div>
      {/* 走到今天后，按钮原地变为不可用但仍可聚焦，键盘焦点不会丢失。 */}
      <Link
        className="btn btn--secondary digest-daylink"
        href={digestHref(pathname, nextIsFuture ? date : next)}
        aria-disabled={nextIsFuture}
        title={nextIsFuture ? "还没有更新的精选" : undefined}
        onClick={(event) => {
          if (nextIsFuture) event.preventDefault();
        }}
      >
        后一天
        <Icon name="next" />
      </Link>
    </nav>
  );
}

function StateMessage({
  title,
  role,
  children,
}: {
  title: string;
  role?: "alert";
  children: ReactNode;
}) {
  return (
    <section className="digest-state" role={role}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
