// 单用户会话：cookie 值为 "过期时间戳.HMAC签名"。
// 只用 Web Crypto，proxy 和路由处理函数都能引用。
export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 天

const encoder = new TextEncoder();

function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSession(): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE);
  const signature = await crypto.subtle.sign("HMAC", await getKey(secret), encoder.encode(expires));
  return `${expires}.${Buffer.from(signature).toString("base64url")}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) * 1000 <= Date.now()) return false;
  return crypto.subtle.verify(
    "HMAC",
    await getKey(secret),
    Buffer.from(signature, "base64url"),
    encoder.encode(expires),
  );
}

// 先取摘要再比较，比较耗时与密码内容和长度无关。
export async function passwordMatches(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const [a, b] = await Promise.all(
    [input, expected].map((value) => crypto.subtle.digest("SHA-256", encoder.encode(value))),
  );
  return Buffer.from(a).equals(Buffer.from(b));
}
