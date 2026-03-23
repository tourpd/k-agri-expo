export async function sendKakaoNotification(payload: {
  template_code: string;
  to: string;
  variables: Record<string, string | number | null>;
}) {
  const res = await fetch("/api/notifications/kakao", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || "카카오 알림 발송 실패");
  }

  return json;
}