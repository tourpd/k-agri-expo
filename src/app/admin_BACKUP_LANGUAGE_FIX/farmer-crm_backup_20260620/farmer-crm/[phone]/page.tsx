// src/app/admin/farmer-crm/[phone]/page.tsx
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { CSSProperties, ReactNode } from "react";
import FarmerNoteBox from "./FarmerNoteBox";
import FarmerProfileBox from "./FarmerProfileBox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PageProps = {
  params: Promise<{ phone: string }>;
};

type OrderRow = {
  id: string;
  farmer_name?: string | null;
  phone?: string | null;
  address?: string | null;
  base_address?: string | null;
  crop?: string | null;
  farm_size?: string | number | null;
  quantity?: string | number | null;
  recommended_quantity?: string | number | null;
  quantity_note?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  tracking_company?: string | null;
  delivery_company?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  memo?: string | null;
  vendor_memo?: string | null;
  created_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
};

type ProductRow = {
  id: string;
  product_name?: string | null;
  name?: string | null;
};

type SmsLogRow = {
  id: string;
  phone?: string | null;
  sms_type?: string | null;
  message?: string | null;
  send_status?: string | null;
  created_at?: string | null;
};

type OrderLogRow = {
  id: string;
  action_type?: string | null;
  order_status?: string | null;
  actor_name?: string | null;
  actor_type?: string | null;
  memo?: string | null;
  created_at?: string | null;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function phoneOnly(v: unknown) {
  return safe(v).replace(/[^0-9]/g, "");
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).replace("T", " ").slice(0, 16);
}

function num(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function pyeong(v: unknown) {
  const s = safe(v);
  if (!s) return "-";
  if (s.includes("평")) return s;
  return `${s}평`;
}

function statusOf(o: OrderRow) {
  return safe(o.order_status) || safe(o.payment_status) || "신청접수";
}

function productName(o: OrderRow, productMap: Map<string, string>) {
  return safe(o.product_name) || productMap.get(safe(o.product_id)) || "주문 상품";
}

function gradeOf(orderCount: number) {
  if (orderCount >= 10) return "VVIP";
  if (orderCount >= 5) return "VIP";
  if (orderCount >= 2) return "HOT";
  return "일반";
}

function getRepurchaseDate(lastDate?: string | null) {
  if (!lastDate) return "-";
  const d = new Date(lastDate);
  if (Number.isNaN(d.getTime())) return "-";
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function smsTypeLabel(v?: string | null) {
  const s = safe(v);
  if (s === "shipping_started") return "송장등록 문자";
  if (s === "delivery_completed") return "배송완료 문자";
  if (s === "tracking") return "송장등록 문자";
  if (s === "delivery_done") return "배송완료 문자";
  return s || "문자";
}

async function getData(phone: string) {
  const normalizedPhone = phoneOnly(decodeURIComponent(phone));

  const { data: ordersRaw, error } = await supabase
    .from("expo_brand_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3000);

  if (error) throw new Error(error.message);

  const orders = ((ordersRaw || []) as OrderRow[]).filter(
    (o) => phoneOnly(o.phone) === normalizedPhone
  );

  const productIds = Array.from(
    new Set(orders.map((o) => safe(o.product_id)).filter(Boolean))
  );

  const { data: products } =
    productIds.length > 0
      ? await supabase.from("expo_brand_products").select("*").in("id", productIds)
      : { data: [] };

  const productMap = new Map(
    ((products || []) as ProductRow[]).map((p) => [
      p.id,
      safe(p.product_name) || safe(p.name),
    ])
  );

  const orderIds = orders.map((o) => o.id).filter(Boolean);

  const { data: smsLogs } = await supabase
    .from("expo_sms_logs")
    .select("*")
    .eq("phone", normalizedPhone)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: orderLogs } =
    orderIds.length > 0
      ? await supabase
          .from("expo_order_logs")
          .select("*")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false })
          .limit(50)
      : { data: [] };

  return {
    phone: normalizedPhone,
    orders,
    productMap,
    smsLogs: (smsLogs || []) as SmsLogRow[],
    orderLogs: (orderLogs || []) as OrderLogRow[],
  };
}

export default async function FarmerCrmDetailPage({ params }: PageProps) {
  const { phone } = await params;

  let orders: OrderRow[] = [];
  let productMap = new Map<string, string>();
  let smsLogs: SmsLogRow[] = [];
  let orderLogs: OrderLogRow[] = [];
  let normalizedPhone = "";
  let errorMessage = "";

  try {
    const result = await getData(phone);
    orders = result.orders;
    productMap = result.productMap;
    smsLogs = result.smsLogs;
    orderLogs = result.orderLogs;
    normalizedPhone = result.phone;
  } catch (e: any) {
    errorMessage = e?.message || "농민 CRM 상세 데이터를 불러오지 못했습니다.";
  }

  const latest = orders[0];
  const farmerName = safe(latest?.farmer_name) || "-";
  const region = safe(latest?.address) || safe(latest?.base_address) || "-";
  const crop = safe(latest?.crop) || "-";
  const farmSize = pyeong(latest?.farm_size);
  const orderCount = orders.length;
  const totalQuantity = orders.reduce((sum, o) => sum + num(o.quantity), 0);
  const grade = gradeOf(orderCount);

  const latestProduct = latest ? productName(latest, productMap) : "-";
  const latestStatus = latest ? statusOf(latest) : "-";
  const latestDate = latest ? shortDate(latest.created_at) : "-";
  const repurchaseDate = getRepurchaseDate(latest?.created_at);
  const latestSmsDate = smsLogs[0]?.created_at ? shortDate(smsLogs[0].created_at) : "-";

  return (
    <main style={S.page}>
      <section style={S.header}>
        <div>
          <div style={S.kicker}>K-AGRI FARMER CRM</div>
          <h1 style={S.title}>{farmerName}</h1>
          <p style={S.desc}>농민 1명 기준 관리상태, 상담기록, 문자, 주문이력을 분리해서 확인합니다.</p>
        </div>

        <div style={S.headerLinks}>
          <Link href="/admin/farmer-crm" style={S.grayLink}>CRM 목록</Link>
          <Link href={`/admin/product-orders?keyword=${encodeURIComponent(normalizedPhone)}`} style={S.darkLink}>주문보기</Link>
          <a href={`tel:${normalizedPhone}`} style={S.greenLink}>전화하기</a>
        </div>
      </section>

      {errorMessage ? <section style={S.errorBox}>{errorMessage}</section> : null}

      <section style={S.summaryGrid}>
        <Card label="등급" value={grade} />
        <Card label="전화번호" value={normalizedPhone || "-"} />
        <Card label="지역" value={region} />
        <Card label="작물" value={crop} />
        <Card label="재배평수" value={farmSize} />
        <Card label="주문횟수" value={`${orderCount}회`} />
        <Card label="누적수량" value={`${totalQuantity}개`} />
        <Card label="최근상품" value={latestProduct} />
        <Card label="최근상태" value={latestStatus} />
        <Card label="최근주문일" value={latestDate} />
        <Card label="재구매 예상일" value={repurchaseDate} />
        <Card label="최근 문자발송" value={latestSmsDate} />
      </section>

      <Category title="1. 관리상태" open>
        <FarmerProfileBox
          phone={normalizedPhone}
          farmerName={farmerName}
          region={region}
          crop={crop}
          farmSize={farmSize}
        />
      </Category>

      <Category title="2. 상담기록" open>
        <FarmerNoteBox phone={normalizedPhone} farmerName={farmerName} />
      </Category>

      <Category title="3. 주문 처리 타임라인">
        {orderLogs.length === 0 ? (
          <div style={S.emptyBox}>처리 로그가 없습니다.</div>
        ) : (
          <div style={S.timeline}>
            {orderLogs.map((log) => (
              <div key={log.id} style={S.timelineItem}>
                <div style={S.dot} />
                <div style={S.timelineBody}>
                  <div style={S.timelineTop}>
                    <b>{safe(log.memo) || safe(log.action_type) || "처리 로그"}</b>
                    <span>{shortDate(log.created_at)}</span>
                  </div>
                  <p>{safe(log.actor_name) || safe(log.actor_type) || "관리자"} · {safe(log.order_status) || "-"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Category>

      <Category title={`4. 문자 발송 내역 (${smsLogs.length}건)`}>
        {smsLogs.length === 0 ? (
          <div style={S.emptyBox}>문자 발송 내역이 없습니다.</div>
        ) : (
          <div style={S.timeline}>
            {smsLogs.map((sms) => (
              <div key={sms.id} style={S.timelineItem}>
                <div style={S.smsDot} />
                <div style={S.timelineBody}>
                  <div style={S.timelineTop}>
                    <b>{smsTypeLabel(sms.sms_type)}</b>
                    <span>{shortDate(sms.created_at)}</span>
                  </div>
                  <p>{safe(sms.send_status) || "-"}</p>
                  <div style={S.smsMessage}>{safe(sms.message) || "-"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Category>

      <Category title={`5. 주문 히스토리 (${orders.length}건)`}>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>주문일</th>
                <th style={S.th}>상품</th>
                <th style={S.th}>상태</th>
                <th style={S.th}>수량</th>
                <th style={S.th}>권장수량</th>
                <th style={S.th}>추천근거</th>
                <th style={S.th}>송장</th>
                <th style={S.th}>출고일</th>
                <th style={S.th}>배송완료일</th>
                <th style={S.th}>메모</th>
                <th style={S.th}>관리</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={11} style={S.emptyTd}>주문 이력이 없습니다.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td style={S.td}>{shortDate(o.created_at)}</td>
                    <td style={S.tdStrong}>{productName(o, productMap)}</td>
                    <td style={S.tdStrong}>{statusOf(o)}</td>
                    <td style={S.tdStrong}>{num(o.quantity)}개</td>
                    <td style={S.td}>{safe(o.recommended_quantity) || "-"}</td>
                    <td style={S.memoTd}>{safe(o.quantity_note) || "-"}</td>
                    <td style={S.td}>
                      {safe(o.tracking_number) ? (
                        o.tracking_url ? (
                          <a href={o.tracking_url} target="_blank" rel="noreferrer" style={S.trackingLink}>
                            {safe(o.tracking_company) || safe(o.delivery_company)} {o.tracking_number}
                          </a>
                        ) : (
                          `${safe(o.tracking_company) || safe(o.delivery_company)} ${o.tracking_number}`
                        )
                      ) : "-"}
                    </td>
                    <td style={S.td}>{shortDate(o.shipped_at)}</td>
                    <td style={S.td}>{shortDate(o.delivered_at)}</td>
                    <td style={S.memoTd}>{safe(o.memo) || safe(o.vendor_memo) || "-"}</td>
                    <td style={S.td}>
                      <Link href={`/admin/product-orders?keyword=${encodeURIComponent(o.id)}`} style={S.orderBtn}>
                        주문보기
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Category>
    </main>
  );
}

function Category({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} style={S.category}>
      <summary style={S.categorySummary}>{title}</summary>
      <div style={S.categoryBody}>{children}</div>
    </details>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.card}>
      <div style={S.cardLabel}>{label}</div>
      <div style={S.cardValue}>{value}</div>
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
  grayLink: link("#6b7280"),
  darkLink: link("#111827"),
  greenLink: link("#047857"),
  errorBox: { background: "#fff1f2", color: "#dc2626", border: "1px solid #fecdd3", borderRadius: 16, padding: 14, marginBottom: 12, fontWeight: 900 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: 12 },
  card: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 16, minHeight: 76 },
  cardLabel: { fontSize: 12, fontWeight: 950, color: "#6b7280", marginBottom: 8 },
  cardValue: { fontSize: 18, fontWeight: 950, wordBreak: "break-word" },
  category: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 0, marginBottom: 12, overflow: "hidden" },
  categorySummary: { padding: "16px 18px", fontSize: 20, fontWeight: 950, cursor: "pointer", background: "#ffffff", borderBottom: "1px solid #e5e7eb" },
  categoryBody: { padding: 14 },
  timeline: { display: "grid", gap: 10 },
  timelineItem: { display: "grid", gridTemplateColumns: "18px 1fr", gap: 10, alignItems: "start" },
  dot: { width: 10, height: 10, borderRadius: 999, background: "#2563eb", marginTop: 18 },
  smsDot: { width: 10, height: 10, borderRadius: 999, background: "#047857", marginTop: 18 },
  timelineBody: { border: "1px solid #e5e7eb", borderRadius: 16, padding: 14, background: "#f9fafb" },
  timelineTop: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 15, fontWeight: 950 },
  smsMessage: { marginTop: 8, fontSize: 13, fontWeight: 800, color: "#374151", whiteSpace: "pre-wrap" },
  emptyBox: { padding: 20, textAlign: "center", color: "#6b7280", fontWeight: 900 },
  tableWrap: { overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 16 },
  table: { width: "100%", minWidth: 1500, borderCollapse: "collapse" },
  th: { background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "12px 10px", textAlign: "left", fontSize: 13, fontWeight: 950, whiteSpace: "nowrap" },
  td: { borderBottom: "1px solid #e5e7eb", padding: "13px 10px", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap" },
  tdStrong: { borderBottom: "1px solid #e5e7eb", padding: "13px 10px", fontSize: 14, fontWeight: 950, whiteSpace: "nowrap" },
  memoTd: { borderBottom: "1px solid #e5e7eb", padding: "13px 10px", fontSize: 14, fontWeight: 800, minWidth: 240, whiteSpace: "normal" },
  emptyTd: { padding: 30, textAlign: "center", color: "#6b7280", fontWeight: 900 },
  trackingLink: { color: "#6d28d9", fontWeight: 950, textDecoration: "underline" },
  orderBtn: { minHeight: 34, borderRadius: 10, background: "#111827", color: "#ffffff", padding: "0 10px", display: "inline-flex", alignItems: "center", textDecoration: "none", fontSize: 13, fontWeight: 950 },
};

function link(bg: string): CSSProperties {
  return { minHeight: 42, borderRadius: 12, background: bg, color: "#ffffff", padding: "0 14px", display: "inline-flex", alignItems: "center", textDecoration: "none", fontSize: 14, fontWeight: 950 };
}