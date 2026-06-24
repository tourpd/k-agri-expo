// src/app/admin/product-orders/ProductOrdersClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type Order = {
  id: string;
  hall_id?: string | null;
  brand_id?: string | null;
  brand_name?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  event_id?: string | null;
  farmer_name?: string | null;
  phone?: string | null;
  address?: string | null;
  postcode?: string | null;
  base_address?: string | null;
  detail_address?: string | null;
  crop?: string | null;
  farm_size?: string | number | null;
  quantity?: number | string | null;
  unit_label?: string | null;
  recommended_quantity?: number | string | null;
  quantity_note?: string | null;
  depositor_name?: string | null;
  memo?: string | null;
  vendor_memo?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  delivery_company?: string | null;
  tracking_company?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
};

type OrderLog = {
  id?: string;
  order_id?: string | null;
  action_type?: string | null;
  actor_type?: string | null;
  actor_name?: string | null;
  order_status?: string | null;
  memo?: string | null;
  previous_value?: any;
  next_value?: any;
  created_at?: string | null;
};

type Tab = "waiting" | "shipping" | "shipped" | "completed" | "problem";
type Stage = "waiting" | "paid" | "ready" | "shipped" | "done" | "problem";

type ClientProps = {
  initialKeyword?: string;
};

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

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function n(v: unknown) {
  const num = Number(String(v ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function buyerName(o: Order) {
  return safe(o.farmer_name);
}

function buyerPhone(o: Order) {
  return safe(o.phone);
}

function buyerRegion(o: Order) {
  return safe(o.address) || safe(o.base_address);
}

function cropName(o: Order) {
  return safe(o.crop);
}

function farmArea(o: Order) {
  return pyeong(o.farm_size);
}

function orderMemo(o: Order) {
  return safe(o.memo);
}

function pyeong(v: unknown) {
  const s = safe(v);
  if (!s) return "";
  if (s.includes("평")) return s;
  return `${s}평`;
}

function quantityText(v: unknown, unit?: string | null) {
  const s = safe(v);
  if (!s || n(s) <= 0) return "";
  return `${s}${unit ? unit : "개"}`;
}

function deliveryCompany(o: Order) {
  return safe(o.tracking_company) || safe(o.delivery_company);
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).replace("T", " ").slice(0, 16);
}

function isProblem(o: Order) {
  return (
    !buyerName(o) ||
    !buyerPhone(o) ||
    n(o.quantity) <= 0 ||
    o.payment_status === "취소" ||
    o.order_status === "취소"
  );
}

function stageOf(o: Order): Stage {
  if (isProblem(o)) return "problem";
  if (o.order_status === "배송완료") return "done";
  if (o.order_status === "배송중" || safe(o.tracking_number)) return "shipped";
  if (o.order_status === "출고준비") return "ready";
  if (o.payment_status === "입금완료") return "paid";
  return "waiting";
}

function tabOf(o: Order): Tab {
  const stage = stageOf(o);
  if (stage === "problem") return "problem";
  if (stage === "waiting") return "waiting";
  if (stage === "paid" || stage === "ready") return "shipping";
  if (stage === "shipped") return "shipped";
  return "completed";
}

function stageText(stage: Stage) {
  if (stage === "waiting") return "신청접수";
  if (stage === "paid") return "입금확인";
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

function logTitle(log: OrderLog) {
  const a = safe(log.action_type);
  if (a === "tracking_uploaded") return "송장 등록";
  if (a === "delivery_completed") return "배송완료 처리";
  if (a === "payment_done") return "입금확인 처리";
  if (a === "ready_to_ship") return "출고준비 처리";
  if (a === "shipped") return "배송중 처리";
  if (a === "cancel") return "주문 취소";
  return safe(log.memo) || safe(log.order_status) || a || "운영 처리";
}

function logDetail(log: OrderLog) {
  const next = log.next_value || {};
  const bits = [
    safe(log.memo),
    safe(next.payment_status) ? `입금상태: ${safe(next.payment_status)}` : "",
    safe(next.order_status) ? `주문상태: ${safe(next.order_status)}` : "",
    safe(next.tracking_company) || safe(next.tracking_number)
      ? `송장: ${safe(next.tracking_company)} ${safe(next.tracking_number)}`
      : "",
  ].filter(Boolean);

  return bits.join(" / ") || "-";
}

export default function ProductOrdersClient({
  initialKeyword = "",
}: ClientProps) {
  const urlKeyword = safe(initialKeyword);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderLogs, setOrderLogs] = useState<OrderLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [keyword, setKeyword] = useState(urlKeyword);
  const [tab, setTab] = useState<Tab>("waiting");
  const [hallFilter, setHallFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  async function loadOrders() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (hallFilter !== "all") params.set("hall_id", hallFilter);
      if (brandFilter !== "all") params.set("brand_id", brandFilter);
      if (productFilter !== "all") params.set("product_id", productFilter);
      if (keyword.trim()) params.set("keyword", keyword.trim());

      const res = await fetch(`/api/admin/product-orders?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data?.success) {
        alert(data?.error || "주문 목록을 불러오지 못했습니다.");
        return;
      }

      const nextOrders: Order[] = data.orders || [];
      setOrders(nextOrders);
      setSelectedIds([]);

      if (selectedOrder?.id) {
        const fresh = nextOrders.find((o) => o.id === selectedOrder.id);
        if (fresh) setSelectedOrder(fresh);
      }

      if (keyword.trim()) {
        const found = nextOrders.find((o) => {
          const q = keyword.trim().toLowerCase();
          return [
            o.id,
            o.brand_name,
            o.product_name,
            o.farmer_name,
            o.phone,
            o.address,
            o.base_address,
            o.detail_address,
            o.crop,
            o.farm_size,
            o.memo,
            o.vendor_memo,
            o.tracking_number,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q);
        });

        if (found) setTab(tabOf(found));
      }
    } catch {
      alert("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  async function loadOrderLogs(orderId: string) {
    if (!orderId) return;

    try {
      setLogsLoading(true);

      const res = await fetch(
        `/api/admin/order-logs?order_id=${encodeURIComponent(orderId)}&limit=30`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!data?.success) {
        setOrderLogs([]);
        return;
      }

      setOrderLogs(data.logs || []);
    } catch {
      setOrderLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    if (urlKeyword) setKeyword(urlKeyword);
  }, [urlKeyword]);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hallFilter, brandFilter, productFilter, keyword]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [tab, keyword, hallFilter, brandFilter, productFilter]);

  useEffect(() => {
    if (selectedOrder?.id) {
      loadOrderLogs(selectedOrder.id);
    } else {
      setOrderLogs([]);
    }
  }, [selectedOrder?.id]);

  const brands = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => {
      if (o.brand_id && o.brand_name) map.set(o.brand_id, o.brand_name);
    });
    return Array.from(map.entries());
  }, [orders]);

  const products = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => {
      if (o.product_id && o.product_name) map.set(o.product_id, o.product_name);
    });
    return Array.from(map.entries());
  }, [orders]);

  const counts = useMemo(() => {
    return {
      total: orders.length,
      waiting: orders.filter((o) => tabOf(o) === "waiting").length,
      shipping: orders.filter((o) => tabOf(o) === "shipping").length,
      shipped: orders.filter((o) => tabOf(o) === "shipped").length,
      completed: orders.filter((o) => tabOf(o) === "completed").length,
      problem: orders.filter((o) => tabOf(o) === "problem").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return orders.filter((o) => {
      if (tabOf(o) !== tab) return false;
      if (!q) return true;

      return [
        o.id,
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
        o.memo,
        o.vendor_memo,
        o.delivery_company,
        o.tracking_company,
        o.tracking_number,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [orders, keyword, tab]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const pageOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function togglePage() {
    const ids = pageOrders.map((o) => o.id);
    const allChecked =
      ids.length > 0 && ids.every((id) => selectedIds.includes(id));

    if (allChecked) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  }

  async function copyOrderId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      alert(`주문ID가 복사되었습니다.\n${id}`);
    } catch {
      alert(`복사에 실패했습니다. 아래 주문ID를 직접 복사하세요.\n${id}`);
    }
  }

  async function batchUpdate(
    action:
      | "payment_done"
      | "payment_waiting"
      | "ready_to_ship"
      | "shipped"
      | "cancel"
  ) {
    if (selectedIds.length === 0) {
      alert("주문을 선택하세요.");
      return;
    }

    try {
      setWorking(true);

      const res = await fetch("/api/admin/product-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action }),
      });

      const data = await res.json();

      if (!data?.success) {
        alert(data?.error || "일괄 처리 실패");
        return;
      }

      await loadOrders();
    } catch {
      alert("네트워크 오류");
    } finally {
      setWorking(false);
    }
  }

  async function updateSingleOrderStatus(id: string, action: string) {
    if (!id) return;

    try {
      setWorking(true);

      const res = await fetch("/api/admin/product-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], action }),
      });

      const data = await res.json();

      if (!data?.success) {
        alert(data?.error || "상태변경 실패");
        return;
      }

      await loadOrders();
      await loadOrderLogs(id);

      alert("처리 완료");
    } catch {
      alert("네트워크 오류");
    } finally {
      setWorking(false);
    }
  }

  async function completeSingleOrder(id: string) {
    if (!id) return;
    if (!confirm("이 주문을 배송완료 처리할까요?")) return;

    try {
      setWorking(true);

      const res = await fetch("/api/admin/product-orders/complete-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: [id] }),
      });

      const data = await res.json().catch(() => null);

      if (!data?.success) {
        alert(data?.error || "배송완료 실패");
        return;
      }

      await loadOrders();
      await loadOrderLogs(id);
      setTab("completed");

      alert(`배송완료 성공 ${data.success_count}건 / 실패 ${data.fail_count}건`);
    } catch {
      alert("네트워크 오류");
    } finally {
      setWorking(false);
    }
  }

  async function completeDelivery() {
    if (selectedIds.length === 0) {
      alert("배송완료 처리할 주문을 선택하세요.");
      return;
    }

    const selected = orders.filter((o) => selectedIds.includes(o.id));
    const noTracking = selected.filter((o) => !safe(o.tracking_number));

    if (noTracking.length > 0) {
      alert(`송장번호 없는 주문 ${noTracking.length}건은 배송완료 처리할 수 없습니다.`);
      return;
    }

    if (!confirm(`선택한 ${selectedIds.length}건을 배송완료 처리할까요?`)) {
      return;
    }

    try {
      setWorking(true);

      const res = await fetch("/api/admin/product-orders/complete-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: selectedIds }),
      });

      const data = await res.json().catch(() => null);

      if (!data?.success) {
        alert(data?.error || "배송완료 처리 실패");
        return;
      }

      alert(`배송완료 성공 ${data.success_count}건 / 실패 ${data.fail_count}건`);

      await loadOrders();
      setTab("completed");
    } catch {
      alert("네트워크 오류");
    } finally {
      setWorking(false);
    }
  }

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();

    params.set("export", "shipping-template");

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
          <h1 style={S.title}>제품 주문 운영센터</h1>
          <p style={S.desc}>
            고객 주문 → 상담/입금확인 → 출고준비 → 배송중 → 배송완료
          </p>
        </div>

        <div style={S.stats}>
          <Stat label="전체" value={counts.total} color="#111827" />
          <Stat label="신청접수" value={counts.waiting} color="#f59e0b" />
          <Stat label="출고대기" value={counts.shipping} color="#16a34a" />
          <Stat label="배송중" value={counts.shipped} color="#7c3aed" />
          <Stat label="문제" value={counts.problem} color="#dc2626" />
        </div>
      </header>

      <section style={S.tabs}>
        <TabButton active={tab === "waiting"} onClick={() => setTab("waiting")}>
          신청접수 {counts.waiting}
        </TabButton>

        <TabButton active={tab === "shipping"} onClick={() => setTab("shipping")}>
          출고대기 {counts.shipping}
        </TabButton>

        <TabButton active={tab === "shipped"} onClick={() => setTab("shipped")}>
          배송중 {counts.shipped}
        </TabButton>

        <TabButton active={tab === "completed"} onClick={() => setTab("completed")}>
          배송완료 {counts.completed}
        </TabButton>

        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>
          문제 {counts.problem}
        </TabButton>

        <button type="button" onClick={loadOrders} style={S.reloadBtn}>
          {loading ? "불러오는중" : "새로고침"}
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
          placeholder="고객명 / 전화번호 / 주소 / 작물 / 제품명 / 송장번호 / 주문ID 검색"
          style={S.search}
        />

        <div style={S.workInfo}>
          현재 {filteredOrders.length}건 / 선택 {selectedIds.length}건
        </div>
      </section>

      {selectedIds.length > 0 ? (
        <section style={S.fixedWorkBar}>
          <div style={S.fixedWorkText}>
            선택 주문 <b>{selectedIds.length}</b>건
          </div>

          <div style={S.workActions}>
            <button
              type="button"
              style={S.greenBtn}
              onClick={() => batchUpdate("payment_done")}
              disabled={working}
            >
              입금확인
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
              배송중
            </button>

            <button
              type="button"
              style={S.blackBtn}
              onClick={completeDelivery}
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

      <section style={S.quickPanel}>
        <div>
          {tab === "waiting" &&
            "신청 접수된 주문입니다. 상담 또는 입금확인 후 다음 단계로 넘기세요."}
          {tab === "shipping" &&
            "입금확인 또는 출고준비된 주문입니다. 출고용 엑셀을 내려받을 수 있습니다."}
          {tab === "shipped" &&
            "송장 등록된 주문입니다. 배송완료 처리를 진행하세요."}
          {tab === "completed" && "배송완료 주문입니다."}
          {tab === "problem" && "고객명, 전화번호, 주문수량 누락 또는 취소 주문입니다."}
        </div>

        <div style={S.workActions}>
          <a href={exportHref} style={S.excelLink}>
            엑셀 다운로드
          </a>
          <a href="/admin/tracking-upload" style={S.purpleLink}>
            송장 업로드
          </a>
          <a href="/admin/order-logs" style={S.darkLink}>
            운영 로그
          </a>
        </div>
      </section>

      <section style={S.tableCard}>
        <div style={S.tableTop}>
          <button type="button" onClick={togglePage} style={S.selectAllBtn}>
            현재 페이지 전체선택
          </button>
          <div style={S.pageText}>
            {page} / {pageCount} 페이지
          </div>
        </div>

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <Th>선택</Th>
                <Th>상태</Th>
                <Th>주문ID</Th>
                <Th>브랜드</Th>
                <Th>제품</Th>
                <Th>고객명</Th>
                <Th>전화번호</Th>
                <Th>주소/지역</Th>
                <Th>작물</Th>
                <Th>재배평수</Th>
                <Th>추천근거</Th>
                <Th>권장수량</Th>
                <Th>주문수량</Th>
                <Th>메모</Th>
                <Th>송장</Th>
                <Th>접수일</Th>
              </tr>
            </thead>

            <tbody>
              {pageOrders.length === 0 ? (
                <tr>
                  <td colSpan={16} style={S.emptyTd}>
                    주문이 없습니다.
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

                      <td style={S.td}>
                        <div style={S.idActions}>
                          <button
                            type="button"
                            style={S.viewMiniBtn}
                            onClick={() => setSelectedOrder(o)}
                          >
                            주문보기
                          </button>
                          <button
                            type="button"
                            style={S.copyMiniBtn}
                            onClick={() => copyOrderId(o.id)}
                          >
                            ID복사
                          </button>
                        </div>
                      </td>

                      <td style={S.tdStrong}>{o.brand_name || "-"}</td>
                      <td style={S.productTd}>{o.product_name || "-"}</td>
                      <td style={buyerName(o) ? S.tdStrong : S.missingTd}>
                        {buyerName(o) || "누락"}
                      </td>
                      <td style={buyerPhone(o) ? S.tdStrong : S.missingTd}>
                        {buyerPhone(o) || "누락"}
                      </td>
                      <td style={buyerRegion(o) ? S.addressTd : S.plainTd}>
                        {buyerRegion(o) || "-"}
                      </td>
                      <td style={cropName(o) ? S.tdStrong : S.plainTd}>
                        {cropName(o) || "-"}
                      </td>
                      <td style={S.plainTd}>{farmArea(o) || "-"}</td>
                      <td style={S.plainTd}>{safe(o.quantity_note) || "-"}</td>
                      <td style={S.plainTd}>
                        {quantityText(o.recommended_quantity, o.unit_label) || "-"}
                      </td>
                      <td style={n(o.quantity) > 0 ? S.tdStrong : S.missingTd}>
                        {quantityText(o.quantity, o.unit_label) || "누락"}
                      </td>
                      <td style={S.memoTd}>{orderMemo(o) || "-"}</td>
                      <td style={S.td}>
                        {o.tracking_number ? (
                          o.tracking_url ? (
                            <a
                              href={o.tracking_url}
                              target="_blank"
                              rel="noreferrer"
                              style={S.trackingLink}
                            >
                              {deliveryCompany(o)} {o.tracking_number}
                            </a>
                          ) : (
                            `${deliveryCompany(o)} ${o.tracking_number}`
                          )
                        ) : (
                          "-"
                        )}
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

      {selectedOrder ? (
        <section style={S.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div>
                <div style={S.kicker}>ORDER DETAIL</div>
                <h2 style={S.modalTitle}>주문 상세정보</h2>
              </div>

              <button
                type="button"
                style={S.closeBtn}
                onClick={() => setSelectedOrder(null)}
              >
                닫기
              </button>
            </div>

            <div style={S.modalStatusBar}>
              <button
                type="button"
                style={S.greenBtn}
                disabled={working}
                onClick={() => updateSingleOrderStatus(selectedOrder.id, "payment_done")}
              >
                입금확인
              </button>
              <button
                type="button"
                style={S.blueBtn}
                disabled={working}
                onClick={() => updateSingleOrderStatus(selectedOrder.id, "ready_to_ship")}
              >
                출고준비
              </button>
              <button
                type="button"
                style={S.purpleBtn}
                disabled={working}
                onClick={() => updateSingleOrderStatus(selectedOrder.id, "shipped")}
              >
                배송중
              </button>
              <button
                type="button"
                style={S.blackBtn}
                disabled={working}
                onClick={() => completeSingleOrder(selectedOrder.id)}
              >
                배송완료
              </button>
            </div>

            <div style={S.detailGrid}>
              <Detail label="주문ID" value={selectedOrder.id} />
              <Detail label="상태" value={stageText(stageOf(selectedOrder))} />
              <Detail label="브랜드" value={selectedOrder.brand_name} />
              <Detail label="제품" value={selectedOrder.product_name} />
              <Detail label="고객명" value={selectedOrder.farmer_name} />
              <Detail label="전화번호" value={selectedOrder.phone} />
              <Detail label="주소" value={buyerRegion(selectedOrder)} />
              <Detail label="우편번호" value={selectedOrder.postcode} />
              <Detail label="작물" value={selectedOrder.crop} />
              <Detail label="재배평수" value={farmArea(selectedOrder)} />
              <Detail
                label="권장수량"
                value={quantityText(selectedOrder.recommended_quantity, selectedOrder.unit_label)}
              />
              <Detail
                label="주문수량"
                value={quantityText(selectedOrder.quantity, selectedOrder.unit_label)}
              />
              <Detail label="입금상태" value={selectedOrder.payment_status} />
              <Detail label="주문상태" value={selectedOrder.order_status} />
              <Detail label="택배사" value={deliveryCompany(selectedOrder)} />
              <Detail label="송장번호" value={selectedOrder.tracking_number} />
              <Detail label="접수일" value={shortDate(selectedOrder.created_at)} />
              <Detail label="출고일" value={shortDate(selectedOrder.shipped_at)} />
              <Detail label="배송완료일" value={shortDate(selectedOrder.delivered_at)} />
              <Detail label="입금자명" value={selectedOrder.depositor_name} />
            </div>

            <div style={S.detailMemoBox}>
              <b>추천근거</b>
              <p>{safe(selectedOrder.quantity_note) || "-"}</p>
            </div>

            <div style={S.detailMemoBox}>
              <b>주문 메모</b>
              <p>{safe(selectedOrder.memo) || "-"}</p>
            </div>

            <div style={S.detailMemoBox}>
              <b>업체/운영 메모</b>
              <p>{safe(selectedOrder.vendor_memo) || "-"}</p>
            </div>

            <section style={S.logBox}>
              <div style={S.logHeader}>
                <b>주문 처리 타임라인</b>
                <button
                  type="button"
                  style={S.refreshLogBtn}
                  onClick={() => loadOrderLogs(selectedOrder.id)}
                >
                  새로고침
                </button>
              </div>

              {logsLoading ? (
                <div style={S.logEmpty}>로그 불러오는 중...</div>
              ) : orderLogs.length === 0 ? (
                <div style={S.logEmpty}>아직 처리 로그가 없습니다.</div>
              ) : (
                <div style={S.logList}>
                  {orderLogs.map((log, index) => (
                    <div key={`${log.id || log.created_at || index}`} style={S.logItem}>
                      <div style={S.logDot} />
                      <div style={S.logBody}>
                        <div style={S.logTop}>
                          <b>{logTitle(log)}</b>
                          <span>{shortDate(log.created_at)}</span>
                        </div>
                        <div style={S.logMeta}>
                          {safe(log.actor_name) || safe(log.actor_type) || "관리자"}
                          {safe(log.order_status) ? ` · ${safe(log.order_status)}` : ""}
                        </div>
                        <div style={S.logText}>{logDetail(log)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div style={S.modalActions}>
              <button
                type="button"
                style={S.blackBtn}
                onClick={() => copyOrderId(selectedOrder.id)}
              >
                주문ID 복사
              </button>

              {selectedOrder.tracking_url ? (
                <a
                  href={selectedOrder.tracking_url}
                  target="_blank"
                  rel="noreferrer"
                  style={S.purpleLink}
                >
                  배송조회
                </a>
              ) : null}

              <button
                type="button"
                style={S.closeOutlineBtn}
                onClick={() => setSelectedOrder(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
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

function Detail({ label, value }: { label: string; value?: unknown }) {
  return (
    <div style={S.detailItem}>
      <div style={S.detailLabel}>{label}</div>
      <div style={S.detailValue}>{safe(value) || "-"}</div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 14,
    color: "#111827",
    maxWidth: "100vw",
    overflowX: "hidden",
  },
  header: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#047857",
  },
  title: {
    margin: "5px 0 0",
    fontSize: 28,
    fontWeight: 950,
  },
  desc: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 800,
    color: "#4b5563",
  },
  stats: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  stat: {
    minWidth: 82,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "10px 12px",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 950,
  },
  statValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: 950,
  },
  tabs: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 10,
    marginBottom: 10,
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    alignItems: "center",
  },
  tabBtn: {
    minHeight: 40,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  },
  reloadBtn: {
    minHeight: 40,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
    marginLeft: "auto",
  },
  toolbar: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    display: "block",
    marginBottom: 5,
    fontSize: 12,
    fontWeight: 950,
    color: "#374151",
  },
  select: {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 14,
    fontWeight: 850,
    background: "#ffffff",
  },
  search: {
    width: "100%",
    height: 46,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: 15,
    fontWeight: 800,
    boxSizing: "border-box",
  },
  workInfo: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 850,
    color: "#374151",
  },
  fixedWorkBar: {
    position: "sticky",
    top: 8,
    zIndex: 20,
    background: "#111827",
    color: "#ffffff",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  fixedWorkText: {
    fontSize: 16,
    fontWeight: 950,
  },
  quickPanel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    fontSize: 14,
    fontWeight: 850,
  },
  workActions: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  greenBtn: button("#16a34a"),
  blueBtn: button("#2563eb"),
  purpleBtn: button("#7c3aed"),
  blackBtn: button("#111827"),
  redBtn: button("#dc2626"),
  excelLink: linkButton("#047857"),
  purpleLink: linkButton("#7c3aed"),
  darkLink: linkButton("#111827"),
  tableCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 12,
  },
  tableTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  selectAllBtn: {
    minHeight: 38,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "0 12px",
    fontWeight: 950,
    cursor: "pointer",
  },
  pageText: {
    fontSize: 14,
    fontWeight: 900,
    color: "#4b5563",
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    maxWidth: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1740,
    background: "#ffffff",
  },
  th: {
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    padding: "11px 10px",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  td: {
    borderBottom: "1px solid #e5e7eb",
    padding: "13px 10px",
    fontSize: 14,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  tdStrong: {
    borderBottom: "1px solid #e5e7eb",
    padding: "13px 10px",
    fontSize: 14,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  plainTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "13px 10px",
    fontSize: 14,
    fontWeight: 950,
    whiteSpace: "nowrap",
    color: "#111827",
    background: "#ffffff",
  },
  productTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "13px 10px",
    fontSize: 14,
    fontWeight: 950,
    whiteSpace: "nowrap",
    minWidth: 180,
  },
  memoTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "13px 10px",
    fontSize: 14,
    fontWeight: 800,
    minWidth: 180,
    maxWidth: 280,
    whiteSpace: "normal",
  },
  addressTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "13px 10px",
    fontSize: 14,
    fontWeight: 800,
    minWidth: 220,
    maxWidth: 360,
    whiteSpace: "normal",
  },
  missingTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "13px 10px",
    fontSize: 14,
    fontWeight: 950,
    color: "#dc2626",
    background: "#fff1f2",
    whiteSpace: "nowrap",
  },
  checkbox: {
    width: 18,
    height: 18,
  },
  badge: {
    display: "inline-flex",
    borderRadius: 999,
    padding: "5px 9px",
    fontSize: 12,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  checkedRow: {
    background: "#f0fdf4",
  },
  emptyTd: {
    padding: 26,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 900,
  },
  pagination: {
    marginTop: 12,
    display: "flex",
    justifyContent: "center",
    gap: 8,
  },
  pageBtn: {
    minHeight: 38,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "0 16px",
    fontWeight: 950,
    cursor: "pointer",
  },
  idActions: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  viewMiniBtn: {
    minHeight: 30,
    borderRadius: 9,
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "0 9px",
    fontSize: 12,
    fontWeight: 950,
    cursor: "pointer",
  },
  copyMiniBtn: {
    minHeight: 30,
    borderRadius: 9,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "0 9px",
    fontSize: 12,
    fontWeight: 950,
    cursor: "pointer",
  },
  trackingLink: {
    color: "#6d28d9",
    fontWeight: 950,
    textDecoration: "underline",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  },
  modalBox: {
    width: "min(900px, 96vw)",
    maxHeight: "88vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  modalTitle: {
    margin: "4px 0 0",
    fontSize: 26,
    fontWeight: 950,
  },
  closeBtn: {
    minHeight: 38,
    borderRadius: 12,
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  },
  modalStatusBar: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    padding: 12,
    borderRadius: 16,
    background: "#f3f4f6",
    marginBottom: 12,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 8,
  },
  detailItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#f9fafb",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 950,
    color: "#6b7280",
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: 950,
    color: "#111827",
    wordBreak: "break-all",
  },
  detailMemoBox: {
    marginTop: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    background: "#ffffff",
    fontSize: 14,
    fontWeight: 850,
    whiteSpace: "pre-wrap",
  },
  logBox: {
    marginTop: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#f9fafb",
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: 950,
  },
  refreshLogBtn: {
    minHeight: 32,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "0 10px",
    fontSize: 12,
    fontWeight: 950,
    cursor: "pointer",
  },
  logEmpty: {
    padding: 14,
    borderRadius: 12,
    background: "#ffffff",
    color: "#6b7280",
    fontSize: 14,
    fontWeight: 850,
  },
  logList: {
    display: "grid",
    gap: 8,
  },
  logItem: {
    display: "grid",
    gridTemplateColumns: "14px 1fr",
    gap: 10,
    alignItems: "start",
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "#2563eb",
    marginTop: 7,
  },
  logBody: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
  },
  logTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
    fontSize: 14,
    fontWeight: 950,
  },
  logMeta: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: 850,
    color: "#6b7280",
  },
  logText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 850,
    color: "#374151",
    whiteSpace: "pre-wrap",
  },
  modalActions: {
    marginTop: 14,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  closeOutlineBtn: {
    minHeight: 40,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  },
};

function button(bg: string): CSSProperties {
  return {
    minHeight: 40,
    borderRadius: 12,
    border: "none",
    background: bg,
    color: "#ffffff",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  };
}

function linkButton(bg: string): CSSProperties {
  return {
    minHeight: 40,
    borderRadius: 12,
    background: bg,
    color: "#ffffff",
    padding: "0 14px",
    display: "grid",
    placeItems: "center",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 950,
  };
}