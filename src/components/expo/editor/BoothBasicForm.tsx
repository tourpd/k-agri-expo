"use client";

import React, { useState } from "react";

type BoothShape = {
  booth_id?: string;
  name?: string;
  title?: string;
  intro?: string;
  description?: string;

  category_primary?: string;
  category_secondary?: string;

  hall_id?: string;
  slot_code?: string;

  contact_name?: string;
  email?: string;
  website_url?: string;

  youtube_url?: string;

  logo_url?: string;
  cover_image_url?: string;
  thumbnail_url?: string;
  banner_url?: string;

  is_public?: boolean;
  is_active?: boolean;
  is_published?: boolean;
  status?: string;
};

type Props = {
  form: BoothShape;
  setForm: React.Dispatch<React.SetStateAction<BoothShape>>;
  onSave: (data: BoothShape) => Promise<void>;
};

function safe(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function trimmed(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function normalizeHallId(v?: string) {
  const hall = trimmed(v, "");
  if (!hall) return "";
  if (hall === "agri_inputs") return "agri-inputs";
  if (hall === "smart_farm") return "smartfarm";
  if (hall === "eco_friendly") return "eco-friendly";
  if (hall === "future_insect") return "future-insect";
  return hall;
}

function normalizeSlotCode(v?: string) {
  const slot = trimmed(v, "");
  if (!slot) return "-";
  const raw = slot.toUpperCase().replace(/\s+/g, "");
  const m = raw.match(/^([A-Z])[-_]?0*([0-9]+)$/);
  if (!m) return raw;
  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

function hallLabel(v?: string) {
  const hall = normalizeHallId(v);
  if (!hall) return "-";
  if (hall === "agri-inputs") return "농자재관";
  if (hall === "machines" || hall === "agri-machinery") return "농기계관";
  if (hall === "seeds") return "종자관";
  if (hall === "smartfarm") return "스마트팜관";
  if (hall === "eco-friendly" || hall === "eco") return "친환경관";
  if (hall === "future-insect" || hall === "future-food") return "미래식량관";
  return hall;
}

export default function BoothBasicForm({ form, setForm, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function setField<K extends keyof BoothShape>(key: K, value: BoothShape[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const boothId = trimmed(form.booth_id, "");
      if (!boothId) {
        throw new Error(
          "booth_id가 없습니다. 먼저 운영자에서 부스가 생성되어 있어야 합니다."
        );
      }

      const payload: BoothShape = {
        ...form,
        booth_id: boothId,
        name: trimmed(form.name, ""),
        title: trimmed(form.title, "") || trimmed(form.name, ""),
        intro: safe(form.intro, ""),
        description: safe(form.description, ""),
        category_primary: safe(form.category_primary, ""),
        category_secondary: safe(form.category_secondary, ""),
        contact_name: safe(form.contact_name, ""),
        email: safe(form.email, ""),
        website_url: safe(form.website_url, ""),
        youtube_url: safe(form.youtube_url, ""),
        logo_url: safe(form.logo_url, ""),
        cover_image_url: safe(form.cover_image_url, ""),
        thumbnail_url: safe(form.cover_image_url || form.thumbnail_url, ""),
        banner_url: safe(form.cover_image_url || form.banner_url, ""),
        hall_id: normalizeHallId(form.hall_id),
        slot_code: normalizeSlotCode(form.slot_code),
        is_public: form.is_public === true,
        is_active: true,
        is_published: form.is_public === true,
        status: form.is_public ? "published" : "draft",
      };

      await onSave(payload);
      setMessage("부스 정보가 저장되었습니다.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "부스 저장 중 오류가 발생했습니다."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} style={S.card}>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>부스 기본 정보</h2>
          <div style={S.subTitle}>
            업체 기본 설명, 카테고리, 담당자, 링크, 공개 여부를 설정합니다.
          </div>
        </div>

        <div style={S.statusBox}>
          <div style={S.statusLabel}>현재 위치</div>
          <div style={S.statusValue}>
            {hallLabel(form.hall_id)} / {normalizeSlotCode(form.slot_code)}
          </div>
        </div>
      </div>

      <div style={S.grid2}>
        <label style={S.labelWrap}>
          <div style={S.label}>부스명</div>
          <input
            style={S.input}
            value={safe(form.name, "")}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="예: DOF 작물별 특가관"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>부스 한줄 제목</div>
          <input
            style={S.input}
            value={safe(form.title, "")}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="예: 농민 구매 / 대리점 모집 / 바이어 연결"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>대표 담당자명</div>
          <input
            style={S.input}
            value={safe(form.contact_name, "")}
            onChange={(e) => setField("contact_name", e.target.value)}
            placeholder="담당자명"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>상담 이메일</div>
          <input
            style={S.input}
            value={safe(form.email, "")}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="이메일 문의만 받기"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>대표 카테고리</div>
          <input
            style={S.input}
            value={safe(form.category_primary, "")}
            onChange={(e) => setField("category_primary", e.target.value)}
            placeholder="예: 비료 / 영양제 / 친환경 자재"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>세부 카테고리</div>
          <input
            style={S.input}
            value={safe(form.category_secondary, "")}
            onChange={(e) => setField("category_secondary", e.target.value)}
            placeholder="예: 활착제 / 칼슘제 / 살충제"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>대표 유튜브 링크</div>
          <input
            style={S.input}
            value={safe(form.youtube_url, "")}
            onChange={(e) => setField("youtube_url", e.target.value)}
            placeholder="대표 소개 영상 링크"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>홈페이지 링크</div>
          <input
            style={S.input}
            value={safe(form.website_url, "")}
            onChange={(e) => setField("website_url", e.target.value)}
            placeholder="https://..."
          />
        </label>
      </div>

      <label style={S.labelWrap}>
        <div style={S.label}>짧은 소개</div>
        <textarea
          style={S.textareaSmall}
          value={safe(form.intro, "")}
          onChange={(e) => setField("intro", e.target.value)}
          placeholder="예: 농민은 바로 구매하고, 대리점은 공급 조건을 보고, 바이어는 대량 문의할 수 있는 전용 부스입니다."
        />
      </label>

      <label style={S.labelWrap}>
        <div style={S.label}>상세 소개</div>
        <textarea
          style={S.textarea}
          value={safe(form.description, "")}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="예: 대표 제품 소개, 어떤 작물에 좋은지, 사용 시기, 구매 흐름, 대리점 모집 조건 등을 쉽게 적어주세요."
        />
      </label>

      <div style={S.infoBox}>
        현재 위치: <b>{hallLabel(form.hall_id)}</b> /{" "}
        <b>{normalizeSlotCode(form.slot_code)}</b>
        <br />
        전화상담 버튼은 넣지 않고, 이메일 / 구매링크 / 신청링크 중심으로 운영합니다.
      </div>

      <div style={S.toggleRow}>
        <button
          type="button"
          style={form.is_public ? S.toggleOn : S.toggleOff}
          onClick={() => setField("is_public", !form.is_public)}
        >
          {form.is_public ? "부스 공개 ON" : "부스 공개 OFF"}
        </button>
      </div>

      {error ? <div style={S.error}>{error}</div> : null}
      {message ? <div style={S.success}>{message}</div> : null}

      <div style={S.submitRow}>
        <button
          type="submit"
          disabled={saving}
          style={saving ? S.disabledBtn : S.saveBtn}
        >
          {saving ? "저장 중..." : "부스 저장하기"}
        </button>
      </div>
    </form>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    border: "1px solid #e5e7eb",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },

  title: {
    fontSize: 22,
    fontWeight: 900,
    margin: 0,
    color: "#111827",
  },

  subTitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.6,
  },

  statusBox: {
    minWidth: 180,
    padding: 12,
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },

  statusLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    marginBottom: 6,
  },

  statusValue: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.5,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },

  labelWrap: {
    display: "block",
    marginBottom: 12,
  },

  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 900,
    color: "#111827",
  },

  input: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "0 14px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },

  textareaSmall: {
    width: "100%",
    minHeight: 100,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: 14,
    fontSize: 15,
    lineHeight: 1.8,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: 160,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: 14,
    fontSize: 15,
    lineHeight: 1.9,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },

  infoBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontSize: 14,
    lineHeight: 1.8,
    fontWeight: 700,
    whiteSpace: "pre-wrap",
  },

  toggleRow: {
    marginTop: 10,
    display: "flex",
  },

  toggleOn: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "1px solid #86efac",
    background: "#ecfdf5",
    color: "#166534",
    fontWeight: 900,
    cursor: "pointer",
  },

  toggleOff: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 900,
    cursor: "pointer",
  },

  submitRow: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  saveBtn: {
    height: 52,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#0f172a",
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
  },

  disabledBtn: {
    height: 52,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#94a3b8",
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "not-allowed",
  },

  error: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 800,
    lineHeight: 1.7,
  },

  success: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontWeight: 800,
    lineHeight: 1.7,
  },
};