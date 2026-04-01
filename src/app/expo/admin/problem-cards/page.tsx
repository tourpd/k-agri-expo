"use client";

import React, { useEffect, useMemo, useState } from "react";

type ProblemCardRow = {
  id: string;
  title: string;
  summary: string | null;
  link_url: string;
  crop_key: string | null;
  topic_key: string | null;
  season_key: string | null;
  start_month: number;
  end_month: number;
  priority: number;
  is_active: boolean;
  is_featured: boolean;
  badge_text: string | null;
  thumbnail_url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProblemCardForm = {
  id?: string;
  title: string;
  summary: string;
  link_url: string;
  crop_key: string;
  topic_key: string;
  season_key: string;
  start_month: number;
  end_month: number;
  priority: number;
  is_active: boolean;
  is_featured: boolean;
  badge_text: string;
  thumbnail_url: string;
};

const EMPTY_FORM: ProblemCardForm = {
  title: "",
  summary: "",
  link_url: "",
  crop_key: "",
  topic_key: "",
  season_key: "",
  start_month: new Date().getMonth() + 1,
  end_month: new Date().getMonth() + 1,
  priority: 100,
  is_active: true,
  is_featured: false,
  badge_text: "",
  thumbnail_url: "",
};

function monthLabel(start: number, end: number) {
  return start === end ? `${start}월` : `${start}~${end}월`;
}

function isMonthInRange(month: number, startMonth: number, endMonth: number) {
  if (startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth;
  }
  return month >= startMonth || month <= endMonth;
}

export default function ExpoAdminProblemCardsPage() {
  const currentMonth = new Date().getMonth() + 1;

  const [rows, setRows] = useState<ProblemCardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState<number | "all">(currentMonth);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "normal">("all");
  const [cropFilter, setCropFilter] = useState<string>("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<ProblemCardForm>(EMPTY_FORM);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadRows() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await fetch("/api/expo/admin/problem-cards", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "카드 목록을 불러오지 못했습니다.");
      }

      const items = (json?.items ?? []) as ProblemCardRow[];
      setRows(items);

      if (items.length > 0 && !selectedId) {
        selectRow(items[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  function selectRow(row: ProblemCardRow) {
    setSelectedId(row.id);
    setForm({
      id: row.id,
      title: row.title ?? "",
      summary: row.summary ?? "",
      link_url: row.link_url ?? "",
      crop_key: row.crop_key ?? "",
      topic_key: row.topic_key ?? "",
      season_key: row.season_key ?? "",
      start_month: row.start_month ?? currentMonth,
      end_month: row.end_month ?? currentMonth,
      priority: row.priority ?? 100,
      is_active: !!row.is_active,
      is_featured: !!row.is_featured,
      badge_text: row.badge_text ?? "",
      thumbnail_url: row.thumbnail_url ?? "",
    });
    setError("");
    setMessage("");
  }

  function startCreate() {
    setSelectedId(null);
    setForm({
      ...EMPTY_FORM,
      start_month: currentMonth,
      end_month: currentMonth,
    });
    setError("");
    setMessage("");
  }

  const cropOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      if (row.crop_key?.trim()) set.add(row.crop_key.trim());
    });
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        !search.trim() ||
        row.title.toLowerCase().includes(search.toLowerCase()) ||
        (row.summary ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (row.crop_key ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (row.topic_key ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesMonth =
        monthFilter === "all"
          ? true
          : isMonthInRange(monthFilter, row.start_month, row.end_month);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? row.is_active
          : !row.is_active;

      const matchesFeatured =
        featuredFilter === "all"
          ? true
          : featuredFilter === "featured"
          ? row.is_featured
          : !row.is_featured;

      const matchesCrop =
        cropFilter === "all" ? true : (row.crop_key ?? "") === cropFilter;

      return matchesSearch && matchesMonth && matchesStatus && matchesFeatured && matchesCrop;
    });
  }, [rows, search, monthFilter, statusFilter, featuredFilter, cropFilter]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }

    if (!form.link_url.trim()) {
      setError("링크 URL을 입력해 주세요.");
      return;
    }

    if (form.start_month < 1 || form.start_month > 12 || form.end_month < 1 || form.end_month > 12) {
      setError("노출 월은 1~12 사이여야 합니다.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const method = form.id ? "PUT" : "POST";

      const res = await fetch("/api/expo/admin/problem-cards", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "저장에 실패했습니다.");
      }

      setMessage(form.id ? "카드를 수정했습니다." : "새 카드를 추가했습니다.");
      await loadRows();

      if (json?.item?.id) {
        setSelectedId(json.item.id);
        selectRow(json.item);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id) return;

    const ok = window.confirm("이 카드를 삭제하시겠습니까?");
    if (!ok) return;

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      const res = await fetch(`/api/expo/admin/problem-cards?id=${encodeURIComponent(form.id)}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "삭제에 실패했습니다.");
      }

      setMessage("카드를 삭제했습니다.");
      setSelectedId(null);
      setForm({
        ...EMPTY_FORM,
        start_month: currentMonth,
        end_month: currentMonth,
      });

      await loadRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.header}>
          <div style={S.kicker}>PROBLEM CARD STUDIO</div>
          <h1 style={S.title}>농민 고민 해결 카드 편성실</h1>
          <div style={S.desc}>
            월별·작물별 농민 고민 해결 카드를 관리합니다. 현재 월 기준 자동 노출되며, 우선순위와
            featured 여부로 메인 노출 순서를 제어합니다.
          </div>
        </div>

        <div style={S.topBar}>
          <div style={S.filterRow}>
            <input
              style={S.searchInput}
              placeholder="제목 / 요약 / 작물 / 토픽 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              style={S.select}
              value={monthFilter}
              onChange={(e) =>
                setMonthFilter(e.target.value === "all" ? "all" : Number(e.target.value))
              }
            >
              <option value="all">전체 월</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>

            <select
              style={S.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            >
              <option value="all">전체 상태</option>
              <option value="active">활성만</option>
              <option value="inactive">비활성만</option>
            </select>

            <select
              style={S.select}
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value as "all" | "featured" | "normal")}
            >
              <option value="all">전체 노출</option>
              <option value="featured">featured만</option>
              <option value="normal">일반만</option>
            </select>

            <select
              style={S.select}
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
            >
              <option value="all">전체 작물</option>
              {cropOptions.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
          </div>

          <div style={S.actionRow}>
            <button type="button" style={S.secondaryBtn} onClick={loadRows} disabled={loading}>
              {loading ? "새로고침 중..." : "새로고침"}
            </button>
            <button type="button" style={S.primaryBtn} onClick={startCreate}>
              + 새 카드 추가
            </button>
          </div>
        </div>

        {message ? <div style={S.successBox}>{message}</div> : null}
        {error ? <div style={S.errorBox}>{error}</div> : null}

        <div style={S.layout}>
          <section style={S.listPanel}>
            <div style={S.panelTitle}>
              카드 목록
              <span style={S.panelSub}>현재 {filteredRows.length}건</span>
            </div>

            <div style={S.listWrap}>
              {filteredRows.length === 0 ? (
                <div style={S.emptyBox}>조건에 맞는 카드가 없습니다.</div>
              ) : (
                filteredRows.map((row) => {
                  const active = row.id === selectedId;

                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => selectRow(row)}
                      style={{
                        ...S.listItem,
                        ...(active ? S.listItemActive : null),
                      }}
                    >
                      <div style={S.listTop}>
                        <div style={S.listTitle}>{row.title}</div>
                        <div style={S.priorityBadge}>P{row.priority}</div>
                      </div>

                      <div style={S.listMetaRow}>
                        <span style={row.is_active ? S.stateOn : S.stateOff}>
                          {row.is_active ? "활성" : "비활성"}
                        </span>
                        {row.is_featured ? <span style={S.featuredBadge}>featured</span> : null}
                        <span style={S.monthBadge}>
                          {monthLabel(row.start_month, row.end_month)}
                        </span>
                        {row.crop_key ? <span style={S.metaTag}>{row.crop_key}</span> : null}
                      </div>

                      <div style={S.listSummary}>
                        {row.summary?.trim() || "요약 설명 없음"}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section style={S.editorPanel}>
            <div style={S.panelTitle}>
              {form.id ? "카드 편집" : "새 카드 추가"}
              <span style={S.panelSub}>
                {form.id ? "기존 카드 수정" : "새 편성 카드 등록"}
              </span>
            </div>

            <form style={S.form} onSubmit={handleSave}>
              <div style={S.formGrid}>
                <label style={S.field}>
                  <span style={S.label}>제목</span>
                  <input
                    style={S.input}
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="예: 마늘 비대 안 될 때 가장 먼저 점검할 것"
                  />
                </label>

                <label style={S.field}>
                  <span style={S.label}>배지 문구</span>
                  <input
                    style={S.input}
                    value={form.badge_text}
                    onChange={(e) => setForm((prev) => ({ ...prev, badge_text: e.target.value }))}
                    placeholder="예: 마늘 / 긴급 / 3월 필독"
                  />
                </label>

                <label style={{ ...S.field, gridColumn: "1 / -1" }}>
                  <span style={S.label}>요약 설명</span>
                  <textarea
                    style={S.textarea}
                    value={form.summary}
                    onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                    placeholder="카드를 눌러야 하는 이유를 짧게 적어주세요."
                  />
                </label>

                <label style={{ ...S.field, gridColumn: "1 / -1" }}>
                  <span style={S.label}>링크 URL</span>
                  <input
                    style={S.input}
                    value={form.link_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, link_url: e.target.value }))}
                    placeholder="/problems/garlic-bulking-check"
                  />
                </label>

                <label style={S.field}>
                  <span style={S.label}>작물 키</span>
                  <input
                    style={S.input}
                    value={form.crop_key}
                    onChange={(e) => setForm((prev) => ({ ...prev, crop_key: e.target.value }))}
                    placeholder="garlic / pepper / strawberry"
                  />
                </label>

                <label style={S.field}>
                  <span style={S.label}>토픽 키</span>
                  <input
                    style={S.input}
                    value={form.topic_key}
                    onChange={(e) => setForm((prev) => ({ ...prev, topic_key: e.target.value }))}
                    placeholder="growth / pest / disease / nutrition"
                  />
                </label>

                <label style={S.field}>
                  <span style={S.label}>시즌 키</span>
                  <input
                    style={S.input}
                    value={form.season_key}
                    onChange={(e) => setForm((prev) => ({ ...prev, season_key: e.target.value }))}
                    placeholder="spring / summer / autumn / winter"
                  />
                </label>

                <label style={S.field}>
                  <span style={S.label}>썸네일 URL</span>
                  <input
                    style={S.input}
                    value={form.thumbnail_url}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, thumbnail_url: e.target.value }))
                    }
                    placeholder="/images/problem-garlic-bulking.jpg"
                  />
                </label>

                <label style={S.field}>
                  <span style={S.label}>노출 시작월</span>
                  <select
                    style={S.selectEditor}
                    value={form.start_month}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, start_month: Number(e.target.value) }))
                    }
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {m}월
                      </option>
                    ))}
                  </select>
                </label>

                <label style={S.field}>
                  <span style={S.label}>노출 종료월</span>
                  <select
                    style={S.selectEditor}
                    value={form.end_month}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, end_month: Number(e.target.value) }))
                    }
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {m}월
                      </option>
                    ))}
                  </select>
                </label>

                <label style={S.field}>
                  <span style={S.label}>우선순위</span>
                  <input
                    type="number"
                    style={S.input}
                    value={form.priority}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        priority: Number(e.target.value || 100),
                      }))
                    }
                    placeholder="낮을수록 먼저 노출"
                  />
                </label>

                <div style={S.checkboxWrap}>
                  <label style={S.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                      }
                    />
                    활성 카드
                  </label>

                  <label style={S.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, is_featured: e.target.checked }))
                      }
                    />
                    featured 상단 노출
                  </label>
                </div>
              </div>

              <div style={S.previewBox}>
                <div style={S.previewLabel}>미리보기</div>
                <div style={S.previewCard}>
                  <div style={S.previewTitle}>{form.title || "카드 제목"}</div>
                  <div style={S.previewSummary}>
                    {form.summary || "카드 요약 설명이 여기에 표시됩니다."}
                  </div>
                  <div style={S.previewMeta}>
                    <span>{monthLabel(form.start_month, form.end_month)}</span>
                    {form.crop_key ? <span>{form.crop_key}</span> : null}
                    {form.badge_text ? <span>{form.badge_text}</span> : null}
                    {form.is_featured ? <span>featured</span> : null}
                  </div>
                </div>
              </div>

              <div style={S.formActions}>
                <button type="submit" style={S.saveBtn} disabled={saving}>
                  {saving ? "저장 중..." : form.id ? "수정 저장" : "새 카드 저장"}
                </button>

                {form.id ? (
                  <button
                    type="button"
                    style={S.deleteBtn}
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "삭제 중..." : "삭제"}
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px 18px 60px",
  },
  wrap: {
    maxWidth: 1440,
    margin: "0 auto",
  },
  header: {
    marginBottom: 20,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.3,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 34,
    fontWeight: 950,
    letterSpacing: -0.8,
    color: "#0f172a",
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    lineHeight: 1.8,
    fontSize: 15,
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  filterRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    flex: 1,
  },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  searchInput: {
    minWidth: 280,
    height: 44,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: 14,
    background: "#fff",
  },
  select: {
    height: 44,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
  },
  primaryBtn: {
    height: 44,
    border: "none",
    borderRadius: 12,
    background: "#0f172a",
    color: "#fff",
    fontWeight: 900,
    padding: "0 16px",
    cursor: "pointer",
  },
  secondaryBtn: {
    height: 44,
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    padding: "0 16px",
    cursor: "pointer",
  },
  successBox: {
    marginBottom: 14,
    padding: "12px 14px",
    borderRadius: 14,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: 14,
    fontWeight: 700,
  },
  errorBox: {
    marginBottom: 14,
    padding: "12px 14px",
    borderRadius: 14,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 14,
    fontWeight: 700,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "520px minmax(0, 1fr)",
    gap: 18,
    alignItems: "start",
  },
  listPanel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  editorPanel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: 950,
    color: "#0f172a",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 14,
  },
  panelSub: {
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
  },
  listWrap: {
    display: "grid",
    gap: 10,
  },
  listItem: {
    width: "100%",
    textAlign: "left",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    padding: "14px 14px",
    cursor: "pointer",
  },
  listItemActive: {
    border: "1px solid #0f172a",
    background: "#eff6ff",
  },
  listTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  listTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.5,
  },
  priorityBadge: {
    flexShrink: 0,
    borderRadius: 999,
    background: "#0f172a",
    color: "#fff",
    fontSize: 11,
    fontWeight: 900,
    padding: "5px 8px",
  },
  listMetaRow: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  stateOn: {
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    fontSize: 11,
    fontWeight: 900,
    padding: "5px 8px",
  },
  stateOff: {
    borderRadius: 999,
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: 11,
    fontWeight: 900,
    padding: "5px 8px",
  },
  featuredBadge: {
    borderRadius: 999,
    background: "#fef3c7",
    color: "#92400e",
    fontSize: 11,
    fontWeight: 900,
    padding: "5px 8px",
  },
  monthBadge: {
    borderRadius: 999,
    background: "#e0f2fe",
    color: "#075985",
    fontSize: 11,
    fontWeight: 900,
    padding: "5px 8px",
  },
  metaTag: {
    borderRadius: 999,
    background: "#f1f5f9",
    color: "#334155",
    fontSize: 11,
    fontWeight: 900,
    padding: "5px 8px",
  },
  listSummary: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.7,
  },
  emptyBox: {
    borderRadius: 16,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: 18,
    color: "#64748b",
    fontSize: 14,
  },
  form: {
    display: "block",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  field: {
    display: "block",
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
    height: 46,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 14,
    boxSizing: "border-box",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "12px",
    fontSize: 14,
    boxSizing: "border-box",
    background: "#fff",
    resize: "vertical",
  },
  selectEditor: {
    width: "100%",
    height: 46,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
  },
  checkboxWrap: {
    gridColumn: "1 / -1",
    display: "flex",
    gap: 18,
    flexWrap: "wrap",
    paddingTop: 4,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },
  previewBox: {
    marginTop: 18,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: 16,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: 900,
    color: "#475569",
    marginBottom: 10,
  },
  previewCard: {
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
    padding: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.4,
  },
  previewSummary: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#64748b",
  },
  previewMeta: {
    marginTop: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    fontSize: 12,
    fontWeight: 800,
    color: "#334155",
  },
  formActions: {
    marginTop: 18,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  saveBtn: {
    height: 46,
    border: "none",
    borderRadius: 12,
    background: "#0f172a",
    color: "#fff",
    fontWeight: 900,
    padding: "0 18px",
    cursor: "pointer",
  },
  deleteBtn: {
    height: 46,
    border: "1px solid #fecaca",
    borderRadius: 12,
    background: "#fff",
    color: "#b91c1c",
    fontWeight: 900,
    padding: "0 18px",
    cursor: "pointer",
  },
};