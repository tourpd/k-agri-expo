"use client";

import React, { useEffect, useState } from "react";

type ApplyResponse = {
  success: boolean;
  entry_code?: string;
  message?: string;
  error?: string;
};

type EventStatusResponse = {
  success: boolean;
  event?: {
    id: number;
    title: string;
    status: string | null;
  };
  error?: string;
};

export default function EventEntryForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    region: "",
    crop: "",
  });

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");
  const [entryCode, setEntryCode] = useState("");
  const [eventClosed, setEventClosed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const loadEventStatus = async () => {
    try {
      const res = await fetch("/api/event-status?event_id=1", {
        cache: "no-store",
      });
      const data: EventStatusResponse = await res.json();

      if (data.success) {
        setEventClosed((data.event?.status || "open") !== "open");
      }
    } catch {
      // 조용히 무시
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    loadEventStatus();

    const timer = setInterval(() => {
      loadEventStatus();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (eventClosed) {
      setMsg("응모가 마감되었습니다.");
      return;
    }

    if (!form.name.trim()) return alert("이름을 입력해 주세요.");
    if (!form.phone.trim()) return alert("전화번호를 입력해 주세요.");
    if (!form.region.trim()) return alert("지역을 입력해 주세요.");
    if (!form.crop.trim()) return alert("재배작물을 입력해 주세요.");

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/event-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: 1,
          name: form.name,
          phone: form.phone,
          region: form.region,
          crop: form.crop,
        }),
      });

      const data: ApplyResponse = await res.json();

      if (!data.success) {
        setMsg(`참여 실패: ${data.error}`);
        return;
      }

      setEntryCode(data.entry_code || "");
      setDone(true);
      setMsg(
        `이벤트 참여가 완료되었습니다.\n참가번호: ${data.entry_code}\n라이브 방송에서 추첨을 기다려 주세요.`
      );

      setForm({
        name: "",
        phone: "",
        region: "",
        crop: "",
      });
    } catch {
      setMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.card}>
      {eventClosed ? (
        <div style={{ ...S.msg, ...S.msgClosed }}>
          현재 응모가 마감되었습니다. 라이브 추첨을 기다려 주세요.
        </div>
      ) : null}

      <form onSubmit={onSubmit} style={S.form}>
        <div style={S.grid}>
          <div>
            <label style={S.label}>이름</label>
            <input
              style={S.input}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="홍길동"
              disabled={loading || eventClosed || checkingStatus}
            />
          </div>

          <div>
            <label style={S.label}>전화번호</label>
            <input
              style={S.input}
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="010-1234-5678"
              disabled={loading || eventClosed || checkingStatus}
            />
          </div>

          <div>
            <label style={S.label}>지역(시/군)</label>
            <input
              style={S.input}
              value={form.region}
              onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
              placeholder="예: 홍성군"
              disabled={loading || eventClosed || checkingStatus}
            />
          </div>

          <div>
            <label style={S.label}>재배작물</label>
            <input
              style={S.input}
              value={form.crop}
              onChange={(e) => setForm((p) => ({ ...p, crop: e.target.value }))}
              placeholder="예: 마늘, 고추, 딸기"
              disabled={loading || eventClosed || checkingStatus}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{
            ...S.submitBtn,
            ...(eventClosed ? S.submitBtnDisabled : {}),
          }}
          disabled={loading || eventClosed || checkingStatus}
        >
          {checkingStatus
            ? "상태 확인 중..."
            : eventClosed
            ? "응모 마감"
            : loading
            ? "참여 처리 중..."
            : "이벤트 참여하기"}
        </button>
      </form>

      {entryCode ? (
        <div style={{ ...S.msg, ...S.msgCode }}>
          참가번호: <strong>{entryCode}</strong>
        </div>
      ) : null}

      {msg ? (
        <div
          style={{
            ...S.msg,
            ...(done ? S.msgOk : S.msgWait),
          }}
        >
          {msg}
        </div>
      ) : null}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: 24,
    padding: 22,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  form: {},
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 900,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 18,
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  submitBtnDisabled: {
    background: "#94a3b8",
    border: "1px solid #94a3b8",
    cursor: "not-allowed",
  },
  msg: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    lineHeight: 1.8,
    fontWeight: 800,
    whiteSpace: "pre-line",
  },
  msgOk: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
  },
  msgWait: {
    background: "#fff7ed",
    border: "1px solid #fdba74",
    color: "#9a3412",
  },
  msgClosed: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
  },
  msgCode: {
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
  },
};