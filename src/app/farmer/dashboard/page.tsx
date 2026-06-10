import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type FarmerRow = {
  farmer_id?: string | null;
  name?: string | null;
  phone?: string | null;
  region?: string | null;
  crop?: string | null;
  main_crop?: string | null;
  farm_name?: string | null;
  vip_grade?: string | null;
};

type FarmerBoothRow = {
  booth_id?: string | null;
  farmer_id?: string | null;
  booth_name?: string | null;
  farm_name?: string | null;
  status?: string | null;
  is_public?: boolean | null;
  created_at?: string | null;
};

type FarmerProductRow = {
  product_id?: string | null;
  farmer_id?: string | null;
  product_name?: string | null;
  price_krw?: number | null;
  stock_quantity?: number | null;
  status?: string | null;
};

type FarmerOrderRow = {
  order_id?: string | null;
  farmer_id?: string | null;
  buyer_name?: string | null;
  product_name?: string | null;
  total_amount_krw?: number | null;
  order_status?: string | null;
  created_at?: string | null;
};

function safe(v: unknown, fallback = "-") {
  const s = typeof v === "string" ? v.trim() : "";
  return s || fallback;
}

function formatKrw(v?: number | null) {
  if (typeof v !== "number") return "-";
  return `${v.toLocaleString("ko-KR")}원`;
}

export default async function FarmerDashboardPage() {
  const cookieStore = await cookies();

  const farmerId =
    cookieStore.get("expo_farmer_entry")?.value ||
    cookieStore.get("farmer_id")?.value;

  if (!farmerId) {
    redirect("/login/farmer");
  }

  const supabase = await createSupabaseServerClient();

  const [{ data: farmer }, { data: boothRows }, { data: productRows }, { data: orderRows }] =
    await Promise.all([
      supabase
        .from("farmers")
        .select("*")
        .eq("farmer_id", farmerId)
        .maybeSingle(),

      supabase
        .from("farmer_booths")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false })
        .limit(1),

      supabase
        .from("farmer_products")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("farmer_orders")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  if (!farmer) {
    redirect("/login/farmer");
  }

  const farmerRow = farmer as FarmerRow;
  const booth = ((boothRows || []) as FarmerBoothRow[])[0] || null;
  const products = (productRows || []) as FarmerProductRow[];
  const orders = (orderRows || []) as FarmerOrderRow[];

  const totalSales = orders.reduce(
    (sum, item) => sum + (typeof item.total_amount_krw === "number" ? item.total_amount_krw : 0),
    0,
  );

  return (
    <main style={S.page}>
      <section style={S.wrap}>
        <section style={S.hero}>
          <div>
            <div style={S.kicker}>K-Agri Expo 농민 운영센터</div>
            <h1 style={S.title}>
              {safe(farmerRow.name, "농민")}님, 농산물 판매를 시작하세요
            </h1>
            <p style={S.desc}>
              내 농장 부스, 농산물 등록, 주문관리, 정산관리를 한 화면에서 운영합니다.
            </p>
          </div>
        </section>

        <section style={S.summaryGrid}>
          <InfoCard title="농장명" value={safe(farmerRow.farm_name, "미등록")} />
          <InfoCard title="주작물" value={safe(farmerRow.main_crop || farmerRow.crop, "미등록")} />
          <InfoCard title="등록 상품" value={`${products.length}개`} />
          <InfoCard title="최근 매출" value={formatKrw(totalSales)} />
        </section>

        <section style={S.actionGrid}>
          <ActionCard
            title="내 농민 부스"
            desc="농장 소개, 대표 사진, 생산 철학을 등록합니다."
            href="/farmer/booth"
            button="부스 관리하기"
          />

          <ActionCard
            title="농산물 등록"
            desc="마늘, 양파, 사과, 복숭아 등 판매할 농산물을 등록합니다."
            href="/farmer/products"
            button="상품 등록하기"
          />

          <ActionCard
            title="주문 관리"
            desc="소비자 주문, 입금, 배송, 송장번호를 관리합니다."
            href="/farmer/orders"
            button="주문 확인하기"
          />

          <ActionCard
            title="정산 관리"
            desc="판매금액, 수수료, 정산 예정 금액을 확인합니다."
            href="/farmer/settlements"
            button="정산 보기"
          />
        </section>

        <section style={S.card}>
          <div style={S.sectionTop}>
            <div>
              <div style={S.sectionKicker}>FARMER BOOTH</div>
              <h2 style={S.sectionTitle}>내 농민 부스 상태</h2>
            </div>

            <Link href="/farmer/booth" style={S.smallBtn}>
              부스 편집
            </Link>
          </div>

          {booth ? (
            <div style={S.boothBox}>
              <div>
                <div style={S.boothName}>
                  {safe(booth.booth_name || booth.farm_name, "내 농민 부스")}
                </div>
                <div style={S.boothMeta}>
                  상태: {safe(booth.status, "준비중")} · 공개:{" "}
                  {booth.is_public ? "공개" : "비공개"}
                </div>
              </div>
            </div>
          ) : (
            <div style={S.emptyBox}>
              아직 농민 부스가 없습니다. 먼저 농장 소개 부스를 만들어야 소비자가 믿고
              주문할 수 있습니다.
              <div style={{ marginTop: 16 }}>
                <Link href="/farmer/booth" style={S.primaryBtn}>
                  농민 부스 만들기 →
                </Link>
              </div>
            </div>
          )}
        </section>

        <section style={S.card}>
          <div style={S.sectionTop}>
            <div>
              <div style={S.sectionKicker}>PRODUCTS</div>
              <h2 style={S.sectionTitle}>최근 등록 농산물</h2>
            </div>

            <Link href="/farmer/products" style={S.smallBtn}>
              전체 보기
            </Link>
          </div>

          {products.length > 0 ? (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>상품명</th>
                    <th style={S.th}>가격</th>
                    <th style={S.th}>재고</th>
                    <th style={S.th}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item, index) => (
                    <tr key={item.product_id || index}>
                      <td style={S.tdStrong}>{safe(item.product_name, "상품명 없음")}</td>
                      <td style={S.td}>{formatKrw(item.price_krw)}</td>
                      <td style={S.td}>
                        {typeof item.stock_quantity === "number"
                          ? `${item.stock_quantity.toLocaleString("ko-KR")}개`
                          : "-"}
                      </td>
                      <td style={S.td}>{safe(item.status, "준비중")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={S.emptyBox}>
              등록된 농산물이 없습니다. 첫 상품을 등록하면 소비자 판매 페이지에 노출할 수
              있습니다.
              <div style={{ marginTop: 16 }}>
                <Link href="/farmer/products" style={S.primaryBtn}>
                  농산물 등록하기 →
                </Link>
              </div>
            </div>
          )}
        </section>

        <section style={S.card}>
          <div style={S.sectionTop}>
            <div>
              <div style={S.sectionKicker}>ORDERS</div>
              <h2 style={S.sectionTitle}>최근 주문</h2>
            </div>

            <Link href="/farmer/orders" style={S.smallBtn}>
              주문 관리
            </Link>
          </div>

          {orders.length > 0 ? (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>주문자</th>
                    <th style={S.th}>상품</th>
                    <th style={S.th}>금액</th>
                    <th style={S.th}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((item, index) => (
                    <tr key={item.order_id || index}>
                      <td style={S.tdStrong}>{safe(item.buyer_name, "주문자")}</td>
                      <td style={S.td}>{safe(item.product_name, "상품명 없음")}</td>
                      <td style={S.td}>{formatKrw(item.total_amount_krw)}</td>
                      <td style={S.td}>{safe(item.order_status, "주문접수")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={S.emptyBox}>
              아직 주문이 없습니다. 농산물 등록 후 공개 판매를 시작하면 주문이 이곳에
              표시됩니다.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={S.infoCard}>
      <div style={S.infoTitle}>{title}</div>
      <div style={S.infoValue}>{value}</div>
    </div>
  );
}

function ActionCard({
  title,
  desc,
  href,
  button,
}: {
  title: string;
  desc: string;
  href: string;
  button: string;
}) {
  return (
    <div style={S.actionCard}>
      <h3 style={S.actionTitle}>{title}</h3>
      <p style={S.actionDesc}>{desc}</p>
      <Link href={href} style={S.primaryBtn}>
        {button} →
      </Link>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f6f8f3",
    padding: 24,
    color: "#111827",
  },
  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
    display: "grid",
    gap: 22,
  },
  hero: {
    borderRadius: 30,
    background: "#111827",
    color: "#fff",
    padding: 34,
  },
  kicker: {
    color: "#86efac",
    fontSize: 14,
    fontWeight: 950,
  },
  title: {
    margin: "12px 0 0",
    fontSize: 42,
    lineHeight: 1.15,
    fontWeight: 950,
  },
  desc: {
    marginTop: 16,
    fontSize: 20,
    lineHeight: 1.7,
    fontWeight: 800,
    color: "#e5e7eb",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
  infoCard: {
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 22,
    padding: 22,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#6b7280",
  },
  infoValue: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: 950,
    color: "#111827",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
  actionCard: {
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 22,
    padding: 22,
  },
  actionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 950,
    color: "#111827",
  },
  actionDesc: {
    minHeight: 78,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 1.7,
    fontWeight: 800,
    color: "#4b5563",
  },
  card: {
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 26,
    padding: 26,
  },
  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
  },
  sectionKicker: {
    fontSize: 13,
    fontWeight: 950,
    color: "#16a34a",
  },
  sectionTitle: {
    margin: "8px 0 0",
    fontSize: 30,
    fontWeight: 950,
    color: "#111827",
  },
  boothBox: {
    marginTop: 18,
    borderRadius: 20,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: 22,
  },
  boothName: {
    fontSize: 24,
    fontWeight: 950,
    color: "#111827",
  },
  boothMeta: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 800,
    color: "#4b5563",
  },
  emptyBox: {
    marginTop: 18,
    borderRadius: 20,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: 22,
    fontSize: 17,
    lineHeight: 1.8,
    fontWeight: 800,
    color: "#4b5563",
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    background: "#16a34a",
    color: "#fff",
    borderRadius: 14,
    padding: "14px 18px",
    fontSize: 16,
    fontWeight: 950,
  },
  smallBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 14,
    padding: "13px 16px",
    fontSize: 15,
    fontWeight: 950,
  },
  tableWrap: {
    marginTop: 18,
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: 760,
    borderCollapse: "collapse",
    fontSize: 15,
  },
  th: {
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    padding: "14px 12px",
    textAlign: "left",
    fontWeight: 950,
    color: "#374151",
  },
  td: {
    borderBottom: "1px solid #f1f5f9",
    padding: "14px 12px",
    fontWeight: 800,
    color: "#4b5563",
  },
  tdStrong: {
    borderBottom: "1px solid #f1f5f9",
    padding: "14px 12px",
    fontWeight: 950,
    color: "#111827",
  },
};