"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

// 统一处理接口错误格式；网络失败的 status 为 0，响应不是 JSON 时也不会抛出解析异常。
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "网络连接失败，请检查网络");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? `请求失败（${res.status}）`,
    );
  }
  if (body === null) throw new ApiError(res.status, "INVALID_RESPONSE", "服务器返回了无法识别的内容");
  return body as T;
}

type Settled<T> = { key: string; data: T | null; failure: ApiError | null };

export function useApi<T>(path: string) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const inFlight = useRef(false);

  // 结果按请求标识保存：路径变化或重试后，旧结果自然失效，也就不会闪现上一次的数据。
  const key = `${attempt}:${path}`;
  const current = settled?.key === key ? settled : null;

  useEffect(() => {
    const controller = new AbortController();
    const finish = (result: Settled<T>) => {
      if (controller.signal.aborted) return;
      inFlight.current = false;
      setSettled(result);
    };
    inFlight.current = true;
    apiRequest<T>(path, { signal: controller.signal, cache: "no-store" }).then(
      (data) => finish({ key, data, failure: null }),
      (failure: ApiError) => finish({ key, data: null, failure }),
    );
    return () => controller.abort();
  }, [key, path]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  // 本地更新已加载的数据。若此时还有请求在途，它的结果可能早于这次修改，需要重新请求。
  const mutate = useCallback(
    (update: (data: T) => T) => {
      setSettled((prev) => (prev?.data ? { ...prev, data: update(prev.data) } : prev));
      if (inFlight.current) reload();
    },
    [reload],
  );

  return {
    data: current?.data ?? null,
    error: current?.failure?.message ?? null,
    failure: current?.failure ?? null,
    loading: current === null,
    reload,
    mutate,
  };
}
