type SendSmsInput = {
  to: string;
  message: string;
};

function onlyNumber(v: string) {
  return String(v || "").replace(/\D/g, "");
}

export async function sendAligoSms({ to, message }: SendSmsInput) {
  const userId = process.env.ALIGO_USER_ID;
  const apiKey = process.env.ALIGO_API_KEY;
  const sender = process.env.ALIGO_SENDER;

  if (!userId || !apiKey || !sender) {
    console.warn("[SMS] 알리고 환경변수가 없습니다.");
    return { ok: false, skipped: true, reason: "missing_env" };
  }

  const form = new URLSearchParams();
  form.append("key", apiKey);
  form.append("user_id", userId);
  form.append("sender", onlyNumber(sender));
  form.append("receiver", onlyNumber(to));
  form.append("msg", message);
  form.append("msg_type", message.length > 90 ? "LMS" : "SMS");

  const res = await fetch("https://apis.aligo.in/send/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || data?.result_code !== "1") {
    console.error("[SMS] 발송 실패", data);
    return { ok: false, data };
  }

  return { ok: true, data };
}