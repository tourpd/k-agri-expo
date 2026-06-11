"use client";

import { useEffect, useMemo, useState } from "react";

type SalesOffer = {
  id: string;
  product_name?: string | null;
  processed_product_name?: string | null;
  owner_name?: string | null;
  sales_company_name?: string | null;
  sales_contact_name?: string | null;
  sales_phone?: string | null;
  offer_quantity?: number | null;
  offer_unit?: string | null;
  offer_price?: number | null;
  offer_amount?: number | null;
  status?: string | null;
  title?: string | null;
  message?: string | null;
  memo?: string | null;
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
  if (v === "draft") return "초안";
  if (v === "sent") return "제안발송";
  if (v === "opened") return "열람";
  if (v === "interested") return "관심";
  if (v === "negotiating") return "협상중";
  if (v === "contracted") return "계약완료";
  if (v === "closed") return "종료";
  return v || "-";
}

export default function SalesOffersPage() {
  const [items, setItems] = useState<SalesOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/sales-offers?ts=" + Date.now(), {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "판매제안 조회 실패");
      }

      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "판매제안 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      quantity: items.reduce((sum, x) => sum + n(x.offer_quantity), 0),
      amount: items.reduce((sum, x) => sum + n(x.offer_amount), 0),
      sent: items.filter((x) => x.status === "sent").length,
      interested: items.filter((x) => x.status === "interested").length,
      contracted: items.filter((x) => x.status === "contracted").length,
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2600px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI SALES OFFER CENTER</p>
            <h1 className="text-4xl font-black">판매제안센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <a href="/admin/sales-channels" className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white no-underline">
              판매처센터
            </a>
            <a href="/admin/process-offers" className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white no-underline">
              가공제안
            </a>
            <button className="rounded bg-black px-4 py-3 text-sm font-black text-white">
              엑셀 다운로드
            </button>
          </div>
        </div>

        {error ? (
          <section className="mb-3 border border-red-300 bg-red-50 p-3 font-black text-red-700">
            {error}
          </section>
        ) : null}

        <section className="mb-3 grid grid-cols-6 gap-2">
          <Stat title="판매제안" value={`${stats.total}건`} />
          <Stat title="제안수량" value={`${stats.quantity.toLocaleString()}톤`} />
          <Stat title="제안금액" value={won(stats.amount)} />
          <Stat title="발송" value={`${stats.sent}건`} />
          <Stat title="관심" value={`${stats.interested}건`} />
          <Stat title="계약" value={`${stats.contracted}건`} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-7 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="품목·판매처 검색" />
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 상태</option>
              <option>초안</option>
              <option>제안발송</option>
              <option>관심</option>
              <option>협상중</option>
              <option>계약완료</option>
            </select>
            <input className="h-10 border px-3 text-sm font-bold" placeholder="가공품명" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="판매처" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소 수량" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소 금액" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {items.length}건 / 가공품을 최종 판매처에 제안하는 관리센터
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2300px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>상태</Th>
                  <Th>원물</Th>
                  <Th>가공품</Th>
                  <Th>보유자</Th>
                  <Th>판매처</Th>
                  <Th>담당자</Th>
                  <Th>전화</Th>
                  <Th>수량</Th>
                  <Th>단위</Th>
                  <Th>단가</Th>
                  <Th>제안금액</Th>
                  <Th>제목</Th>
                  <Th>메시지</Th>
                  <Th>메모</Th>
                  <Th>관리</Th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="border p-8 text-center font-black text-neutral-500">
                      판매제안 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td><input type="checkbox" /></Td>
                      <Td>{i + 1}</Td>
                      <Td strong>{statusLabel(x.status)}</Td>
                      <Td>{x.product_name || "-"}</Td>
                      <Td strong>{x.processed_product_name || "-"}</Td>
                      <Td>{x.owner_name || "-"}</Td>
                      <Td strong>{x.sales_company_name || "-"}</Td>
                      <Td>{x.sales_contact_name || "-"}</Td>
                      <Td>{x.sales_phone || "-"}</Td>
                      <Td strong>{n(x.offer_quantity).toLocaleString()}</Td>
                      <Td>{x.offer_unit || "-"}</Td>
                      <Td>{won(x.offer_price)}</Td>
                      <Td strong>{won(x.offer_amount)}</Td>
                      <Td>{x.title || "-"}</Td>
                      <Td>{x.message || "-"}</Td>
                      <Td>{x.memo || "-"}</Td>
                      <Td>
                        <a
                          href={`/admin/sales-offers/${x.id}`}
                          className="rounded bg-green-700 px-3 py-1 text-xs font-black text-white no-underline"
                        >
                          관리
                        </a>
                      </Td>
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
      <p className="mt-1 text-2xl font-black">{value}</p>
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
