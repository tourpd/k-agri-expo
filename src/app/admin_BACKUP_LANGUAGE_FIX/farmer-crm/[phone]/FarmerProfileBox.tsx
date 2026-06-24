// src/app/admin/farmer-crm/[phone]/FarmerProfileBox.tsx
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type FarmerProfile = {
  id?: string;
  phone?: string | null;
  farmer_name?: string | null;
  region?: string | null;
  crop?: string | null;
  farm_size?: string | null;
  stage?: string | null;
  last_contact_at?: string | null;
  next_contact_at?: string | null;
  memo?: string | null;
  repurchase_score?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const STAGES = ["신규", "상담중", "견적발송", "구매완료", "재구매관리", "VIP", "휴면"];

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function dateInputValue(v?: string | null) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function afterDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function stageColor(stage: string) {
  if (stage === "VIP") return "#7c3aed";
  if (stage === "재구매관리") return "#dc2626";
  if (stage === "구매완료") return "#16a34a";
  if (stage === "견적발송") return "#2563eb";
  if (stage === "상담중") return "#f59e0b";
  if (stage === "휴면") return "#6b7280";
  return "#111827";
}

export default function FarmerProfileBox({
  phone,
  farmerName,
  region,
  crop,
  farmSize,
}: {
  phone: string;
  farmerName: string;
  region: string;
  crop: string;
  farmSize: string;
}) {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [stage, setStage] = useState("신규");
  const [nextContactAt, setNextContactAt] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadProfile() {
    if (!safe(phone)) return;

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(
        `/api/admin/farmer-profiles?phone=${encodeURIComponent(phone)}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!data?.success) {
        setMessage(data?.error || "고객 프로필 조회 실패");
        return;
      }

      const p = data.profile as FarmerProfile | null;

      setProfile(p);
      setStage(safe(p?.stage) || "신규");
      setNextContactAt(dateInputValue(p?.next_contact_at));
      setMemo(safe(p?.memo));
    } catch {
      setMessage("고객 프로필 조회 중 네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!safe(phone)) {
      setMessage("전화번호가 없습니다.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const res = await fetch("/api/admin/farmer-profiles", {
        method: profile ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          farmer_name: farmerName,
          region,
          crop,
          farm_size: farmSize,
          stage,
          next_contact_at: nextContactAt || null,
          last_contact_at: new Date().toISOString(),
          memo,
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        setMessage(data?.error || "고객 프로필 저장 실패");
        return;
      }

      setProfile(data.profile);
      setMessage("관리상태가 저장되었습니다.");
    } catch {
      setMessage("고객 프로필 저장 중 네트워크 오류");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  return (
    <section style={S.card}>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>고객 상태관리</h2>
          <p style={S.desc}>상담단계, 다음 연락일, 운영 메모를 별도로 관리합니다.</p>
        </div>

        <div style={S.headerRight}>
          <span
            style={{
              ...S.stageBadge,
              color: stageColor(stage),
              background: `${stageColor(stage)}18`,
            }}
          >
            {stage}
          </span>

          <button type="button" onClick={loadProfile} style={S.reloadBtn}>
            {loading ? "불러오는중" : "새로고침"}
          </button>
        </div>
      </div>

      <div style={S.infoGrid}>
        <Info label="고객명" value={farmerName} />
        <Info label="전화번호" value={phone} />
        <Info label="지역" value={region} />
        <Info label="작물" value={crop} />
        <Info label="재배평수" value={farmSize} />
        <Info label="최근 저장" value={dateInputValue(profile?.updated_at) || "-"} />
      </div>

      <div style={S.grid}>
        <div>
          <label style={S.label}>CRM 단계</label>
          <select value={stage} onChange={(e) => setStage(e.target.value)} style={S.select}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={S.label}>다음 연락일</label>
          <input
            type="date"
            value={nextContactAt}
            onChange={(e) => setNextContactAt(e.target.value)}
            style={S.input}
          />
        </div>
      </div>

      <div style={S.quickButtons}>
        <button type="button" style={S.quickBtn} onClick={() => setNextContactAt(todayDate())}>
          오늘 연락
        </button>
        <button type="button" style={S.quickBtn} onClick={() => setNextContactAt(afterDays(3))}>
          3일 뒤
        </button>
        <button type="button" style={S.quickBtn} onClick={() => setNextContactAt(afterDays(7))}>
          7일 뒤
        </button>
        <button type="button" style={S.quickBtn} onClick={() => setNextContactAt(afterDays(14))}>
          14일 뒤
        </button>
      </div>

      <div style={S.memoBox}>
        <label style={S.label}>운영 메모</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예) 6월 중순 재구매 가능성 높음. 아미65 만족. 다음 통화 때 3개 세트 제안."
          style={S.textarea}
        />
      </div>

      <div style={S.footer}>
        <div style={message.includes("실패") || message.includes("오류") ? S.errorText : S.messageText}>
          {message || "변경 후 관리상태 저장을 누르세요."}
        </div>

        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          style={{
            ...S.saveBtn,
            opacity: saving ? 0.65 : 1,
          }}
        >
          {saving ? "저장 중..." : "관리상태 저장"}
        </button>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: unknown }) {
  return (
    <div style={S.infoItem}>
      <div style={S.infoLabel}>{label}</div>
      <div style={S.infoValue}>{safe(value) || "-"}</div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  headerRight: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 950,
  },
  desc: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 800,
    color: "#4b5563",
  },
  stageBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 34,
    borderRadius: 999,
    padding: "0 12px",
    fontSize: 14,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  reloadBtn: {
    minHeight: 38,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: 8,
    marginBottom: 12,
  },
  infoItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#f9fafb",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 950,
    color: "#6b7280",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: 950,
    color: "#111827",
    wordBreak: "break-word",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 10,
    marginBottom: 10,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 950,
    color: "#374151",
  },
  select: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 15,
    fontWeight: 850,
    background: "#ffffff",
  },
  input: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 15,
    fontWeight: 850,
    boxSizing: "border-box",
  },
  quickButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  quickBtn: {
    minHeight: 36,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    padding: "0 12px",
    fontSize: 13,
    fontWeight: 950,
    cursor: "pointer",
  },
  memoBox: {
    marginBottom: 12,
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    borderRadius: 16,
    border: "1px solid #d1d5db",
    padding: 14,
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.6,
    resize: "vertical",
    boxSizing: "border-box",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  messageText: {
    fontSize: 14,
    fontWeight: 900,
    color: "#047857",
  },
  errorText: {
    fontSize: 14,
    fontWeight: 900,
    color: "#dc2626",
  },
  saveBtn: {
    minWidth: 180,
    minHeight: 46,
    borderRadius: 14,
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "0 18px",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
};