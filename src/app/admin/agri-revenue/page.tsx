"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  product_name?: string | null;
  seller_name?: string | null;
  seller_type?: string | null;
  buyer_company_name?: string | null;
  gross_amount?: number | null;
  platform_revenue?: number | null;
  seller_settlement_amount?: number | null;
  settlement_status?: string | null;
  created_at?: string | null;
};

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function won(v: unknown) {
  return `${n(v).toLocaleString()}원`;
}

function statusLabel(v?: string | null) {
  if (v === "waiting") return "정산대기";
  if (v === "confirmed") return "정산확정";
  if (v === "paid") return "정산완료";
  if (v === "hold") return "보류";
  return v || "-";
}

function rankBy(items: Row[], key: keyof Row, amountKey: keyof Row = "gross_amount") {
  const map = new Map<string, number>();

  items.forEach((x) => {
    const name = String(x[key] || "미분류");
    map.set(name, (map.get(name) || 0) + n(x[amountKey]));
  });

  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export default function AgriRevenuePage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/agri-revenue?ts=" + Date.now(), {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "농산물 거래 매출 조회 실패");
      }

      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "농산물 거래 매출 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const sellerSet = new Set(items.map((x) => x.seller_name || "").filter(Boolean));
    const buyerSet = new Set(items.map((x) => x.buyer_company_name || "").filter(Boolean));

    return {
      totalCount: items.length,
      gross: items.reduce((sum, x) => sum + n(x.gross_amount), 0),
      platform: items.reduce((sum, x) => sum + n(x.platform_revenue), 0),
      sellerSettlement: items.reduce((sum, x) => sum + n(x.seller_settlement_amount), 0),
      waiting: items.filter((x) => x.settlement_status === "waiting").length,
      paid: items.filter((x) => x.settlement_status === "paid").length,
      sellers: sellerSet.size,
      buyers: buyerSet.size,
    };
  }, [items]);

  const productRank = useMemo(() => rankBy(items, "product_name"), [items]);
  const sellerRank = useMemo(() => rankBy(items, "seller_name"), [items]);
  const buyerRank = useMemo(() => rankBy(items, "buyer_company_name"), [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2600px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI AGRI REVENUE CENTER</p>
            <h1 className="text-4xl font-black">농산물 거래 매출센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <a href="/admin/storage-assets" className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white no-underline">
              저장자산
            </a>
            <a href="/admin/trade-offers" className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white no-underline">
              거래제안
            </a>
            <a href="/admin/settlements" className="rounded bg-black px-4 py-3 text-sm font-black text-white no-underline">
              정산센터
            </a>
          </div>
        </div>

        {error ? (
          <section className="mb-3 border border-red-300 bg-red-50 p-3 font-black text-red-700">
            {error}
          </section>
        ) : null}

        <section className="mb-3 grid grid-cols-8 gap-2">
          <Stat title="거래건수" value={`${stats.totalCount}건`} />
          <Stat title="총거래액" value={won(stats.gross)} />
          <Stat title="플랫폼수익" value={won(stats.platform)} />
          <Stat title="판매자정산" value={won(stats.sellerSettlement)} />
          <Stat title="정산대기" value={`${stats.waiting}건`} />
          <Stat title="정산완료" value={`${stats.paid}건`} />
          <Stat title="판매자수" value={`${stats.sellers}명`} />
          <Stat title="바이어수" value={`${stats.buyers}곳`} />
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-3">
          <RankBox title="품목별 거래액 TOP" rows={productRank} />
          <RankBox title="판매자 거래액 TOP" rows={sellerRank} />
          <RankBox title="바이어 거래액 TOP" rows={buyerRank} />
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            전체 거래 내역 / 정산센터 agri_settlements 기준
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1900px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th>번호</Th>
                  <Th>상태</Th>
                  <Th>품목</Th>
                  <Th>판매자</Th>
                  <Th>판매자유형</Th>
                  <Th>바이어</Th>
                  <Th>총거래액</Th>
                  <Th>플랫폼수익</Th>
                  <Th>판매자정산</Th>
                  <Th>등록일</Th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="border p-8 text-center font-black text-neutral-500">
                      농산물 거래 매출 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td>{i + 1}</Td>
                      <Td strong>{statusLabel(x.settlement_status)}</Td>
                      <Td strong>{x.product_name || "-"}</Td>
                      <Td>{x.seller_name || "-"}</Td>
                      <Td>{x.seller_type || "-"}</Td>
                      <Td strong>{x.buyer_company_name || "-"}</Td>
                      <Td strong>{won(x.gross_amount)}</Td>
                      <Td strong>{won(x.platform_revenue)}</Td>
                      <Td>{won(x.seller_settlement_amount)}</Td>
                      <Td>{String(x.created_at || "").slice(0, 10)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="border bg-white p-4">
      <p className="text-xs font-black text-neutral-500">{title}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function RankBox({ title, rows }: { title: string; rows: { name: string; amount: number }[] }) {
  return (
    <div className="border bg-white">
      <h2 className="border-b bg-neutral-100 px-3 py-2 text-lg font-black">{title}</h2>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="border p-6 text-center font-black text-neutral-500">데이터 없음</td>
            </tr>
          ) : (
            rows.slice(0, 10).map((x, i) => (
              <tr key={x.name}>
                <td className="w-16 border px-3 py-2 font-black">{i + 1}</td>
                <td className="border px-3 py-2 font-black">{x.name}</td>
                <td className="border px-3 py-2 text-right font-black">{won(x.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap border border-neutral-300 bg-neutral-200 px-2 py-2 text-left font-black">
      {children}
    </th>
  );
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <td className={`whitespace-nowrap border border-neutral-200 px-2 py-2 ${strong ? "font-black" : "font-bold text-neutral-700"}`}>
      {children}
    </td>
  );
}
