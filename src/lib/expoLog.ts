export type ExpoLogPayload = {
  event_type: "booth_click" | "product_click" | "inquiry_submit" | "order_paid";
  target_type: "booth" | "product" | "inquiry" | "order";
  target_id: string;
  booth_id?: string | null;
  product_id?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  meta?: Record<string, unknown>;
};

function getOrCreateSessionId() {
  if (typeof window === "undefined") return null;

  const key = "expo_session_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(key, created);
  return created;
}

export async function sendExpoLog(payload: ExpoLogPayload) {
  try {
    const session_id = payload.session_id ?? getOrCreateSessionId();

    await fetch("/api/expo/log", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        session_id,
      }),
      keepalive: true,
    });
  } catch {
    // 로그 실패는 사용자 흐름 막지 않음
  }
}