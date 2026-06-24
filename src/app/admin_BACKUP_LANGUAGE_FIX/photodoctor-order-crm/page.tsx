"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

type Order = {
  id: string;
  order_code?: string | null;
  created_at?: string | null;
  payment_status?: string | null;
  order_status?: string | null;

  buyer_name?: string | null;
  buyer_phone?: string | null;
  farmer_name?: string | null;
  farmer_phone?: string | null;

  crop?: string | null;
  crop_name?: string | null;
  diagnosis?: string | null;
  issue?: string | null;
  issue_type?: string | null;

  product_name?: string | null;
  quantity?: number | string | null;
  unit_label?: string | null;
  total_amount_krw?: number | string | null;
  total_amount?: number | string | null;

  zipcode?: string | null;
  address?: string | null;
  address_detail?: string | null;
  memo?: string | null;
};

type StatusFilter = "all" | "waiting" | "paid" | "done";

const PAGE_SIZE = 50;

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function text(v: unknown) {
  return safe(v) || "-";
}

function num(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function won(v: unknown) {
  return `${num(v).toLocaleString("ko-KR")}원`;
}

function dateText(v: unknown) {
  if (!v) return "-";
  return new Date(String(v)).toLocaleString("ko-KR");
}

function statusText(o: Order) {
  if (o.order_status === "배송완료") return "배송완료";
  if (o.order_status === "출고완료") return "출고완료";
  if (o.order_status === "출고준비") return "출고준비";
  if (o.payment_status === "입금완료") return "입금완료";
  return "입금대기";
}

function fullAddress(o: Order) {
  const zip = safe(o.zipcode);
  const addr = safe(o.address);
  const detail = safe(o.address_detail);
  return `${zip ? `[${zip}] ` : ""}${addr} ${detail}`.trim() || "-";
}

export default function PhotoDoctorOrderCrmPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  async function loadOrders(nextPage = page) {
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    params.set("limit", String(PAGE_SIZE));
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (status !== "all") params.set("status", status);

    const res = await fetch(`/api/admin/photodoctor-orders?${params.toString()}`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);
    setLoading(false);

    if (!json?.success) {
      alert(json?.error || "주문 목록을 불러오지 못했습니다.");
      return;
    }

    setOrders(json.orders || []);
    setTotal(json.pagination?.total || 0);
    setTotalPages(json.pagination?.totalPages || 1);
    setSelectedIds([]);
  }

  useEffect(() => {
    setPage(1);
    loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const counts = useMemo(() => {
    return {
      current: orders.length,
      selected: selectedIds.length,
      total,
    };
  }, [orders, selectedIds, total]);

  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function togglePage() {
    const ids = orders.map((o) => o.id);
    const allChecked = ids.length > 0 && ids.every((id) => selectedIds.includes(id));

    if (allChecked) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  }

  async function batchUpdate(action: "payment_done" | "ready" | "shipped" | "done" | "cancel") {
    if (selectedIds.length === 0) {
      alert("처리할 주문을 선택하세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedIds.length}건을 처리할까요?`)) return;

    setWorking(true);

    const res = await fetch("/api/admin/photodoctor-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: selectedIds,
        action,
      }),
    });

    const json = await res.json().catch(() => null);
    setWorking(false);

    if (!json?.success) {
      alert(json?.error || "처리에 실패했습니다.");
      return;
    }

    await loadOrders(page);
  }

  return (
    <main style={S.page}>
      <header style={S.header}>
        <div>
          <div style={S.kicker}>PHOTO DOCTOR OMS</div>
          <h1 style={S.title}>포토닥터 주문 운영센터</h1>
          <p style={S.desc}>한 줄에 한 주문씩 보는 엑셀형 관리 화면입니다.</p>
        </div>

        <Link href="/admin" style={S.adminBtn}>
          관리자 홈
        </Link>
      </header>

      <section style={S.stats}>
        <Stat label="전체 주문" value={counts.total} />
        <Stat label="현재 화면" value={counts.current} />
        <Stat label="선택 주문" value={counts.selected} />
      </section>

      <section style={S.toolbar}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          style={S.select}
        >
          <option value="all">전체 상태</option>
          <option value="waiting">입금대기</option>
          <option value="paid">입금완료</option>
          <option value="done">배송완료</option>
        </select>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              loadOrders(1);
            }
          }}
          placeholder="주문번호 / 이름 / 전화 / 작물 / 진단 / 상품 / 주소 검색"
          style={S.search}
        />

        <button type="button" onClick={() => loadOrders(1)} style={S.darkBtn}>
          {loading ? "조회중" : "검색"}
        </button>

        <button type="button" onClick={togglePage} style={S.whiteBtn}>
          현재 페이지 전체선택
        </button>
      </section>

      <section style={S.toolbar}>
        <button type="button" disabled={working} onClick={() => batchUpdate("payment_done")} style={S.greenBtn}>
          입금완료
        </button>
        <button type="button" disabled={working} onClick={() => batchUpdate("ready")} style={S.blueBtn}>
          출고준비
        </button>
        <button type="button" disabled={working} onClick={() => batchUpdate("shipped")} style={S.purpleBtn}>
          출고완료
        </button>
        <button type="button" disabled={working} onClick={() => batchUpdate("done")} style={S.darkBtn}>
          배송완료
        </button>
        <button type="button" disabled={working} onClick={() => batchUpdate("cancel")} style={S.redBtn}>
          취소
        </button>
      </section>

      <section style={S.tableCard}>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <Th>선택</Th>
                <Th>주문번호</Th>
                <Th>주문일</Th>
                <Th>상태</Th>
                <Th>주문자</Th>
                <Th>전화</Th>
                <Th>작물</Th>
                <Th>진단</Th>
                <Th>상품</Th>
                <Th>수량</Th>
                <Th>금액</Th>
                <Th>주소</Th>
                <Th>메모</Th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={13} style={S.empty}>
                    주문이 없습니다.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} style={selectedIds.includes(o.id) ? S.checkedRow : undefined}>
                    <td style={S.tdCenter}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(o.id)}
                        onChange={() => toggleOne(o.id)}
                        style={S.checkbox}
                      />
                    </td>
                    <td style={S.tdStrong}>{text(o.order_code)}</td>
                    <td style={S.td}>{dateText(o.created_at)}</td>
                    <td style={S.td}>
                      <span style={S.badge}>{statusText(o)}</span>
                    </td>
                    <td style={S.tdStrong}>{text(o.buyer_name || o.farmer_name)}</td>
                    <td style={S.tdStrong}>{text(o.buyer_phone || o.farmer_phone)}</td>
                    <td style={S.td}>{text(o.crop || o.crop_name)}</td>
                    <td style={S.td}>{text(o.diagnosis || o.issue || o.issue_type)}</td>
                    <td style={S.tdStrong}>{text(o.product_name)}</td>
                    <td style={S.tdCenter}>
                      {num(o.quantity)}
                      {safe(o.unit_label) || "개"}
                    </td>
                    <td style={S.tdMoney}>{won(o.total_amount_krw || o.total_amount)}</td>
                    <td style={S.addressTd}>{fullAddress(o)}</td>
                    <td style={S.memoTd}>{text(o.memo)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={S.pagination}>
          <button
            type="button"
            style={S.whiteBtn}
            disabled={page <= 1}
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              loadOrders(next);
            }}
          >
            이전
          </button>

          <div style={S.pageText}>
            {page} / {totalPages} 페이지
          </div>

          <button
            type="button"
            style={S.whiteBtn}
            disabled={page >= totalPages}
            onClick={() => {
              const next = Math.min(totalPages, page + 1);
              setPage(next);
              loadOrders(next);
            }}
          >
            다음
          </button>
        </div>
      </section>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={S.th}>{children}</th>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={S.stat}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value.toLocaleString("ko-KR")}</div>
    </div>
  );
}

const buttonBase: CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 950,
  cursor: "pointer",
};

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 20,
    color: "#111827",
  },
  header: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  kicker: {
    fontSize: 13,
    fontWeight: 950,
    color: "#047857",
  },
  title: {
    margin: "6px 0 0",
    fontSize: 32,
    fontWeight: 950,
  },
  desc: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: 800,
    color: "#4b5563",
  },
  adminBtn: {
    background: "#111827",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 950,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 12,
  },
  stat: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 900,
    color: "#6b7280",
  },
  statValue: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: 950,
  },
  toolbar: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  select: {
    height: 46,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontWeight: 900,
    background: "#fff",
  },
  search: {
    flex: 1,
    minWidth: 360,
    height: 46,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontWeight: 800,
  },
  greenBtn: { ...buttonBase, background: "#16a34a", color: "#fff" },
  blueBtn: { ...buttonBase, background: "#2563eb", color: "#fff" },
  purpleBtn: { ...buttonBase, background: "#7c3aed", color: "#fff" },
  darkBtn: { ...buttonBase, background: "#111827", color: "#fff" },
  redBtn: { ...buttonBase, background: "#dc2626", color: "#fff" },
  whiteBtn: {
    ...buttonBase,
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
  },
  tableCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 12,
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
  },
  table: {
    width: "100%",
    minWidth: 1700,
    borderCollapse: "collapse",
    background: "#fff",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  td: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  tdStrong: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  tdCenter: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    textAlign: "center",
    fontSize: 14,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  tdMoney: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 950,
    color: "#dc2626",
    whiteSpace: "nowrap",
  },
  addressTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 800,
    minWidth: 360,
  },
  memoTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 800,
    minWidth: 220,
  },
  checkbox: {
    width: 18,
    height: 18,
  },
  badge: {
    display: "inline-flex",
    borderRadius: 999,
    background: "#fef3c7",
    color: "#92400e",
    padding: "5px 9px",
    fontSize: 12,
    fontWeight: 950,
  },
  checkedRow: {
    background: "#f0fdf4",
  },
  empty: {
    padding: 30,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 900,
  },
  pagination: {
    marginTop: 14,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  pageText: {
    fontWeight: 950,
  },
};