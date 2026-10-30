/**
 * 서명된 세션 쿠키 (HMAC-SHA256)
 *
 * 예전 관리자 쿠키는 서명 없는 base64 JSON이라 누구나 만들어 낼 수 있었습니다.
 * 이제는 "내용.서명" 형태로 만들고, 서버만 아는 비밀값으로 서명을 확인합니다.
 *
 * - Web Crypto만 사용 → proxy(미들웨어)와 서버 라우트 어디서나 동작
 * - 비밀값: ADMIN_SESSION_SECRET (없으면 SUPABASE_SERVICE_ROLE_KEY로 대신)
 */

const encoder = new TextEncoder();

function getSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";
  if (secret.length < 16) {
    throw new Error(
      "[signed-session] ADMIN_SESSION_SECRET(또는 SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다."
    );
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(data: string, purpose: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${purpose}:${getSecret()}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export type SignedPayload = Record<string, unknown> & { exp: number };

/** payload에 exp(만료, 초 단위 epoch)를 넣어 서명된 토큰을 만듭니다. */
export async function signSession(
  payload: Record<string, unknown>,
  maxAgeSeconds: number,
  purpose = "admin"
): Promise<string> {
  const body: SignedPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encoded = toBase64Url(encoder.encode(JSON.stringify(body)));
  const sig = toBase64Url(await hmac(encoded, purpose));
  return `${encoded}.${sig}`;
}

/** 서명과 만료를 확인하고, 통과하면 payload를, 아니면 null을 돌려줍니다. */
export async function verifySession(
  token: string | undefined | null,
  purpose = "admin"
): Promise<SignedPayload | null> {
  try {
    if (!token || typeof token !== "string") return null;
    const dot = token.indexOf(".");
    if (dot <= 0 || dot !== token.lastIndexOf(".")) return null;

    const encoded = token.slice(0, dot);
    const given = fromBase64Url(token.slice(dot + 1));
    const expected = await hmac(encoded, purpose);
    if (!timingSafeEqual(given, expected)) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded)));
    if (!payload || typeof payload !== "object") return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload as SignedPayload;
  } catch {
    return null;
  }
}

/** 고정 비밀값(웹훅 토큰 등)을 시간차 공격 없이 비교합니다. */
export function safeEqualText(a: string, b: string): boolean {
  if (!a || !b) return false;
  return timingSafeEqual(encoder.encode(a), encoder.encode(b));
}

/**
 * 사이트 서버가 자기 API를 부를 때 붙이는 내부 통행증.
 * 브라우저에는 절대 내려가지 않고, 비밀값에서만 만들어집니다.
 */
export const INTERNAL_HEADER = "x-kagri-internal";

export async function getInternalToken(): Promise<string> {
  return toBase64Url(await hmac("internal-call-v1", "internal"));
}

export async function isInternalRequestToken(value: string | null | undefined): Promise<boolean> {
  if (!value) return false;
  try {
    return safeEqualText(value, await getInternalToken());
  } catch {
    return false;
  }
}
