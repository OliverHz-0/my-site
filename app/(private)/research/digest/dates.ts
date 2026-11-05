// 日期都是 YYYY-MM-DD 字符串，按 UTC 计算，结果不受浏览器时区影响。
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

// 和接口的默认日期一致，按 Asia/Shanghai 取当天。
export function shanghaiToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
}

export function formatDay(date: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatWeekday(date: string): string {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "UTC", weekday: "short" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
