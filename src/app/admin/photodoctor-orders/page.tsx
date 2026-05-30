"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export const dynamic = "force-dynamic";

type Order = {
  id: string;
  hall_id?: string | null;
  brand_id?: string | null;
  brand_name?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  product_category?: string | null;

  farmer_name?: string | null;
  phone?: string | null;

  address?: string | null;
  postcode?: string | null;
  base_address?: string | null;
  detail_address?: string | null;

  crop?: string | null;
  farm_size?: string | number | null;

  quantity?: number | string | null;
  recommended_quantity?: number | string | null;
  quantity_note?: string | null;
  unit_label?: string | null;

  depositor_name?: string | null;
  payment_status?: string | null;
  order_status?: string | null;

  delivery_company?: string | null;
  tracking_number?: string | null;

  memo?: string | null;
  created_at?: string | null;
};

type Tab = "waiting" | "shipping" | "completed" | "problem";
type Stage = "waiting" | "paid" | "ready" | "shipped" | "done" | "problem";

const PAGE_SIZE = 30;

const HALLS = [
  { value: "all", label: "전체 관" },
  { value: "crop-nutrition", label: "작물영양관" },
  { value: "pest", label: "병해충솔루션관" },
  { value: "machine", label: "농기계·장비관" },
  { value: "seed", label: "종자·육묘관" },
  { value: "smart", label: "스마트농업·AI관" },
  { value: "future-food", label: "미래식량·곤충관" },
];

function n(v: unknown) {
  const num = Number(String(v ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function won(v?: number | string | null) {
  return `${n(v).toLocaleString("ko-KR")}원`;
}

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function fullAddress(o: Order) {
  const postcode = safe(o.postcode);
  const base = safe(o.base_address);
  const detail = safe(o.detail_address);
  const legacy = safe(o.address);

  if (base || detail) {
    return `${postcode ? `[${postcode}] ` : ""}${base} ${detail}`.trim();
  }

  return legacy || "-";
}

function isProblem(o: Order) {
  return !safe(o.farmer_name) || !safe(o.phone) || !fullAddress(o) || n(o.quantity) <= 0;
}

function stageOf(o: Order): Stage {
  if (isProblem(o)) return "problem";

  if (o.payment_status === "취소" || o.order_status === "취소") return "problem";

  if (o.order_status === "배송완료" || o.order_status === "출고완료") return "done";

  if (safe(o.tracking_number)) return "shipped";

  if (o.order_status === "출고준비") return "ready";

  if (o.payment_status === "입금완료") return "paid";

  return "waiting";
}

function tabOf(o: Order): Tab {
  const stage = stageOf(o);

  if (stage === "problem") return "problem";
  if (stage === "waiting") return "waiting";
  if (stage === "paid" || stage === "ready" || stage === "shipped") return "shipping";
  return "completed";
}

function stageText(stage: Stage) {
  if (stage === "waiting") return "입금대기";
  if (stage === "paid") return "입금완료";
  if (stage === "ready") return "출고준비";
  if (stage === "shipped") return "배송중";
  if (stage === "done") return "배송완료";
  return "문제주문";
}

function stageColor(stage: Stage) {
  if (stage === "waiting") return "#f59e0b";
  if (stage === "paid") return "#16a34a";
  if (stage === "ready") return "#2563eb";
  if (stage === "shipped") return "#7c3aed";
  if (stage === "problem") return "#dc2626";
  return "#111827";
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).replace("T", " ").slice(0, 16);
}

function hallLabel(v?: string | null) {
  return HALLS.find((h) => h.value === v)?.label || safe(v) || "-";
}

export default function AdminProductOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [tab, setTab] = useState<Tab>("waiting");
  const [hallFilter, setHallFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  async function loadOrders() {
    setLoading(true);

    const params = new URLSearchParams();
    if (hallFilter !== "all") params.set("hall_id", hallFilter);
    if (brandFilter !== "all") params.set("brand_id", brandFilter);
    if (productFilter !== "all") params.set("product_id", productFilter);
    if (keyword.trim()) params.set("keyword", keyword.trim());

    const url = `/api/admin/product-orders?${params.toString()}`;

    const res = await fetch(url, {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!data?.success) {
      alert(data?.error || "제품 주문 목록을 불러오지 못했습니다.");
      return;
    }

    setOrders(data.orders || []);
    setSelectedIds([]);
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hallFilter, brandFilter, productFilter]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [tab, keyword, hallFilter, brandFilter, productFilter]);

  const brands = useMemo(() => {
    const map = new Map<string, string>();

    orders.forEach((o) => {
      if (o.brand_id && o.brand_name) {
        map.set(o.brand_id, o.brand_name);
      }
    });

    return Array.from(map.entries());
  }, [orders]);

  const products = useMemo(() => {
    const map = new Map<string, string>();

    orders.forEach((o) => {
      if (o.product_id && o.product_name) {
        map.set(o.product_id, o.product_name);
      }
    });

    return Array.from(map.entries());
  }, [orders]);

  const counts = useMemo(() => {
    return {
      total: orders.length,
      waiting: orders.filter((o) => tabOf(o) === "waiting").length,
      shipping: orders.filter((o) => tabOf(o) === "shipping").length,
      completed: orders.filter((o) => tabOf(o) === "completed").length,
      problem: orders.filter((o) => tabOf(o) === "problem").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return orders.filter((o) => {
      if (tabOf(o) !== tab) return false;

      if (!q) return true;

      const hay = [
        o.id,
        o.hall_id,
        o.brand_name,
        o.product_name,
        o.farmer_name,
        o.phone,
        o.address,
        o.postcode,
        o.base_address,
        o.detail_address,
        o.crop,
        o.farm_size,
        o.depositor_name,
        o.delivery_company,
        o.tracking_number,
        o.memo,
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [orders, keyword, tab]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const pageOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));

  const productSummary = useMemo(() => {
    const map: Record<string, number> = {};

    orders
      .filter((o) => tabOf(o) === "shipping")
      .forEach((o) => {
        const name = o.product_name || "상품명 없음";
        map[name] = (map[name] || 0) + n(o.quantity);
      });

    return Object.entries(map);
  }, [orders]);

  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function togglePage() {
    const ids = pageOrders.map((o) => o.id);
    const allChecked = ids.length > 0 && ids.every((id) => selectedIds.includes(id));

    if (allChecked) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  }

  async function batchUpdate(
    action: "payment_done" | "payment_waiting" | "ready_to_ship" | "shipped" | "done" | "cancel"
  ) {
    if (selectedIds.length === 0) {
      alert("처리할 주문을 먼저 선택하세요.");
      return;
    }

    const label =
      action === "payment_done"
        ? "입금완료"
        : action === "payment_waiting"
          ? "입금대기"
          : action === "ready_to_ship"
            ? "출고준비"
            : action === "shipped"
              ? "출고완료"
              : action === "done"
                ? "배송완료"
                : "취소";

    if (!confirm(`선택한 ${selectedIds.length}건을 '${label}' 처리할까요?`)) {
      return;
    }

    setWorking(true);

    const res = await fetch("/api/admin/product-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: selectedIds,
        action,
      }),
    });

    const data = await res.json().catch(() => null);
    setWorking(false);

    if (!data?.success) {
      alert(data?.error || "일괄 처리에 실패했습니다.");
      return;
    }

    await loadOrders();
  }

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("export", "csv");
    if (hallFilter !== "all") params.set("hall_id", hallFilter);
    if (brandFilter !== "all") params.set("brand_id", brandFilter);
    if (productFilter !== "all") params.set("product_id", productFilter);
    if (keyword.trim()) params.set("keyword", keyword.trim());

    return `/api/admin/product-orders?${params.toString()}`;
  }, [hallFilter, brandFilter, productFilter, keyword]);

  return (
    <main style={S.page}>
      <header style={S.header}>
        <div>
          <div style={S.kicker}>K-AGRI OMS</div>
          <h1 style={S.title}>전관 제품 주문 운영센터</h1>
          <p style={S.desc}>
            전 관 주문을 한 화면에서 입금확인 → 출고준비 → 송장관리 → 배송완료까지 처리합니다.
          </p>
        </div>

        <div style={S.stats}>
          <Stat label="전체" value={counts.total} color="#111827" />
          <Stat label="입금대기" value={counts.waiting} color="#f59e0b" />
          <Stat label="출고대기" value={counts.shipping} color="#16a34a" />
          <Stat label="문제주문" value={counts.problem} color="#dc2626" />
        </div>
      </header>

      <section style={S.tabs}>
        <TabButton active={tab === "waiting"} onClick={() => setTab("waiting")}>
          입금대기 {counts.waiting}건
        </TabButton>

        <TabButton active={tab === "shipping"} onClick={() => setTab("shipping")}>
          출고대기 {counts.shipping}건
        </TabButton>

        <TabButton active={tab === "completed"} onClick={() => setTab("completed")}>
          완료 {counts.completed}건
        </TabButton>

        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>
          문제주문 {counts.problem}건
        </TabButton>

        <button type="button" onClick={loadOrders} style={S.reloadBtn}>
          {loading ? "불러오는 중" : "새로고침"}
        </button>
      </section>

      <section style={S.toolbar}>
        <div style={S.filterGrid}>
          <div>
            <label style={S.label}>관</label>
            <select
              value={hallFilter}
              onChange={(e) => setHallFilter(e.target.value)}
              style={S.select}
            >
              {HALLS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={S.label}>브랜드</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              style={S.select}
            >
              <option value="all">전체 브랜드</option>
              {brands.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={S.label}>제품</label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              style={S.select}
            >
              <option value="all">전체 제품</option>
              {products.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="농민명 / 전화번호 / 주소 / 작물 / 제품 / 브랜드 / 송장번호 검색"
          style={S.search}
        />

        <div style={S.workInfo}>
          현재 화면: <b>{filteredOrders.length}건</b> / 선택:{" "}
          <b>{selectedIds.length}건</b>
        </div>
      </section>

      {selectedIds.length > 0 ? (
        <section style={S.fixedWorkBar}>
          <div style={S.fixedWorkText}>
            선택 주문 <b>{selectedIds.length}건</b>
          </div>

          <div style={S.workActions}>
            <button
              type="button"
              style={S.greenBtn}
              onClick={() => batchUpdate("payment_done")}
              disabled={working}
            >
              입금완료
            </button>

            <button
              type="button"
              style={S.blueBtn}
              onClick={() => batchUpdate("ready_to_ship")}
              disabled={working}
            >
              출고준비
            </button>

            <button
              type="button"
              style={S.purpleBtn}
              onClick={() => batchUpdate("shipped")}
              disabled={working}
            >
              출고완료
            </button>

            <button
              type="button"
              style={S.blackBtn}
              onClick={() => batchUpdate("done")}
              disabled={working}
            >
              배송완료
            </button>

            <button
              type="button"
              style={S.redBtn}
              onClick={() => batchUpdate("cancel")}
              disabled={working}
            >
              취소
            </button>
          </div>
        </section>
      ) : null}

      {tab === "waiting" && (
        <WorkPanel
          title="🟡 입금대기"
          desc="무통장 입금 확인 후 입금완료 처리하면 출고준비 단계로 넘어갑니다."
          right={
            <>
              <button
                type="button"
                style={S.greenBtn}
                onClick={() => batchUpdate("payment_done")}
                disabled={working}
              >
                선택 주문 입금완료
              </button>
              <a href={exportHref} style={S.excelBtn}>
                엑셀 다운로드
              </a>
            </>
          }
        />
      )}

      {tab === "shipping" && (
        <>
          <section style={S.summaryBox}>
            <div style={S.summaryTitle}>📦 출고 대상 상품 합계</div>
            <div style={S.productSummary}>
              {productSummary.length === 0 ? (
                <span style={S.muted}>출고대기 주문이 없습니다.</span>
              ) : (
                productSummary.map(([name, qty]) => (
                  <span key={name} style={S.productChip}>
                    {name} {qty}개
                  </span>
                ))
              )}
            </div>
          </section>

          <WorkPanel
            title="🟢 출고대기"
            desc="입금완료된 주문입니다. 업체별로 엑셀 다운로드 후 출고 지시를 내리고 송장을 입력합니다."
            right={
              <>
                <a href={exportHref} style={S.excelBtn}>
                  출고용 엑셀 다운로드
                </a>
                <button
                  type="button"
                  style={S.blueBtn}
                  onClick={() => batchUpdate("ready_to_ship")}
                  disabled={working}
                >
                  선택 주문 출고준비
                </button>
                <a href="/admin/tracking-upload" style={S.purpleLink}>
                  송장 업로드
                </a>
              </>
            }
          />
        </>
      )}

      {tab === "completed" && (
        <WorkPanel
          title="⚫ 완료"
          desc="송장 등록 또는 배송완료 처리된 주문입니다."
          right={
            <a href={exportHref} style={S.excelBtn}>
              완료 주문 엑셀
            </a>
          }
        />
      )}

      {tab === "problem" && (
        <WorkPanel
          title="🔴 문제주문"
          desc="연락처, 주소, 수량 누락 또는 취소 상태 주문입니다. 먼저 확인해야 합니다."
          right={
            <button
              type="button"
              style={S.orangeBtn}
              onClick={() => batchUpdate("payment_waiting")}
              disabled={working}
            >
              선택 주문 입금대기로 복구
            </button>
          }
        />
      )}

      <section style={S.tableCard}>
        <div style={S.tableTop}>
          <button type="button" onClick={togglePage} style={S.selectAllBtn}>
            현재 페이지 전체선택
          </button>

          <div style={S.pageText}>
            {page} / {pageCount} 페이지 · {PAGE_SIZE}건씩 보기
          </div>
        </div>

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <Th>선택</Th>
                <Th>상태</Th>
                <Th>관</Th>
                <Th>브랜드</Th>
                <Th>제품</Th>
                <Th>농민</Th>
                <Th>전화</Th>
                <Th>작물/평수</Th>
                <Th>수량</Th>
                <Th>추천</Th>
                <Th>주소</Th>
                <Th>송장</Th>
                <Th>접수일</Th>
              </tr>
            </thead>

            <tbody>
              {pageOrders.length === 0 ? (
                <tr>
                  <td colSpan={13} style={S.emptyTd}>
                    해당 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                pageOrders.map((o) => {
                  const stage = stageOf(o);
                  const checked = selectedIds.includes(o.id);

                  return (
                    <tr key={o.id} style={checked ? S.checkedRow : undefined}>
                      <td style={S.td}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(o.id)}
                          style={S.checkbox}
                        />
                      </td>

                      <td style={S.td}>
                        <span
                          style={{
                            ...S.badge,
                            color: stageColor(stage),
                            background: `${stageColor(stage)}18`,
                          }}
                        >
                          {stageText(stage)}
                        </span>
                      </td>

                      <td style={S.td}>{hallLabel(o.hall_id)}</td>
                      <td style={S.tdStrong}>{o.brand_name || "-"}</td>
                      <td style={S.tdStrong}>{o.product_name || "-"}</td>

                      <td style={o.farmer_name ? S.tdStrong : S.missingTd}>
                        {o.farmer_name || "정보누락"}
                      </td>

                      <td style={o.phone ? S.tdStrong : S.missingTd}>
                        {o.phone || "정보누락"}
                      </td>

                      <td style={S.td}>
                        {o.crop || "-"} / {o.farm_size ? `${o.farm_size}평` : "-"}
                      </td>

                      <td style={S.tdStrong}>
                        {n(o.quantity)}
                        {o.unit_label || "개"}
                      </td>

                      <td style={S.td}>
                        {n(o.recommended_quantity) > 0
                          ? `${n(o.recommended_quantity)}개`
                          : "-"}
                      </td>

                      <td style={fullAddress(o) !== "-" ? S.addressTd : S.missingTd}>
                        {fullAddress(o)}
                      </td>

                      <td style={S.td}>
                        {o.tracking_number
                          ? `${o.delivery_company || ""} ${o.tracking_number}`
                          : "-"}
                      </td>

                      <td style={S.td}>{shortDate(o.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={S.pagination}>
          <button
            type="button"
            style={S.pageBtn}
            onClick={() => setPage((v) => Math.max(1, v - 1))}
            disabled={page <= 1}
          >
            이전
          </button>

          <button
            type="button"
            style={S.pageBtn}
            onClick={() => setPage((v) => Math.min(pageCount, v + 1))}
            disabled={page >= pageCount}
          >
            다음
          </button>
        </div>
      </section>
    </main>
  );
}

function WorkPanel({
  title,
  desc,
  right,
}: {
  title: string;
  desc: string;
  right?: ReactNode;
}) {
  return (
    <section style={S.workPanel}>
      <div>
        <h2 style={S.workTitle}>{title}</h2>
        <p style={S.workDesc}>{desc}</p>
      </div>

      <div style={S.workActions}>{right}</div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...S.tabBtn,
        background: active ? "#111827" : "#ffffff",
        color: active ? "#ffffff" : "#111827",
      }}
    >
      {children}
    </button>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th style={S.th}>{children}</th>;
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statLabel, color }}>{label}</div>
      <div style={{ ...S.statValue, color }}>{value}</div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 20,
    color: "#111827",
  },
  header: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 22,
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "center",
    marginBottom: 14,
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
    marginTop: 8,
    fontSize: 15,
    fontWeight: 800,
    color: "#4b5563",
  },
  stats: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  stat: {
    minWidth: 112,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "12px 14px",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 950,
  },
  statValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: 950,
  },
  tabs: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  tabBtn: {
    minHeight: 44,
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "0 18px",
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer",
  },
  reloadBtn: {
    minHeight: 44,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    padding: "0 16px",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
    marginLeft: "auto",
  },
  toolbar: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 12,
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
    height: 48,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: 15,
    fontWeight: 850,
    background: "#ffffff",
  },
  search: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    padding: "0 16px",
    fontSize: 17,
    fontWeight: 800,
    boxSizing: "border-box",
  },
  workInfo: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: 850,
    color: "#374151",
  },
  fixedWorkBar: {
    background: "#111827",
    color: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  fixedWorkText: {
    fontSize: 18,
    fontWeight: 950,
  },
  summaryBox: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 950,
  },
  productSummary: {
    marginTop: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  productChip: {
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    padding: "9px 14px",
    fontSize: 17,
    fontWeight: 950,
  },
  muted: {
    color: "#6b7280",
    fontWeight: 800,
  },
  workPanel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  workTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 950,
  },
  workDesc: {
    marginTop: 6,
    color: "#6b7280",
    fontWeight: 800,
  },
  workActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  greenBtn: {
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    padding: "0 18px",
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer",
  },
  blueBtn: {
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "0 18px",
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer",
  },
  purpleBtn: {
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: "#7c3aed",
    color: "#ffffff",
    padding: "0 18px",
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer",
  },
  blackBtn: {
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "0 18px",
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer",
  },
  redBtn: {
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    padding: "0 18px",
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer",
  },
  orangeBtn: {
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: "#f59e0b",
    color: "#ffffff",
    padding: "0 18px",
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer",
  },
  excelBtn: {
    minHeight: 44,
    borderRadius: 14,
    background: "#047857",
    color: "#ffffff",
    padding: "0 18px",
    display: "grid",
    placeItems: "center",
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 950,
  },
  purpleLink: {
    minHeight: 44,
    borderRadius: 14,
    background: "#7c3aed",
    color: "#ffffff",
    padding: "0 18px",
    display: "grid",
    placeItems: "center",
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 950,
  },
  tableCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  tableTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  selectAllBtn: {
    minHeight: 42,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "0 14px",
    fontWeight: 950,
    cursor: "pointer",
  },
  pageText: {
    fontSize: 15,
    fontWeight: 900,
    color: "#4b5563",
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1680,
    background: "#ffffff",
  },
  th: {
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    padding: "13px 12px",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  td: {
    borderBottom: "1px solid #e5e7eb",
    padding: "18px 14px",
    fontSize: 16,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  tdStrong: {
    borderBottom: "1px solid #e5e7eb",
    padding: "18px 14px",
    fontSize: 16,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  missingTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "18px 14px",
    fontSize: 16,
    fontWeight: 950,
    color: "#dc2626",
    background: "#fff1f2",
    whiteSpace: "nowrap",
  },
  addressTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "13px 12px",
    fontSize: 15,
    fontWeight: 800,
    minWidth: 360,
  },
  checkbox: {
    width: 20,
    height: 20,
  },
  badge: {
    display: "inline-flex",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  checkedRow: {
    background: "#f0fdf4",
  },
  emptyTd: {
    padding: 30,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 900,
  },
  pagination: {
    marginTop: 14,
    display: "flex",
    justifyContent: "center",
    gap: 8,
  },
  pageBtn: {
    minHeight: 42,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "0 18px",
    fontWeight: 950,
    cursor: "pointer",
  },
};