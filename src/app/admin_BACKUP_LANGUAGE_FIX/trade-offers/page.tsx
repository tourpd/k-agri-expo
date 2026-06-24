"use client";

import { useEffect, useMemo, useState } from "react";

type TradeOffer = {
  id: string;
  product_name?: string | null;
  seller_name?: string | null;
  buyer_company_name?: string | null;
  buyer_contact_name?: string | null;
  buyer_phone?: string | null;
  offer_quantity?: number | null;
  unit?: string | null;
  offer_price?: number | null;
  offer_amount?: number | null;
  title?: string | null;
  message?: string | null;
  status?: string | null;
  sent_at?: string | null;
  opened_at?: string | null;
  replied_at?: string | null;
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
  if (v === "sent") return "발송";
  if (v === "opened") return "열람";
  if (v === "interested") return "관심";
  if (v === "negotiating") return "협상중";
  if (v === "contracted") return "계약완료";
  if (v === "closed") return "종료";
  return v || "-";
}

export default function TradeOffersPage() {
  const [items, setItems] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/trade-offers?ts=" + Date.now(), {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "거래제안 조회 실패");
      }

      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "거래제안 조회 실패");
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
      sent: items.filter((x) => x.status === "sent").length,
      opened: items.filter((x) => x.status === "opened").length,
      interested: items.filter((x) => x.status === "interested").length,
      negotiating: items.filter((x) => x.status === "negotiating").length,
      contracted: items.filter((x) => x.status === "contracted").length,
      amount: items.reduce((sum, x) => sum + n(x.offer_amount), 0),
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2600px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">
              K-AGRI TRADE OFFER CENTER
            </p>
            <h1 className="text-4xl font-black">거래제안센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <button className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white">
              제안발송
            </button>
            <button className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white">
              계약전환
            </button>
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

        <section className="mb-3 grid grid-cols-7 gap-2">
          <StatBox title="전체제안" value={`${stats.total}건`} />
          <StatBox title="발송" value={`${stats.sent}건`} />
          <StatBox title="열람" value={`${stats.opened}건`} />
          <StatBox title="관심" value={`${stats.interested}건`} />
          <StatBox title="협상중" value={`${stats.negotiating}건`} />
          <StatBox title="계약완료" value={`${stats.contracted}건`} />
          <StatBox title="제안금액" value={won(stats.amount)} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-7 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="품목·판매자·바이어 검색" />
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 상태</option>
              <option>발송</option>
              <option>열람</option>
              <option>관심</option>
              <option>협상중</option>
              <option>계약완료</option>
            </select>
            <input className="h-10 border px-3 text-sm font-bold" placeholder="품목" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="판매자" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="바이어" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소금액" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {items.length}건 / 저장자산과 바이어를 연결한 거래 제안 관리
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2300px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>상태</Th>
                  <Th>품목</Th>
                  <Th>판매자</Th>
                  <Th>바이어</Th>
                  <Th>담당자</Th>
                  <Th>전화</Th>
                  <Th>제안수량</Th>
                  <Th>단위</Th>
                  <Th>제안가</Th>
                  <Th>제안금액</Th>
                  <Th>제목</Th>
                  <Th>내용</Th>
                  <Th>발송일</Th>
                  <Th>메모</Th>
                  <Th>관리</Th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="border p-8 text-center font-black text-neutral-500">
                      거래제안 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td><input type="checkbox" /></Td>
                      <Td>{i + 1}</Td>
                      <Td strong>{statusLabel(x.status)}</Td>
                      <Td strong>{x.product_name || "-"}</Td>
                      <Td>{x.seller_name || "-"}</Td>
                      <Td strong>{x.buyer_company_name || "-"}</Td>
                      <Td>{x.buyer_contact_name || "-"}</Td>
                      <Td>{x.buyer_phone || "-"}</Td>
                      <Td>{n(x.offer_quantity).toLocaleString()}</Td>
                      <Td>{x.unit || "-"}</Td>
                      <Td>{won(x.offer_price)}</Td>
                      <Td strong>{won(x.offer_amount)}</Td>
                      <Td>{x.title || "-"}</Td>
                      <Td>{x.message || "-"}</Td>
                      <Td>{String(x.sent_at || x.created_at || "").slice(0, 10)}</Td>
                      <Td>{x.memo || "-"}</Td>
                      <Td>
                        <a
                          href={`/admin/trade-offers/${x.id}`}
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

function StatBox({ title, value }: { title: string; value: string }) {
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
