// src/app/admin/farmer-crm/FarmerCrmClient.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { FarmerCrmRow } from "./page";

type SortField =
  | "repurchaseScore"
  | "orderCount"
  | "farmSize"
  | "totalQuantity"
  | "latestDate"
  | "nextContactDate";

type SortDir = "asc" | "desc";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function numberFromText(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function dateValue(v: unknown) {
  const s = safe(v);
  if (!s || s === "-") return 0;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : 0;
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function gradeOf(count: number) {
  if (count >= 10) return "VVIP";
  if (count >= 5) return "VIP";
  if (count >= 2) return "HOT";
  return "일반";
}

function gradeStyle(count: number): CSSProperties {
  if (count >= 10) return S.vvipBadge;
  if (count >= 5) return S.vipBadge;
  if (count >= 2) return S.hotBadge;
  return S.normalBadge;
}

function stageColor(stage?: string) {
  const s = safe(stage);

  if (s === "VIP") return "#7c3aed";
  if (s === "재구매관리") return "#dc2626";
  if (s === "구매완료") return "#16a34a";
  if (s === "견적발송") return "#2563eb";
  if (s === "상담중") return "#f59e0b";
  if (s === "휴면") return "#6b7280";

  return "#111827";
}

function repurchaseColor(score?: number) {
  const n = Number(score || 0);

  if (n >= 80) return "#dc2626";
  if (n >= 60) return "#f59e0b";
  if (n >= 40) return "#2563eb";
  if (n >= 20) return "#047857";

  return "#6b7280";
}

function sortLabel(field: SortField, current: SortField, dir: SortDir) {
  if (field !== current) return "↕";
  return dir === "desc" ? "▼" : "▲";
}

export default function FarmerCrmClient({
  rows = [],
  errorMessage = "",
}: {
  rows?: FarmerCrmRow[];
  errorMessage?: string;
}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const today = todayValue();

  const [sortField, setSortField] = useState<SortField>("repurchaseScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [cropFilter, setCropFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");
  const [keyword, setKeyword] = useState("");

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((v) => (v === "desc" ? "asc" : "desc"));
      return;
    }

    setSortField(field);
    setSortDir("desc");
  }

  const crops = useMemo(() => {
    return Array.from(
      new Set(
        safeRows
          .map((r) => safe(r.crop))
          .filter((v) => v && v !== "-")
      )
    ).sort();
  }, [safeRows]);

  const stages = useMemo(() => {
    return Array.from(
      new Set(
        safeRows
          .map((r) => safe(r.profileStage) || "신규")
          .filter(Boolean)
      )
    ).sort();
  }, [safeRows]);

  const filteredRows = useMemo(() => {
    let items = [...safeRows];
    const q = keyword.trim().toLowerCase();

    if (gradeFilter !== "all") {
      items = items.filter((r) => gradeOf(r.orderCount) === gradeFilter);
    }

    if (cropFilter !== "all") {
      items = items.filter((r) => r.crop === cropFilter);
    }

    if (stageFilter !== "all") {
      items = items.filter((r) => (safe(r.profileStage) || "신규") === stageFilter);
    }

    if (contactFilter === "today") {
      items = items.filter(
        (r) =>
          safe(r.nextContactDate) &&
          safe(r.nextContactDate) !== "-" &&
          safe(r.nextContactDate) <= today
      );
    }

    if (contactFilter === "none") {
      items = items.filter(
        (r) => !safe(r.nextContactDate) || safe(r.nextContactDate) === "-"
      );
    }

    if (q) {
      items = items.filter((r) =>
        [
          r.name,
          r.phone,
          r.region,
          r.crop,
          r.farmSize,
          r.latestProduct,
          r.latestStatus,
          r.profileStage,
          r.memo,
          r.repurchaseLabel,
          r.lastNoteDate,
          r.nextContactDate,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    items.sort((a, b) => {
      let av = 0;
      let bv = 0;

      if (sortField === "repurchaseScore") {
        av = Number(a.repurchaseScore || 0);
        bv = Number(b.repurchaseScore || 0);
      }

      if (sortField === "farmSize") {
        av = numberFromText(a.farmSize);
        bv = numberFromText(b.farmSize);
      }

      if (sortField === "orderCount") {
        av = a.orderCount;
        bv = b.orderCount;
      }

      if (sortField === "totalQuantity") {
        av = a.totalQuantity;
        bv = b.totalQuantity;
      }

      if (sortField === "latestDate") {
        av = dateValue(a.latestDate);
        bv = dateValue(b.latestDate);
      }

      if (sortField === "nextContactDate") {
        av = dateValue(a.nextContactDate);
        bv = dateValue(b.nextContactDate);
      }

      return sortDir === "desc" ? bv - av : av - bv;
    });

    return items;
  }, [
    safeRows,
    gradeFilter,
    cropFilter,
    stageFilter,
    contactFilter,
    keyword,
    sortField,
    sortDir,
    today,
  ]);

  const totalFarmers = safeRows.length;
  const highRepurchase = safeRows.filter((r) => Number(r.repurchaseScore || 0) >= 60).length;
  const todayContacts = safeRows.filter(
    (r) =>
      safe(r.nextContactDate) &&
      safe(r.nextContactDate) !== "-" &&
      safe(r.nextContactDate) <= today
  ).length;
  const vipFarmers = safeRows.filter((r) => safe(r.profileStage) === "VIP").length;

  return (
    <main style={S.page}>
      <section style={S.header}>
        <div>
          <div style={S.kicker}>K-AGRI CRM</div>
          <h1 style={S.title}>농민 CRM</h1>
          <p style={S.desc}>
            주문 데이터를 전화번호 기준으로 묶어 농민별 재구매 관리 화면으로 정리합니다.
          </p>
        </div>

        <div style={S.headerLinks}>
          <Link href="/admin/product-orders" style={S.darkLink}>
            주문센터
          </Link>
          <Link href="/admin/sms-logs" style={S.greenLink}>
            SMS 로그
          </Link>
        </div>
      </section>

      <section style={S.stats}>
        <Stat label="농민 수" value={totalFarmers} />
        <Stat label="오늘 연락" value={todayContacts} />
        <Stat label="VIP" value={vipFarmers} />
        <Stat label="재구매 높음" value={highRepurchase} />
      </section>

      {errorMessage ? <section style={S.errorBox}>{errorMessage}</section> : null}

      <section style={S.filterCard}>
        <div style={S.filterGrid}>
          <div>
            <label style={S.label}>등급</label>
            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} style={S.select}>
              <option value="all">전체 등급</option>
              <option value="VVIP">VVIP</option>
              <option value="VIP">VIP</option>
              <option value="HOT">HOT</option>
              <option value="일반">일반</option>
            </select>
          </div>

          <div>
            <label style={S.label}>CRM 단계</label>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={S.select}>
              <option value="all">전체 단계</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={S.label}>작물</label>
            <select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} style={S.select}>
              <option value="all">전체 작물</option>
              {crops.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={S.label}>연락관리</label>
            <select value={contactFilter} onChange={(e) => setContactFilter(e.target.value)} style={S.select}>
              <option value="all">전체</option>
              <option value="today">오늘 연락/지연</option>
              <option value="none">연락일 없음</option>
            </select>
          </div>
        </div>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="농민명 / 전화번호 / 지역 / 작물 / 상품 / 단계 / 상담일 / 다음연락일 검색"
          style={S.search}
        />

        <div style={S.countText}>
          현재 {filteredRows.length}명 / 전체 {safeRows.length}명
        </div>
      </section>

      <section style={S.tableCard}>
        <div style={S.tableTop}>
          <b>농민별 주문 요약</b>
          <span>
            정렬: {sortField} {sortDir === "desc" ? "큰 순" : "작은 순"}
          </span>
        </div>

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>등급</th>

                <th style={S.sortTh} onClick={() => toggleSort("repurchaseScore")}>
                  재구매확률 {sortLabel("repurchaseScore", sortField, sortDir)}
                </th>

                <th style={S.th}>CRM단계</th>
                <th style={S.th}>농민명</th>
                <th style={S.th}>전화번호</th>
                <th style={S.th}>지역</th>
                <th style={S.th}>작물</th>

                <th style={S.sortTh} onClick={() => toggleSort("farmSize")}>
                  재배평수 {sortLabel("farmSize", sortField, sortDir)}
                </th>

                <th style={S.sortTh} onClick={() => toggleSort("orderCount")}>
                  주문횟수 {sortLabel("orderCount", sortField, sortDir)}
                </th>

                <th style={S.th}>최근상품</th>
                <th style={S.th}>최근상태</th>

                <th style={S.sortTh} onClick={() => toggleSort("totalQuantity")}>
                  누적수량 {sortLabel("totalQuantity", sortField, sortDir)}
                </th>

                <th style={S.sortTh} onClick={() => toggleSort("latestDate")}>
                  최근주문일 {sortLabel("latestDate", sortField, sortDir)}
                </th>

                <th style={S.th}>최근상담일</th>

                <th style={S.sortTh} onClick={() => toggleSort("nextContactDate")}>
                  다음연락일 {sortLabel("nextContactDate", sortField, sortDir)}
                </th>

                <th style={S.th}>메모</th>
                <th style={S.th}>관리</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={17} style={S.emptyTd}>
                    CRM 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const score = Number(r.repurchaseScore || 0);
                  const stage = safe(r.profileStage) || "신규";
                  const isContactDue =
                    safe(r.nextContactDate) &&
                    safe(r.nextContactDate) !== "-" &&
                    safe(r.nextContactDate) <= today;

                  return (
                    <tr key={r.key}>
                      <td style={S.td}>
                        <span style={gradeStyle(r.orderCount)}>
                          {gradeOf(r.orderCount)}
                        </span>
                      </td>

                      <td style={S.tdStrong}>
                        <span
                          style={{
                            ...S.repurchaseBadge,
                            color: repurchaseColor(score),
                            background: `${repurchaseColor(score)}18`,
                          }}
                        >
                          {r.repurchaseLabel || "★☆☆☆☆"} {score}점
                        </span>
                      </td>

                      <td style={S.tdStrong}>
                        <span
                          style={{
                            ...S.stageBadge,
                            color: stageColor(stage),
                            background: `${stageColor(stage)}18`,
                          }}
                        >
                          {stage}
                        </span>
                      </td>

                      <td style={S.tdStrong}>{r.name}</td>
                      <td style={S.tdStrong}>{r.phone}</td>
                      <td style={S.addressTd}>{r.region}</td>
                      <td style={S.tdStrong}>{r.crop}</td>
                      <td style={S.td}>{r.farmSize}</td>
                      <td style={S.tdStrong}>{r.orderCount}회</td>
                      <td style={S.productTd}>{r.latestProduct}</td>
                      <td style={S.tdStrong}>{r.latestStatus}</td>
                      <td style={S.td}>{r.totalQuantity}개</td>
                      <td style={S.td}>{r.latestDate}</td>
                      <td style={S.td}>{r.lastNoteDate || "-"}</td>

                      <td
                        style={{
                          ...S.tdStrong,
                          color: isContactDue ? "#dc2626" : "#111827",
                        }}
                      >
                        {r.nextContactDate || "-"}
                      </td>

                      <td style={S.memoTd}>{r.memo}</td>

                      <td style={S.td}>
                        <div style={S.actions}>
                          <a href={`tel:${r.phone}`} style={S.callBtn}>
                            전화
                          </a>

                          <Link href={`/admin/farmer-crm/${encodeURIComponent(r.phone)}`} style={S.crmBtn}>
                            CRM보기
                          </Link>

                          <Link href={`/admin/product-orders?keyword=${encodeURIComponent(r.phone)}`} style={S.orderBtn}>
                            주문보기
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
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

const S: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#f3f4f6", padding: 16, color: "#111827" },
  header: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 22, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  kicker: { fontSize: 12, fontWeight: 950, color: "#047857" },
  title: { margin: "6px 0 0", fontSize: 34, fontWeight: 950 },
  desc: { marginTop: 8, fontSize: 15, fontWeight: 800, color: "#4b5563" },
  headerLinks: { display: "flex", gap: 8, flexWrap: "wrap" },
  darkLink: link("#111827"),
  greenLink: link("#047857"),
  stats: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: 12 },
  stat: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18 },
  statLabel: { fontSize: 13, fontWeight: 950, color: "#6b7280" },
  statValue: { marginTop: 6, fontSize: 30, fontWeight: 950 },
  errorBox: { background: "#fff1f2", color: "#dc2626", border: "1px solid #fecdd3", borderRadius: 16, padding: 14, marginBottom: 12, fontWeight: 900 },
  filterCard: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 14, marginBottom: 12 },
  filterGrid: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: 10 },
  label: { display: "block", marginBottom: 5, fontSize: 12, fontWeight: 950, color: "#374151" },
  select: { width: "100%", height: 42, borderRadius: 12, border: "1px solid #d1d5db", padding: "0 12px", fontSize: 14, fontWeight: 850, background: "#ffffff" },
  search: { width: "100%", height: 44, borderRadius: 12, border: "1px solid #d1d5db", padding: "0 14px", fontSize: 15, fontWeight: 800, boxSizing: "border-box" },
  countText: { marginTop: 10, fontSize: 14, fontWeight: 900, color: "#374151" },
  tableCard: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 12 },
  tableTop: { display: "flex", justifyContent: "space-between", padding: "8px 4px 12px", fontSize: 15, fontWeight: 950 },
  tableWrap: { overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 16 },
  table: { width: "100%", minWidth: 2050, borderCollapse: "collapse" },
  th: { background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "12px 10px", textAlign: "left", fontSize: 13, fontWeight: 950, whiteSpace: "nowrap" },
  sortTh: { background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "12px 10px", textAlign: "left", fontSize: 13, fontWeight: 950, whiteSpace: "nowrap", cursor: "pointer", color: "#2563eb" },
  td: { borderBottom: "1px solid #e5e7eb", padding: "13px 10px", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap" },
  tdStrong: { borderBottom: "1px solid #e5e7eb", padding: "13px 10px", fontSize: 14, fontWeight: 950, whiteSpace: "nowrap" },
  addressTd: { borderBottom: "1px solid #e5e7eb", padding: "13px 10px", fontSize: 14, fontWeight: 800, minWidth: 260, whiteSpace: "normal" },
  productTd: { borderBottom: "1px solid #e5e7eb", padding: "13px 10px", fontSize: 14, fontWeight: 950, minWidth: 200, whiteSpace: "normal" },
  memoTd: { borderBottom: "1px solid #e5e7eb", padding: "13px 10px", fontSize: 14, fontWeight: 800, minWidth: 220, whiteSpace: "normal" },
  emptyTd: { padding: 30, textAlign: "center", color: "#6b7280", fontWeight: 900 },
  hotBadge: badge("#dc2626", "#dc262618"),
  vipBadge: badge("#7c3aed", "#7c3aed18"),
  vvipBadge: badge("#111827", "#11182718"),
  normalBadge: badge("#4b5563", "#6b728018"),
  stageBadge: { display: "inline-flex", borderRadius: 999, padding: "5px 9px", fontSize: 13, fontWeight: 950, whiteSpace: "nowrap" },
  repurchaseBadge: { display: "inline-flex", borderRadius: 999, padding: "5px 9px", fontSize: 13, fontWeight: 950, whiteSpace: "nowrap" },
  actions: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  callBtn: actionLink("#16a34a"),
  crmBtn: actionLink("#2563eb"),
  orderBtn: actionLink("#111827"),
};

function link(bg: string): CSSProperties {
  return {
    minHeight: 42,
    borderRadius: 12,
    background: bg,
    color: "#ffffff",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 950,
  };
}

function actionLink(bg: string): CSSProperties {
  return {
    minHeight: 34,
    borderRadius: 10,
    background: bg,
    color: "#ffffff",
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: "nowrap",
  };
}

function badge(color: string, background: string): CSSProperties {
  return {
    display: "inline-flex",
    borderRadius: 999,
    background,
    color,
    padding: "5px 9px",
    fontWeight: 950,
    whiteSpace: "nowrap",
  };
}