"use client";

import { useState } from "react";

export const dynamic = "force-dynamic";

type TrackingOrder = {
  order_code: string;
  product_name: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  quantity: number | null;
  unit_label: string | null;
  total_amount: number | null;
  payment_status: string | null;
  order_status: string | null;
  dof_export_status: string | null;
  tracking_company: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  created_at: string | null;
};

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

function won(v?: number | null) {
  return `${Number(v || 0).toLocaleString()}원`;
}

function getStatus(order: TrackingOrder) {
  if (order.tracking_number || order.order_status === "shipped") {
    return {
      title: "배송중",
      desc: "송장번호가 등록되었습니다. 택배사 배송조회가 가능합니다.",
      color: "#2563eb",
    };
  }

  if (
    order.order_status === "waiting_tracking" ||
    order.dof_export_status === "exported" ||
    order.order_status === "exported"
  ) {
    return {
      title: "출고 준비중",
      desc: "도프에 주문이 전달되었습니다. 송장번호 등록을 기다리고 있습니다.",
      color: "#7c3aed",
    };
  }

  if (order.payment_status === "paid" || order.order_status === "paid") {
    return {
      title: "입금확인 완료",
      desc: "입금 확인이 완료되었습니다. 도프 출고 전달 대기 상태입니다.",
      color: "#16a34a",
    };
  }

  return {
    title: "입금 확인 대기",
    desc: "아직 입금 확인 전입니다. 입금 확인 후 출고가 진행됩니다.",
    color: "#f59e0b",
  };
}

function getTrackingUrl(company?: string | null, number?: string | null) {
  const n = String(number || "").trim();
  if (!n) return "";

  const c = String(company || "").toLowerCase();

  if (c.includes("cj") || c.includes("대한통운")) {
    return `https://trace.cjlogistics.com/next/tracking.html?wblNo=${encodeURIComponent(n)}`;
  }

  if (c.includes("롯데")) {
    return `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${encodeURIComponent(n)}`;
  }

  if (c.includes("한진")) {
    return `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillSch.do?mCode=MN038`;
  }

  return "";
}

export default function PhotoDoctorTrackingPage() {
  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    setOrder(null);

    if (!orderCode.trim()) {
      alert("주문번호를 입력해 주세요.");
      return;
    }

    if (phone.replace(/\D/g, "").length < 10) {
      alert("연락처를 정확히 입력해 주세요.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/photodoctor/tracking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_code: orderCode.trim(),
        buyer_phone: phone,
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!data?.success) {
      alert(data?.error || "배송조회에 실패했습니다.");
      return;
    }

    setOrder(data.order);
  }

  const status = order ? getStatus(order) : null;
  const trackingUrl = order
    ? getTrackingUrl(order.tracking_company, order.tracking_number)
    : "";

  return (
    <main style={S.page}>
      <section style={S.header}>
        <div style={S.logo}>🌱 포토닥터 주문 진행상태 확인</div>
        <h1 style={S.title}>주문번호로 진행상태를 확인하세요</h1>
        <p style={S.desc}>
           입금 직후 바로 배송조회가 되는 것은 아닙니다. 입금확인 전에는
           ‘입금확인 대기’로 표시되고, 도프 출고 후 송장번호가 등록되면
           배송조회가 가능합니다.
         </p>
      </section>

      <section style={S.card}>
        <div style={S.formGrid}>
          <div>
            <label style={S.label}>주문번호</label>
            <input
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="예: PDO-20260510-DVVSG"
              style={S.input}
            />
          </div>

          <div>
            <label style={S.label}>연락처</label>
            <input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="예: 010-1234-5678"
              inputMode="tel"
              style={S.input}
            />
          </div>
        </div>

        <button type="button" onClick={search} disabled={loading} style={S.searchBtn}>
          {loading ? "조회 중..." : "주문상태 확인하기"}
        </button>
      </section>

      {order && status && (
        <section style={S.resultCard}>
          <div
            style={{
              ...S.statusBox,
              borderColor: status.color,
              background: `${status.color}12`,
            }}
          >
            <div style={{ ...S.statusTitle, color: status.color }}>
              {status.title}
            </div>
            <div style={S.statusDesc}>{status.desc}</div>
          </div>

          <div style={S.infoGrid}>
            <Info label="주문번호" value={order.order_code} />
            <Info label="주문자" value={order.buyer_name || "-"} />
            <Info label="상품" value={order.product_name || "-"} />
            <Info
              label="수량"
              value={`${order.quantity || 0}${order.unit_label || "개"}`}
            />
            <Info label="결제금액" value={won(order.total_amount)} />
            <Info label="주문일" value={order.created_at || "-"} />
          </div>

          <div style={S.trackingBox}>
            <div style={S.trackingTitle}>🚚 송장 정보</div>

            {order.tracking_number ? (
              <>
                <div style={S.trackingText}>
                  택배사: <b>{order.tracking_company || "-"}</b>
                </div>
                <div style={S.trackingText}>
                  송장번호: <b>{order.tracking_number}</b>
                </div>

                {trackingUrl ? (
                  <a href={trackingUrl} target="_blank" style={S.trackingBtn}>
                    택배사 배송조회 열기
                  </a>
                ) : (
                  <div style={S.notice}>
                    택배사 홈페이지에서 송장번호로 조회해 주세요.
                  </div>
                )}
              </>
            ) : (
              <div style={S.notice}>
                아직 송장번호가 등록되지 않았습니다. 출고가 진행되면 이곳에 표시됩니다.
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.info}>
      <div style={S.infoLabel}>{label}</div>
      <div style={S.infoValue}>{value}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "28px 16px",
    color: "#111827",
  },
  header: {
    maxWidth: 760,
    margin: "0 auto",
    textAlign: "center",
  },
  logo: {
    color: "#166534",
    fontSize: 18,
    fontWeight: 950,
  },
  title: {
    margin: "10px 0 0",
    fontSize: "clamp(30px, 5vw, 48px)",
    fontWeight: 950,
    letterSpacing: "-0.05em",
  },
  desc: {
    marginTop: 12,
    color: "#4b5563",
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.6,
  },
  card: {
    maxWidth: 760,
    margin: "28px auto 0",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 28,
    padding: 24,
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  },
  formGrid: {
    display: "grid",
    gap: 16,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 17,
    fontWeight: 950,
  },
  input: {
    width: "100%",
    height: 64,
    border: "2px solid #d1d5db",
    borderRadius: 18,
    padding: "0 16px",
    fontSize: 22,
    fontWeight: 900,
    boxSizing: "border-box",
  },
  searchBtn: {
    marginTop: 18,
    width: "100%",
    minHeight: 68,
    border: "none",
    borderRadius: 20,
    background: "#16a34a",
    color: "#ffffff",
    fontSize: 24,
    fontWeight: 950,
    cursor: "pointer",
  },
  resultCard: {
    maxWidth: 760,
    margin: "22px auto 0",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 28,
    padding: 24,
  },
  statusBox: {
    border: "3px solid",
    borderRadius: 24,
    padding: 22,
  },
  statusTitle: {
    fontSize: 32,
    fontWeight: 950,
  },
  statusDesc: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.7,
  },
  infoGrid: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 12,
  },
  info: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
  },
  infoLabel: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: 900,
  },
  infoValue: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 950,
  },
  trackingBox: {
    marginTop: 20,
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 20,
    background: "#f9fafb",
  },
  trackingTitle: {
    fontSize: 24,
    fontWeight: 950,
    marginBottom: 12,
  },
  trackingText: {
    fontSize: 20,
    fontWeight: 850,
    lineHeight: 1.8,
  },
  trackingBtn: {
    marginTop: 16,
    width: "100%",
    minHeight: 58,
    borderRadius: 18,
    background: "#2563eb",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    textDecoration: "none",
    fontSize: 20,
    fontWeight: 950,
  },
  notice: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 16,
    padding: 16,
    color: "#9a3412",
    fontSize: 18,
    fontWeight: 850,
    lineHeight: 1.6,
  },
};
