"use client";

import React, { useEffect, useState } from "react";

type EventForm = {
  id: number;
  title: string;
  description: string;
  prize_text: string;
  hero_image_url: string;
  hero_video_url: string;
  primary_button_text: string;
  primary_button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  is_active: boolean;
};

const EMPTY_FORM: EventForm = {
  id: 1,
  title: "",
  description: "",
  prize_text: "",
  hero_image_url: "",
  hero_video_url: "",
  primary_button_text: "",
  primary_button_link: "",
  secondary_button_text: "",
  secondary_button_link: "",
  is_active: true,
};

export default function AdminEventsPage() {
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  async function load() {
    setLoading(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/events", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setErrorText(data?.error || "이벤트 정보를 불러오지 못했습니다.");
        return;
      }

      const item = data?.item;
      if (!item) {
        setForm(EMPTY_FORM);
        return;
      }

      setForm({
        id: Number(item.id || 1),
        title: item.title || "",
        description: item.description || "",
        prize_text: item.prize_text || "",
        hero_image_url: item.hero_image_url || "",
        hero_video_url: item.hero_video_url || "",
        primary_button_text: item.primary_button_text || "",
        primary_button_link: item.primary_button_link || "",
        secondary_button_text: item.secondary_button_text || "",
        secondary_button_link: item.secondary_button_link || "",
        is_active: typeof item.is_active === "boolean" ? item.is_active : true,
      });
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/events/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setErrorText(data?.error || "저장에 실패했습니다.");
        return;
      }

      setMessage("이벤트 정보가 저장되었습니다.");
      await load();
    } catch {
      setErrorText("저장 중 네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <section style={S.heroCard}>
          <div style={S.kicker}>EVENT CMS</div>
          <h1 style={S.title}>이벤트 콘텐츠 관리자</h1>
          <div style={S.desc}>
            이벤트 제목, 설명, 상금 문구, 배너 이미지, 대표 영상 링크, 버튼 링크를
            여기서 직접 관리합니다.
          </div>
        </section>

        {loading ? (
          <section style={S.formCard}>
            <div style={S.emptyBox}>불러오는 중...</div>
          </section>
        ) : (
          <section style={S.formCard}>
            <div style={S.formGrid}>
              <div style={S.fullCol}>
                <label style={S.label}>이벤트 제목</label>
                <input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="예: 영진로타리 이벤트"
                  style={S.input}
                />
              </div>

              <div style={S.fullCol}>
                <label style={S.label}>상금 문구</label>
                <input
                  value={form.prize_text}
                  onChange={(e) => update("prize_text", e.target.value)}
                  placeholder="예: 1500만원 상당"
                  style={S.input}
                />
              </div>

              <div style={S.fullCol}>
                <label style={S.label}>이벤트 설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="이벤트 설명을 입력해 주세요."
                  style={S.textareaLarge}
                />
              </div>

              <div style={S.fullCol}>
                <label style={S.label}>대표 배너 이미지 URL</label>
                <input
                  value={form.hero_image_url}
                  onChange={(e) => update("hero_image_url", e.target.value)}
                  placeholder="이미지 업로드 관리자에서 받은 공개 URL"
                  style={S.input}
                />
              </div>

              <div style={S.fullCol}>
                <label style={S.label}>대표 영상 링크</label>
                <input
                  value={form.hero_video_url}
                  onChange={(e) => update("hero_video_url", e.target.value)}
                  placeholder="예: https://www.youtube.com/watch?v=..."
                  style={S.input}
                />
              </div>

              <div>
                <label style={S.label}>메인 버튼 문구</label>
                <input
                  value={form.primary_button_text}
                  onChange={(e) => update("primary_button_text", e.target.value)}
                  placeholder="예: 이벤트 참여하기"
                  style={S.input}
                />
              </div>

              <div>
                <label style={S.label}>메인 버튼 링크</label>
                <input
                  value={form.primary_button_link}
                  onChange={(e) => update("primary_button_link", e.target.value)}
                  placeholder="예: /expo/event/apply"
                  style={S.input}
                />
              </div>

              <div>
                <label style={S.label}>보조 버튼 문구</label>
                <input
                  value={form.secondary_button_text}
                  onChange={(e) => update("secondary_button_text", e.target.value)}
                  placeholder="예: 라이브 일정 보기"
                  style={S.input}
                />
              </div>

              <div>
                <label style={S.label}>보조 버튼 링크</label>
                <input
                  value={form.secondary_button_link}
                  onChange={(e) => update("secondary_button_link", e.target.value)}
                  placeholder="예: /expo/live"
                  style={S.input}
                />
              </div>

              <div style={S.fullCol}>
                <label style={S.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => update("is_active", e.target.checked)}
                  />
                  <span>이 이벤트를 활성 상태로 사용</span>
                </label>
              </div>
            </div>

            {message ? <div style={S.successBox}>{message}</div> : null}
            {errorText ? <div style={S.errorBox}>{errorText}</div> : null}

            <div style={S.actionRow}>
              <button onClick={save} disabled={saving} style={S.primaryBtn}>
                {saving ? "저장 중..." : "저장하기"}
              </button>

              <button onClick={load} disabled={saving} style={S.ghostBtn}>
                다시 불러오기
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#e9eef5",
    padding: 28,
  },
  wrap: {
    maxWidth: 1280,
    margin: "0 auto",
  },
  heroCard: {
    borderRadius: 28,
    background: "#fff",
    border: "1px solid #dde5ef",
    boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
    padding: 28,
    marginBottom: 22,
  },
  kicker: {
    fontSize: 14,
    fontWeight: 950,
    color: "#0f8a5f",
    letterSpacing: 0.3,
  },
  title: {
    margin: "12px 0 0",
    fontSize: 34,
    lineHeight: 1.1,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 14,
    color: "#64748b",
    fontSize: 18,
    lineHeight: 1.8,
  },
  formCard: {
    borderRadius: 28,
    background: "#fff",
    border: "1px solid #dde5ef",
    boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
    padding: 24,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 18,
  },
  fullCol: {
    gridColumn: "1 / -1",
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 900,
    color: "#334155",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontSize: 16,
  },
  textareaLarge: {
    width: "100%",
    minHeight: 140,
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontSize: 16,
    resize: "vertical",
    lineHeight: 1.7,
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 15,
    fontWeight: 800,
    color: "#334155",
  },
  successBox: {
    marginTop: 18,
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    color: "#166534",
    padding: 14,
    fontWeight: 900,
  },
  errorBox: {
    marginTop: 18,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    padding: 14,
    fontWeight: 900,
  },
  actionRow: {
    marginTop: 20,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryBtn: {
    padding: "14px 22px",
    borderRadius: 14,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 950,
    fontSize: 16,
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "14px 22px",
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
  },
  emptyBox: {
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#64748b",
    padding: 18,
    fontWeight: 800,
  },
};