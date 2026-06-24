// src/app/admin/farmer-crm/inbox/FarmerCallInboxClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type InboxRow = {
  id: string;
  phone?: string | null;
  farmer_name?: string | null;
  summary?: string | null;
  crop?: string | null;
  farm_size?: string | null;
  lead_type?: string | null;
  customer_value?: string | null;
  buy_probability?: number | null;
  stage?: string | null;
  recommended_product?: string | null;
  next_action?: string | null;
  call_priority?: string | null;
  tags?: string[] | null;
  matched?: boolean | null;
  saved_to_crm?: boolean | null;
  created_at?: string | null;
};

type InboxResult = {
  success: boolean;
  inbox_id?: string;
  detected_phone?: string;
  farmer_name?: string;
  matched_farmer_name?: string;
  matched?: boolean;
  profile_url?: string;
  transcript?: string;
  summary?: string;
  stage?: string;
  next_contact_at?: string;
  repurchase_score?: number;
  buy_probability?: number;
  customer_value?: string;
  lead_type?: string;
  call_priority?: string;
  tags?: string[];
  recommended_product?: string;
  action?: string;
  crop?: string;
  farm_size?: string;
  satisfaction?: string;
  purchase_signal?: string;
  money_signal?: string;
  manager_memo?: string;
  error?: string;
};

type FilterKey = "all" | "hot" | "urgent" | "repurchase" | "quote" | "new";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).replace("T", " ").slice(0, 16);
}

function scoreColor(score?: number | null) {
  const n = Number(score || 0);
  if (n >= 80) return "#dc2626";
  if (n >= 60) return "#f59e0b";
  if (n >= 40) return "#2563eb";
  if (n >= 20) return "#047857";
  return "#6b7280";
}

function profileUrl(phone?: string | null) {
  const p = safe(phone);
  return p ? `/admin/farmer-crm/${encodeURIComponent(p)}` : "";
}

export default function FarmerCallInboxClient() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<InboxResult | null>(null);
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [keyword, setKeyword] = useState("");

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadRows() {
    try {
      setListLoading(true);

      const res = await fetch("/api/admin/farmer-call-inbox/list", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data?.success) {
        setRows(data.rows || []);
      }
    } finally {
      setListLoading(false);
    }
  }

  async function analyzeCall() {
    if (!file) {
      setResult({
        success: false,
        error: "먼저 통화녹음 파일을 선택하세요.",
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/farmer-call-inbox", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);

      if (data?.success) {
        await loadRows();
      }
    } catch {
      setResult({
        success: false,
        error: "AI 상담수신함 분석 중 네트워크 오류",
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveToCrm() {
    if (!result?.success) return;

    const phone = safe(result.detected_phone);

    if (!phone) {
      setResult({
        ...result,
        error: "전화번호를 찾지 못해 CRM에 저장할 수 없습니다.",
      });
      return;
    }

    try {
      setSaving(true);

      const memoText = [
        result.manager_memo || result.summary,
        result.recommended_product ? `추천상품: ${result.recommended_product}` : "",
        result.action ? `다음 행동: ${result.action}` : "",
        result.crop ? `작물: ${result.crop}` : "",
        result.farm_size ? `재배면적: ${result.farm_size}` : "",
        result.purchase_signal ? `구매신호: ${result.purchase_signal}` : "",
        result.money_signal ? `돈 될 가능성: ${result.money_signal}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const noteText = [
        `[AI 상담수신함 자동기록]`,
        result.summary ? `요약: ${result.summary}` : "",
        result.transcript ? `\n[녹취록]\n${result.transcript}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const profileRes = await fetch("/api/admin/farmer-profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          farmer_name: result.matched_farmer_name || result.farmer_name || "",
          crop: result.crop || "",
          farm_size: result.farm_size || "",
          stage: result.stage || "상담중",
          next_contact_at: result.next_contact_at || null,
          repurchase_score: Number(result.repurchase_score || result.buy_probability || 50),
          memo: memoText,
          last_contact_at: new Date().toISOString(),
        }),
      });

      const profileData = await profileRes.json();

      if (!profileData?.success) {
        setResult({
          ...result,
          error: profileData?.error || "CRM 상태 저장 실패",
        });
        return;
      }

      const noteRes = await fetch("/api/admin/farmer-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          farmer_name: result.matched_farmer_name || result.farmer_name || "",
          note: noteText,
        }),
      });

      const noteData = await noteRes.json();

      if (!noteData?.success) {
        setResult({
          ...result,
          error: noteData?.message || "상담기록 저장 실패",
        });
        return;
      }

      setResult({
        ...result,
        matched: true,
        profile_url: `/admin/farmer-crm/${encodeURIComponent(phone)}`,
        error: "",
      });

      await loadRows();
    } catch {
      setResult({
        ...result,
        error: "CRM 저장 중 네트워크 오류",
      });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    let items = [...rows];
    const q = keyword.trim().toLowerCase();

    if (filter === "hot") {
      items = items.filter((r) => Number(r.buy_probability || 0) >= 60);
    }

    if (filter === "urgent") {
      items = items.filter((r) => safe(r.call_priority) === "긴급" || Number(r.buy_probability || 0) >= 80);
    }

    if (filter === "repurchase") {
      items = items.filter((r) => safe(r.stage).includes("재구매") || safe(r.lead_type).includes("재구매"));
    }

    if (filter === "quote") {
      items = items.filter((r) => safe(r.stage).includes("견적") || safe(r.lead_type).includes("견적"));
    }

    if (filter === "new") {
      items = items.filter((r) => safe(r.lead_type).includes("신규") || !r.matched);
    }

    if (q) {
      items = items.filter((r) =>
        [
          r.phone,
          r.farmer_name,
          r.summary,
          r.crop,
          r.farm_size,
          r.lead_type,
          r.customer_value,
          r.stage,
          r.recommended_product,
          r.next_action,
          r.call_priority,
          ...(r.tags || []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return items;
  }, [rows, filter, keyword]);

  const total = rows.length;
  const hot = rows.filter((r) => Number(r.buy_probability || 0) >= 60).length;
  const urgent = rows.filter((r) => safe(r.call_priority) === "긴급" || Number(r.buy_probability || 0) >= 80).length;
  const newLead = rows.filter((r) => !r.matched).length;

  return (
    <section style={S.pageGrid}>
      <section style={S.stats}>
        <Stat label="전체 상담" value={total} />
        <Stat label="구매 가능 높음" value={hot} />
        <Stat label="긴급 연락" value={urgent} />
        <Stat label="신규 리드" value={newLead} />
      </section>

      <section style={S.uploadBox}>
        <div>
          <h2 style={S.sectionTitle}>통화녹음 업로드</h2>
          <p style={S.sectionDesc}>
            녹음파일을 올리면 AI가 전화번호, 작물, 구매확률, 다음 행동을 자동 분석하고 수신함에 저장합니다.
          </p>
        </div>

        <input
          type="file"
          accept="audio/*,.m4a,.mp3,.wav,.webm,.mp4"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setResult(null);
          }}
          style={S.fileInput}
        />

        <button
          type="button"
          onClick={analyzeCall}
          disabled={loading}
          style={{ ...S.analyzeBtn, opacity: loading ? 0.65 : 1 }}
        >
          {loading ? "AI 분석 중..." : "AI 상담 분석 시작"}
        </button>
      </section>

      {result ? (
        <section style={result.success ? S.resultBox : S.errorBox}>
          {!result.success ? (
            <b>{result.error || "분석 실패"}</b>
          ) : (
            <>
              <div style={S.resultTop}>
                <div>
                  <div style={S.kickerBlue}>방금 분석한 상담</div>
                  <h2 style={S.resultTitle}>
                    {result.matched_farmer_name || result.farmer_name || "농민명 미확인"}
                  </h2>
                  <p style={S.resultDesc}>감지 전화번호: {result.detected_phone || "-"}</p>
                </div>

                <span
                  style={{
                    ...S.scoreBadge,
                    color: scoreColor(result.buy_probability || result.repurchase_score),
                    background: `${scoreColor(result.buy_probability || result.repurchase_score)}18`,
                  }}
                >
                  구매확률 {Number(result.buy_probability || result.repurchase_score || 0)}점
                </span>
              </div>

              <div style={S.grid}>
                <Info label="상담요약" value={result.summary} />
                <Info label="리드유형" value={result.lead_type || "-"} />
                <Info label="고객가치" value={result.customer_value || "-"} />
                <Info label="우선순위" value={result.call_priority || "-"} />
                <Info label="CRM 단계" value={result.stage} />
                <Info label="추천상품" value={result.recommended_product || "-"} />
                <Info label="작물" value={result.crop || "-"} />
                <Info label="재배면적" value={result.farm_size || "-"} />
                <Info label="구매신호" value={result.purchase_signal || "-"} />
                <Info label="돈 될 가능성" value={result.money_signal || "-"} />
              </div>

              <div style={S.memoBox}>
                <b>다음 행동</b>
                <p>{result.action || result.manager_memo || "-"}</p>
              </div>

              {result.error ? <div style={S.errorText}>{result.error}</div> : null}

              <div style={S.actionRow}>
                <button
                  type="button"
                  onClick={saveToCrm}
                  disabled={saving}
                  style={{ ...S.saveBtn, opacity: saving ? 0.65 : 1 }}
                >
                  {saving ? "CRM 저장 중..." : "CRM에 자동 저장"}
                </button>

                {result.profile_url ? (
                  <Link href={result.profile_url} style={S.openBtn}>
                    CRM 열기
                  </Link>
                ) : null}
              </div>
            </>
          )}
        </section>
      ) : null}

      <section style={S.tableCard}>
        <div style={S.tableTop}>
          <b>AI 상담수신함 목록</b>
          <span>{listLoading ? "불러오는 중" : `총 ${filteredRows.length}건`}</span>
        </div>

        <div style={S.filterRow}>
          <FilterButton label="전체" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterButton label="구매가능 높음" active={filter === "hot"} onClick={() => setFilter("hot")} />
          <FilterButton label="긴급" active={filter === "urgent"} onClick={() => setFilter("urgent")} />
          <FilterButton label="재구매" active={filter === "repurchase"} onClick={() => setFilter("repurchase")} />
          <FilterButton label="견적" active={filter === "quote"} onClick={() => setFilter("quote")} />
          <FilterButton label="신규" active={filter === "new"} onClick={() => setFilter("new")} />
        </div>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="전화번호 / 농민명 / 작물 / 추천상품 / 태그 검색"
          style={S.search}
        />

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>일시</th>
                <th style={S.th}>전화번호</th>
                <th style={S.th}>농민명</th>
                <th style={S.th}>작물</th>
                <th style={S.th}>구매확률</th>
                <th style={S.th}>우선순위</th>
                <th style={S.th}>리드유형</th>
                <th style={S.th}>고객가치</th>
                <th style={S.th}>추천상품</th>
                <th style={S.th}>다음행동</th>
                <th style={S.th}>태그</th>
                <th style={S.th}>관리</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} style={S.emptyTd}>
                    상담수신함 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const url = profileUrl(r.phone);

                  return (
                    <tr key={r.id}>
                      <td style={S.td}>{shortDate(r.created_at)}</td>
                      <td style={S.tdStrong}>{r.phone || "-"}</td>
                      <td style={S.tdStrong}>{r.farmer_name || "-"}</td>
                      <td style={S.tdStrong}>{r.crop || "-"}</td>
                      <td style={S.tdStrong}>
                        <span
                          style={{
                            ...S.smallBadge,
                            color: scoreColor(r.buy_probability),
                            background: `${scoreColor(r.buy_probability)}18`,
                          }}
                        >
                          {Number(r.buy_probability || 0)}점
                        </span>
                      </td>
                      <td style={S.td}>{r.call_priority || "-"}</td>
                      <td style={S.td}>{r.lead_type || "-"}</td>
                      <td style={S.tdStrong}>{r.customer_value || "-"}</td>
                      <td style={S.productTd}>{r.recommended_product || "-"}</td>
                      <td style={S.memoTd}>{r.next_action || r.summary || "-"}</td>
                      <td style={S.tagTd}>
                        {(r.tags || []).slice(0, 4).map((tag) => (
                          <span key={tag} style={S.tag}>
                            {tag}
                          </span>
                        ))}
                      </td>
                      <td style={S.td}>
                        {url ? (
                          <Link href={url} style={S.openSmallBtn}>
                            CRM 열기
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={S.stat}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
    </div>
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

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active ? S.filterActiveBtn : S.filterBtn}
    >
      {label}
    </button>
  );
}

const S: Record<string, CSSProperties> = {
  pageGrid: { display: "grid", gap: 12 },
  stats: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 },
  stat: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 16 },
  statLabel: { fontSize: 13, fontWeight: 950, color: "#6b7280" },
  statValue: { marginTop: 6, fontSize: 30, fontWeight: 950 },
  uploadBox: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 18, display: "grid", gap: 12 },
  sectionTitle: { margin: 0, fontSize: 24, fontWeight: 950 },
  sectionDesc: { marginTop: 6, fontSize: 14, fontWeight: 800, color: "#4b5563" },
  fileInput: { width: "100%", border: "1px solid #d1d5db", borderRadius: 14, padding: 12, background: "#ffffff", fontSize: 15, fontWeight: 850, boxSizing: "border-box" },
  analyzeBtn: { minHeight: 50, borderRadius: 16, border: "none", background: "#2563eb", color: "#ffffff", padding: "0 18px", fontSize: 16, fontWeight: 950, cursor: "pointer" },
  resultBox: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 18 },
  errorBox: { background: "#fff1f2", color: "#dc2626", border: "1px solid #fecdd3", borderRadius: 18, padding: 16, fontWeight: 950 },
  resultTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 },
  kickerBlue: { fontSize: 12, fontWeight: 950, color: "#2563eb" },
  resultTitle: { margin: "4px 0 0", fontSize: 28, fontWeight: 950 },
  resultDesc: { marginTop: 6, fontSize: 14, fontWeight: 850, color: "#4b5563" },
  scoreBadge: { display: "inline-flex", alignItems: "center", minHeight: 40, borderRadius: 999, padding: "0 14px", fontSize: 16, fontWeight: 950, whiteSpace: "nowrap" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginBottom: 12 },
  infoItem: { border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, background: "#f9fafb" },
  infoLabel: { fontSize: 12, fontWeight: 950, color: "#6b7280", marginBottom: 5 },
  infoValue: { fontSize: 15, fontWeight: 950, color: "#111827", whiteSpace: "pre-wrap" },
  memoBox: { border: "1px solid #e5e7eb", borderRadius: 16, padding: 14, background: "#f9fafb", marginBottom: 10 },
  errorText: { color: "#dc2626", fontWeight: 950, marginBottom: 10 },
  actionRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  saveBtn: { minHeight: 46, borderRadius: 14, border: "none", background: "#047857", color: "#ffffff", padding: "0 16px", fontSize: 15, fontWeight: 950, cursor: "pointer" },
  openBtn: { minHeight: 46, borderRadius: 14, background: "#111827", color: "#ffffff", padding: "0 16px", display: "inline-flex", alignItems: "center", textDecoration: "none", fontSize: 15, fontWeight: 950 },
  tableCard: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 12 },
  tableTop: { display: "flex", justifyContent: "space-between", padding: "8px 4px 12px", fontSize: 15, fontWeight: 950 },
  filterRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  filterBtn: { minHeight: 36, borderRadius: 12, border: "1px solid #d1d5db", background: "#ffffff", color: "#111827", padding: "0 12px", fontSize: 13, fontWeight: 950, cursor: "pointer" },
  filterActiveBtn: { minHeight: 36, borderRadius: 12, border: "none", background: "#2563eb", color: "#ffffff", padding: "0 12px", fontSize: 13, fontWeight: 950, cursor: "pointer" },
  search: { width: "100%", height: 44, borderRadius: 12, border: "1px solid #d1d5db", padding: "0 14px", fontSize: 15, fontWeight: 800, boxSizing: "border-box", marginBottom: 10 },
  tableWrap: { overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 16 },
  table: { width: "100%", minWidth: 1700, borderCollapse: "collapse" },
  th: { background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "12px 10px", textAlign: "left", fontSize: 13, fontWeight: 950, whiteSpace: "nowrap" },
  td: { borderBottom: "1px solid #e5e7eb", padding: "12px 10px", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap" },
  tdStrong: { borderBottom: "1px solid #e5e7eb", padding: "12px 10px", fontSize: 14, fontWeight: 950, whiteSpace: "nowrap" },
  productTd: { borderBottom: "1px solid #e5e7eb", padding: "12px 10px", fontSize: 14, fontWeight: 950, minWidth: 160, whiteSpace: "normal" },
  memoTd: { borderBottom: "1px solid #e5e7eb", padding: "12px 10px", fontSize: 14, fontWeight: 800, minWidth: 260, whiteSpace: "normal" },
  tagTd: { borderBottom: "1px solid #e5e7eb", padding: "12px 10px", minWidth: 220 },
  tag: { display: "inline-flex", margin: 2, borderRadius: 999, background: "#f3f4f6", padding: "4px 8px", fontSize: 12, fontWeight: 900 },
  smallBadge: { display: "inline-flex", borderRadius: 999, padding: "5px 9px", fontSize: 13, fontWeight: 950 },
  openSmallBtn: { minHeight: 32, borderRadius: 10, background: "#111827", color: "#ffffff", padding: "0 10px", display: "inline-flex", alignItems: "center", textDecoration: "none", fontSize: 13, fontWeight: 950 },
  emptyTd: { padding: 30, textAlign: "center", color: "#6b7280", fontWeight: 900 },
};