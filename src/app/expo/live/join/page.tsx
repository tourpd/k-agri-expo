"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_tySHxj/chat";

type FormState = {
  name: string;
  phone: string;
  region: string;
  crop: string;
  farm_size: string;
};

function formatPhone(value: string) {
  const only = value.replace(/\D/g, "").slice(0, 11);
  if (only.length < 4) return only;
  if (only.length < 8) return `${only.slice(0, 3)}-${only.slice(3)}`;
  return `${only.slice(0, 3)}-${only.slice(3, 7)}-${only.slice(7)}`;
}

function getEventIdFromStorage() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("current_event_id") || "";
}

export default function LiveJoinPage() {
  const searchParams = useSearchParams();

  const eventId = useMemo(() => {
    return (
      searchParams.get("event_id") ||
      searchParams.get("eventId") ||
      getEventIdFromStorage()
    );
  }, [searchParams]);

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    region: "",
    crop: "",
    farm_size: "",
  });

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [drawNumber, setDrawNumber] = useState<number | null>(null);

  useEffect(() => {
    if (eventId && typeof window !== "undefined") {
      localStorage.setItem("current_event_id", eventId);
    }
  }, [eventId]);

  function update(key: keyof FormState, value: string) {
    const nextValue = key === "phone" ? formatPhone(value) : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  }

  async function submit() {
    if (!form.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    if (!form.phone.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/live/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId || undefined,
          name: form.name.trim(),
          phone: form.phone.trim(),
          region: form.region.trim(),
          crop: form.crop.trim(),
          farm_size: form.farm_size.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "참여 실패");
      }

      setDrawNumber(json.draw_number || json.participant?.draw_number || null);
      setDone(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "참여 실패. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main style={wrap}>
        <section style={card}>
          <div style={completeIcon}>🎉</div>

          <h1 style={completeTitle}>참여 신청 완료</h1>

          <p style={completeDesc}>
            방송 중 추첨에 사용할 참여번호가 발급되었습니다.
          </p>

          <div style={numberBox}>
            <div style={numberLabel}>나의 참여번호</div>
            <div style={numberText}>
              {drawNumber ? String(drawNumber).padStart(4, "0") : "확인중"}
            </div>
          </div>

          <div style={flowBox}>
            <strong>진행 순서</strong>
            <span>참여 신청 완료 → 방송 시청 → 실시간 추첨 → 전화 확인 → 최종 당첨</span>
          </div>

          <div style={urgentNotice}>
            당첨자는 방송 중 전화 확인 후 최종 확정됩니다.
            <br />
            전화를 받지 않으면 다음 후보로 넘어갈 수 있습니다.
          </div>

          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
            style={kakaoButton}
          >
            💬 카카오톡 채널 추가하고 알림받기
          </a>

          <a href="/expo/live/my-number" style={findButton}>
            🔎 내 참여번호 다시 확인하기
          </a>

          <a href="/expo" style={backButton}>
            EXPO 메인으로 돌아가기
          </a>
        </section>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <section style={card}>
        <div style={headerBox}>
          <div style={badge}>🔥 K-Agri LIVE EVENT</div>

          <h1 style={title}>
            라이브 경품
            <br />
            사전 참여 신청
          </h1>

          <p style={desc}>
            지금 신청하면 참여번호가 자동 발급됩니다.
            <br />
            방송 중 이 번호로 실시간 추첨에 참여합니다.
          </p>
        </div>

        <div style={eventBox}>
          <div style={eventBig}>무료 추첨 참여하기</div>
          <div style={eventSub}>참여번호 자동 발급</div>
          <div style={eventSmall}>
            사전 참여 → 방송 추첨 → 전화 확인 → 최종 당첨
          </div>
        </div>

        <div style={formBox}>
          <Input
            label="이름"
            required
            value={form.name}
            placeholder="예: 홍길동"
            onChange={(v) => update("name", v)}
          />

          <Input
            label="전화번호"
            required
            value={form.phone}
            placeholder="예: 010-2828-2929"
            onChange={(v) => update("phone", v)}
          />

          <Input
            label="지역"
            value={form.region}
            placeholder="예: 전북 김제"
            onChange={(v) => update("region", v)}
          />

          <Input
            label="재배 작물"
            value={form.crop}
            placeholder="예: 마늘, 고추, 딸기"
            onChange={(v) => update("crop", v)}
          />

          <Input
            label="농장 규모"
            value={form.farm_size}
            placeholder="예: 3000평"
            onChange={(v) => update("farm_size", v)}
          />

          <button type="button" onClick={submit} disabled={loading} style={btn}>
            {loading ? "참여 처리중..." : "🔥 무료 추첨 참여하기"}
          </button>
        </div>

        <div style={notice}>
          <div>✔ 참여 완료 후 나의 참여번호가 발급됩니다.</div>
          <div>✔ 방송 중 참여번호로 실시간 추첨이 진행됩니다.</div>
          <div>✔ 당첨자는 전화 확인 후 최종 확정됩니다.</div>
          <div style={noticeAlert}>
            ⚠️ 같은 전화번호로 중복 참여는 제한될 수 있습니다.
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  placeholder,
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div style={inputWrap}>
      <label style={labelStyle}>
        {label} {required && <span style={requiredMark}>*</span>}
      </label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

const wrap: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  color: "#111827",
};

const card: CSSProperties = {
  width: "100%",
  maxWidth: 540,
  background: "#ffffff",
  padding: 28,
  borderRadius: 28,
  boxShadow: "0 22px 55px rgba(0,0,0,0.12)",
};

const headerBox: CSSProperties = {
  textAlign: "center",
};

const badge: CSSProperties = {
  display: "inline-block",
  padding: "9px 16px",
  borderRadius: 999,
  background: "#ecfdf5",
  color: "#15803d",
  fontSize: 15,
  fontWeight: 950,
};

const title: CSSProperties = {
  margin: "20px 0 0",
  fontSize: 36,
  lineHeight: 1.14,
  fontWeight: 950,
  color: "#111827",
  letterSpacing: "-0.05em",
};

const desc: CSSProperties = {
  marginTop: 14,
  fontSize: 17,
  lineHeight: 1.65,
  color: "#374151",
  fontWeight: 800,
};

const eventBox: CSSProperties = {
  marginTop: 24,
  padding: 24,
  borderRadius: 22,
  background: "linear-gradient(135deg, #166534 0%, #16a34a 100%)",
  color: "#ffffff",
  textAlign: "center",
};

const eventBig: CSSProperties = {
  fontSize: 27,
  fontWeight: 950,
  color: "#ffffff",
};

const eventSub: CSSProperties = {
  marginTop: 6,
  fontSize: 24,
  color: "#facc15",
  fontWeight: 950,
};

const eventSmall: CSSProperties = {
  marginTop: 12,
  fontSize: 14,
  fontWeight: 900,
  color: "#ffffff",
};

const formBox: CSSProperties = {
  marginTop: 24,
};

const inputWrap: CSSProperties = {
  marginTop: 16,
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 7,
  fontSize: 15,
  fontWeight: 950,
  color: "#111827",
};

const requiredMark: CSSProperties = {
  color: "#dc2626",
  fontWeight: 950,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 58,
  padding: "0 15px",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  fontSize: 18,
  fontWeight: 800,
  outline: "none",
  boxSizing: "border-box",
};

const btn: CSSProperties = {
  marginTop: 24,
  width: "100%",
  minHeight: 66,
  padding: "18px 16px",
  background: "#16a34a",
  color: "#ffffff",
  fontWeight: 950,
  borderRadius: 17,
  fontSize: 22,
  border: "none",
  cursor: "pointer",
};

const notice: CSSProperties = {
  marginTop: 22,
  padding: 17,
  borderRadius: 16,
  background: "#f9fafb",
  fontSize: 14,
  color: "#374151",
  lineHeight: 1.85,
  fontWeight: 800,
};

const noticeAlert: CSSProperties = {
  color: "#dc2626",
  fontWeight: 950,
};

const completeIcon: CSSProperties = {
  fontSize: 58,
  textAlign: "center",
};

const completeTitle: CSSProperties = {
  marginTop: 14,
  fontSize: 32,
  fontWeight: 950,
  textAlign: "center",
  color: "#111827",
};

const numberBox: CSSProperties = {
  marginTop: 20,
  padding: 22,
  borderRadius: 22,
  background: "#fef3c7",
  textAlign: "center",
};

const numberLabel: CSSProperties = {
  fontSize: 17,
  fontWeight: 950,
  color: "#92400e",
};

const numberText: CSSProperties = {
  marginTop: 6,
  fontSize: 56,
  fontWeight: 950,
  color: "#dc2626",
  letterSpacing: "-0.06em",
};

const completeDesc: CSSProperties = {
  marginTop: 14,
  fontSize: 17,
  lineHeight: 1.75,
  textAlign: "center",
  color: "#374151",
  fontWeight: 800,
};

const flowBox: CSSProperties = {
  marginTop: 18,
  padding: 16,
  borderRadius: 16,
  background: "#f9fafb",
  display: "grid",
  gap: 8,
  fontSize: 14,
  lineHeight: 1.7,
  fontWeight: 850,
  color: "#374151",
};

const urgentNotice: CSSProperties = {
  marginTop: 16,
  padding: 15,
  borderRadius: 15,
  background: "#fff7ed",
  color: "#9a3412",
  fontWeight: 950,
  textAlign: "center",
  lineHeight: 1.6,
};

const kakaoButton: CSSProperties = {
  display: "block",
  marginTop: 20,
  padding: 17,
  borderRadius: 15,
  background: "#FEE500",
  color: "#111827",
  fontWeight: 950,
  textAlign: "center",
  textDecoration: "none",
  fontSize: 17,
};

const findButton: CSSProperties = {
  display: "block",
  marginTop: 10,
  padding: 17,
  borderRadius: 15,
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 950,
  textAlign: "center",
  textDecoration: "none",
};

const backButton: CSSProperties = {
  display: "block",
  marginTop: 10,
  padding: 17,
  borderRadius: 15,
  background: "#111827",
  color: "#ffffff",
  fontWeight: 950,
  textAlign: "center",
  textDecoration: "none",
};