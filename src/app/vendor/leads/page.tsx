"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getLeadGrade } from "@/lib/leadScore";

type Lead = {
  id: string;
  booth_id: string | null;
  deal_id?: string | null;

  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;

  source?: string | null;
  campaign?: string | null;
  video_code?: string | null;
  landing_type?: string | null;
  session_id?: string | null;

  region?: string | null;
  crop?: string | null;

  product_id?: string | null;
  product_name?: string | null;

  memo?: string | null;
  status: string;

  lead_score?: number | null;
  priority_rank?: number | null;

  call_count?: number | null;
  last_called_at?: string | null;

  contacted_at?: string | null;
  closed_at?: string | null;
  updated_at?: string | null;
  created_at: string | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function getBoothIdFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("booth_id") ?? "";
}

function isToday(v?: string | null) {
  if (!v) return false;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function makeTelHref(phone?: string | null) {
  const raw = (phone ?? "").trim();
  if (!raw) return null;

  const normalized = raw.replace(/[^\d+]/g, "");
  if (!normalized) return null;

  return `tel:${normalized}`;
}

export default function VendorLeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [boothId, setBoothId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    setBoothId(getBoothIdFromUrl());
  }, []);

  async function load() {
    setLoading(true);
    setErrorText("");

    try {
      const params = new URLSearchParams();

      if (boothId) params.set("booth_id", boothId);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`/api/vendor/leads?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setErrorText(data?.error ?? "리드 목록을 불러오지 못했습니다.");
        setItems([]);
        return;
      }

      setItems((data.items ?? []) as Lead[]);
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (boothId !== "") {
      load();
    }
  }, [boothId, statusFilter]);

  const filteredItems = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      const haystack = [
        item.name ?? "",
        item.phone ?? "",
        item.email ?? "",
        item.message ?? "",
        item.memo ?? "",
        item.source ?? "",
        item.campaign ?? "",
        item.video_code ?? "",
        item.landing_type ?? "",
        item.session_id ?? "",
        item.region ?? "",
        item.crop ?? "",
        item.product_id ?? "",
        item.product_name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [items, q]);

  const hotItems = useMemo(() => {
    return filteredItems.filter(
      (item) => (item.lead_score ?? 0) >= 80 && (item.status ?? "") !== "closed"
    );
  }, [filteredItems]);

  const normalItems = useMemo(() => {
    return filteredItems.filter(
      (item) => !((item.lead_score ?? 0) >= 80 && (item.status ?? "") !== "closed")
    );
  }, [filteredItems]);

  const stats = useMemo(() => {
    const hotCount = filteredItems.filter((item) => (item.lead_score ?? 0) >= 80).length;
    const todayCount = filteredItems.filter((item) => isToday(item.created_at)).length;
    const newCount = filteredItems.filter((item) => (item.status ?? "") === "new").length;
    const contactedCount = filteredItems.filter(
      (item) => (item.status ?? "") === "contacted"
    ).length;

    return {
      hotCount,
      todayCount,
      newCount,
      contactedCount,
    };
  }, [filteredItems]);

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.header}>
          <div>
            <div style={S.kicker}>VENDOR CRM</div>
            <h1 style={S.title}>리드 관리</h1>
            <div style={S.desc}>
              유튜브 유입, 부스 방문, 문의 제출로 강화된 리드를 한 화면에서 관리합니다.
              전화, 응대 상태, 메모, 우선순위가 자동으로 연결됩니다.
            </div>
          </div>

          <button onClick={load} style={S.ghostBtn}>
            새로고침
          </button>
        </div>

        <section style={S.filterBox}>
          <div style={S.filterGrid}>
            <div>
              <div style={S.filterLabel}>부스 ID</div>
              <input
                value={boothId}
                onChange={(e) => setBoothId(e.target.value)}
                placeholder="booth_id"
                style={S.input}
              />
            </div>

            <div>
              <div style={S.filterLabel}>상태</div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={S.input}
              >
                <option value="all">전체</option>
                <option value="new">new</option>
                <option value="contacted">contacted</option>
                <option value="closed">closed</option>
              </select>
            </div>

            <div>
              <div style={S.filterLabel}>검색</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="이름 / 연락처 / 캠페인 / 영상코드 / 작물 / 제품"
                style={S.input}
              />
            </div>
          </div>

          <div style={S.filterActionRow}>
            <button onClick={load} style={S.primaryBtn}>
              필터 적용
            </button>
          </div>
        </section>

        {!loading && !errorText ? (
          <section style={S.summaryGrid}>
            <div style={{ ...S.summaryCard, ...S.summaryHot }}>
              <div style={S.summaryLabel}>🔥 HOT 리드</div>
              <div style={S.summaryValue}>{stats.hotCount}</div>
              <div style={S.summaryDesc}>지금 바로 연락해야 할 리드</div>
            </div>

            <div style={{ ...S.summaryCard, ...S.summaryToday }}>
              <div style={S.summaryLabel}>📅 오늘 신규</div>
              <div style={S.summaryValue}>{stats.todayCount}</div>
              <div style={S.summaryDesc}>오늘 새로 들어온 리드</div>
            </div>

            <div style={{ ...S.summaryCard, ...S.summaryNew }}>
              <div style={S.summaryLabel}>⏳ 미응대</div>
              <div style={S.summaryValue}>{stats.newCount}</div>
              <div style={S.summaryDesc}>아직 손대지 않은 리드</div>
            </div>

            <div style={{ ...S.summaryCard, ...S.summaryContacted }}>
              <div style={S.summaryLabel}>📞 응대중</div>
              <div style={S.summaryValue}>{stats.contactedCount}</div>
              <div style={S.summaryDesc}>현재 후속 연락 중인 리드</div>
            </div>
          </section>
        ) : null}

        {loading ? (
          <div style={S.emptyBox}>불러오는 중...</div>
        ) : errorText ? (
          <div style={S.errorBox}>{errorText}</div>
        ) : filteredItems.length === 0 ? (
          <div style={S.emptyBox}>조건에 맞는 리드가 없습니다.</div>
        ) : (
          <>
            {hotItems.length > 0 ? (
              <section style={S.hotSection}>
                <div style={S.hotSectionHeader}>
                  <div style={S.hotSectionEyebrow}>PINNED PRIORITY</div>
                  <h2 style={S.hotSectionTitle}>🔥 HOT 리드 우선 연락</h2>
                  <div style={S.hotSectionDesc}>
                    점수 80점 이상 고객입니다. 전화 버튼을 누르면 자동으로 응대중 처리 후
                    통화가 연결됩니다.
                  </div>
                </div>

                <div style={S.hotList}>
                  {hotItems.map((item) => (
                    <LeadCard
                      key={`hot-${item.id}`}
                      item={item}
                      onReload={load}
                      isPinnedHot
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section style={S.normalSection}>
              <div style={S.sectionHeader}>
                <h2 style={S.sectionTitle}>전체 리드</h2>
                <div style={S.sectionDesc}>
                  필터 조건에 맞는 전체 리드 목록입니다.
                </div>
              </div>

              <div style={S.list}>
                {normalItems.map((item) => (
                  <LeadCard key={item.id} item={item} onReload={load} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function LeadCard({
  item,
  onReload,
  isPinnedHot = false,
}: {
  item: Lead;
  onReload: () => Promise<void>;
  isPinnedHot?: boolean;
}) {
  const [currentItem, setCurrentItem] = useState<Lead>(item);
  const [status, setStatus] = useState(item.status || "new");
  const [memo, setMemo] = useState(item.memo ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorText, setErrorText] = useState("");
  const [calling, setCalling] = useState(false);

  const initialRef = useRef({
    status: item.status || "new",
    memo: item.memo ?? "",
  });

  const mountedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const score = currentItem.lead_score ?? 0;
  const priorityRank = currentItem.priority_rank ?? 0;
  const grade = getLeadGrade(score);
  const telHref = makeTelHref(currentItem.phone);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function updateLead(payload: { status?: string; memo?: string }) {
    const res = await fetch("/api/vendor/leads/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: currentItem.id,
        ...payload,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error ?? "저장 실패");
    }

    return data.item as Lead;
  }

  async function callLead() {
    const res = await fetch("/api/vendor/leads/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: currentItem.id,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error ?? "전화 처리 실패");
    }

    return data.item as Lead;
  }

  async function handleCallNow() {
    if (!telHref || calling) return;

    try {
      setCalling(true);
      setSaveState("saving");
      setErrorText("");

      const updatedItem = await callLead();

      initialRef.current = {
        status: updatedItem.status || "contacted",
        memo: updatedItem.memo ?? memo,
      };

      setCurrentItem(updatedItem);
      setStatus(updatedItem.status || "contacted");
      setMemo(updatedItem.memo ?? memo);
      setSaveState("saved");

      window.setTimeout(() => {
        window.location.href = telHref;
      }, 120);
    } catch (e: any) {
      setSaveState("error");
      setErrorText(e?.message ?? "전화 처리 실패");
    } finally {
      window.setTimeout(() => {
        setCalling(false);
      }, 500);
    }
  }

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    const changed =
      status !== initialRef.current.status || memo !== initialRef.current.memo;

    if (!changed) return;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(async () => {
      try {
        setSaveState("saving");
        setErrorText("");

        const updatedItem = await updateLead({ status, memo });

        initialRef.current = {
          status: updatedItem.status || status,
          memo: updatedItem.memo ?? memo,
        };

        setCurrentItem(updatedItem);
        setStatus(updatedItem.status || status);
        setMemo(updatedItem.memo ?? memo);
        setSaveState("saved");

        window.setTimeout(() => {
          setSaveState((prev) => (prev === "saved" ? "idle" : prev));
        }, 1200);
      } catch (e: any) {
        setSaveState("error");
        setErrorText(e?.message ?? "저장 실패");
      }
    }, 700);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [status, memo]);

  return (
    <section
      style={{
        ...S.card,
        ...(isPinnedHot ? S.cardPinnedHot : null),
      }}
    >
      <div style={S.rowTop}>
        <div>
          <div style={S.name}>{currentItem.name || "이름 미입력"}</div>

          <div style={S.badgeRow}>
            <div
              style={{
                ...S.scoreBadge,
                ...(grade === "HOT"
                  ? S.scoreHot
                  : grade === "WARM"
                  ? S.scoreWarm
                  : grade === "MILD"
                  ? S.scoreMild
                  : S.scoreCold),
              }}
            >
              {grade}
            </div>

            <div style={S.scoreText}>점수 {score}</div>
            <div style={S.rankText}>우선순위 {priorityRank}</div>
            <div style={S.rankText}>전화 {currentItem.call_count ?? 0}회</div>
            {isPinnedHot ? <div style={S.pinnedBadge}>우선 연락</div> : null}
          </div>
        </div>

        <div
          style={{
            ...S.status,
            ...(status === "closed"
              ? S.statusClosed
              : status === "contacted"
              ? S.statusContacted
              : S.statusNew),
          }}
        >
          {status}
        </div>
      </div>

      <div style={S.meta}>리드 ID: {currentItem.id}</div>
      <div style={S.meta}>부스 ID: {currentItem.booth_id || "-"}</div>
      <div style={S.meta}>딜 ID: {currentItem.deal_id || "-"}</div>
      <div style={S.meta}>연락처: {currentItem.phone || "-"}</div>
      <div style={S.meta}>이메일: {currentItem.email || "-"}</div>
      <div style={S.meta}>유입경로: {currentItem.source || "-"}</div>
      <div style={S.meta}>캠페인: {currentItem.campaign || "-"}</div>
      <div style={S.meta}>영상코드: {currentItem.video_code || "-"}</div>
      <div style={S.meta}>랜딩타입: {currentItem.landing_type || "-"}</div>
      <div style={S.meta}>세션ID: {currentItem.session_id || "-"}</div>
      <div style={S.meta}>지역: {currentItem.region || "-"}</div>
      <div style={S.meta}>작물: {currentItem.crop || "-"}</div>
      <div style={S.meta}>제품 ID: {currentItem.product_id || "-"}</div>
      <div style={S.meta}>제품명: {currentItem.product_name || "-"}</div>
      <div style={S.meta}>생성일: {formatDate(currentItem.created_at)}</div>
      <div style={S.meta}>응대일: {formatDate(currentItem.contacted_at)}</div>
      <div style={S.meta}>마지막 전화: {formatDate(currentItem.last_called_at)}</div>
      <div style={S.meta}>종료일: {formatDate(currentItem.closed_at)}</div>

      <div style={S.messageBox}>{currentItem.message || "메시지 없음"}</div>

      <div style={S.quickActionRow}>
        {telHref ? (
          <button
            type="button"
            onClick={handleCallNow}
            style={S.callBtnButton}
            disabled={calling}
          >
            {calling ? "상태 반영 중..." : "📞 바로 전화하기"}
          </button>
        ) : (
          <span style={S.callBtnDisabled}>📞 전화번호 없음</span>
        )}

        {currentItem.email ? (
          <a href={`mailto:${currentItem.email}`} style={S.mailBtn}>
            ✉️ 이메일 보내기
          </a>
        ) : (
          <span style={S.mailBtnDisabled}>✉️ 이메일 없음</span>
        )}
      </div>

      <div style={S.editorWrap}>
        <div style={S.editorCol}>
          <div style={S.filterLabel}>상태</div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={S.input}>
            <option value="new">new</option>
            <option value="contacted">contacted</option>
            <option value="closed">closed</option>
          </select>
        </div>

        <div style={{ ...S.editorCol, flex: 1.5 }}>
          <div style={S.filterLabel}>운영 메모</div>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 구매 의향 높음 / 다음 주 재연락 / 견적 발송 예정"
            style={S.textarea}
          />
        </div>
      </div>

      <div style={S.actionRow}>
        <button onClick={() => setStatus("contacted")} style={S.primaryBtn}>
          응대중
        </button>

        <button onClick={() => setStatus("closed")} style={S.ghostBtn}>
          종료
        </button>

        <button onClick={() => onReload()} style={S.ghostBtn}>
          목록 새로고침
        </button>

        <div style={S.saveStateBox}>
          {saveState === "saving" ? <span style={S.savingText}>저장 중...</span> : null}
          {saveState === "saved" ? <span style={S.savedText}>저장 완료</span> : null}
          {saveState === "error" ? <span style={S.errorMiniText}>{errorText}</span> : null}
        </div>
      </div>
    </section>
  );
}

function formatDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";

  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px 18px 60px",
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#2563eb",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 32,
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    lineHeight: 1.8,
  },
  filterBox: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    background: "#fff",
    marginBottom: 16,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  filterLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  filterActionRow: {
    marginTop: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 18,
    border: "1px solid #e5e7eb",
    background: "#fff",
  },
  summaryHot: {
    background: "linear-gradient(180deg, #fff1f2 0%, #ffffff 100%)",
    border: "1px solid #fecdd3",
  },
  summaryToday: {
    background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
    border: "1px solid #bfdbfe",
  },
  summaryNew: {
    background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
    border: "1px solid #fdba74",
  },
  summaryContacted: {
    background: "linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%)",
    border: "1px solid #bbf7d0",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: 900,
    color: "#64748b",
  },
  summaryValue: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: 950,
    color: "#111827",
    lineHeight: 1,
  },
  summaryDesc: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 1.6,
    color: "#475569",
  },

  hotSection: {
    marginBottom: 22,
    borderRadius: 22,
    border: "1px solid #fecdd3",
    background: "linear-gradient(180deg, #fff1f2 0%, #ffffff 100%)",
    padding: 16,
  },
  hotSectionHeader: {
    marginBottom: 14,
  },
  hotSectionEyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "#e11d48",
    letterSpacing: 0.4,
  },
  hotSectionTitle: {
    margin: "8px 0 0",
    fontSize: 24,
    fontWeight: 950,
    color: "#111827",
  },
  hotSectionDesc: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
  },
  hotList: {
    display: "grid",
    gap: 14,
  },

  normalSection: {
    marginTop: 8,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 950,
    color: "#111827",
  },
  sectionDesc: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    background: "#fff",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 92,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    background: "#fff",
    fontSize: 14,
    lineHeight: 1.7,
    resize: "vertical",
  },

  list: {
    display: "grid",
    gap: 14,
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    background: "#fff",
  },
  cardPinnedHot: {
    border: "1px solid #fecaca",
    boxShadow: "0 12px 30px rgba(225,29,72,0.08)",
  },
  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  name: {
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
  },
  badgeRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 8,
  },
  scoreBadge: {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 950,
  },
  scoreHot: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  scoreWarm: {
    background: "#ffedd5",
    color: "#c2410c",
    border: "1px solid #fdba74",
  },
  scoreMild: {
    background: "#fef9c3",
    color: "#a16207",
    border: "1px solid #fde68a",
  },
  scoreCold: {
    background: "#e0f2fe",
    color: "#0369a1",
    border: "1px solid #bae6fd",
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 900,
    color: "#334155",
  },
  rankText: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  pinnedBadge: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#111827",
    color: "#fff",
    fontSize: 11,
    fontWeight: 950,
  },
  status: {
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
  },
  statusNew: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  statusContacted: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fdba74",
  },
  statusClosed: {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },

  meta: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
  },
  messageBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    background: "#f8fafc",
    lineHeight: 1.8,
    color: "#334155",
  },
  quickActionRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  callBtnButton: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #16a34a",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  callBtnDisabled: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
    color: "#9ca3af",
    fontWeight: 900,
  },
  mailBtn: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    textDecoration: "none",
  },
  mailBtnDisabled: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
    color: "#9ca3af",
    fontWeight: 900,
  },

  editorWrap: {
    marginTop: 14,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  editorCol: {
    minWidth: 220,
    flex: 1,
  },
  actionRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  primaryBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  saveStateBox: {
    minHeight: 20,
    display: "flex",
    alignItems: "center",
  },
  savingText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: 900,
  },
  savedText: {
    fontSize: 12,
    color: "#15803d",
    fontWeight: 900,
  },
  errorMiniText: {
    fontSize: 12,
    color: "#b91c1c",
    fontWeight: 900,
  },
  errorBox: {
    padding: 18,
    borderRadius: 16,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
  },
  emptyBox: {
    padding: 18,
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#64748b",
  },
};