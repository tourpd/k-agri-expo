"use client";

import { useEffect, useMemo, useState } from "react";

type ProcessOffer = {
  id: string;
  product_name?: string | null;
  owner_name?: string | null;
  processor_company_name?: string | null;
  processor_contact_name?: string | null;
  processor_phone?: string | null;
  raw_quantity?: number | null;
  raw_unit?: string | null;
  process_type?: string | null;
  expected_yield_rate?: number | null;
  expected_output_quantity?: number | null;
  output_unit?: string | null;
  expected_processing_fee?: number | null;
  expected_sales_amount?: number | null;
  status?: string | null;
  title?: string | null;
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

function percent(v: unknown) {
  return `${Math.round(n(v) * 100)}%`;
}

function statusLabel(v?: string | null) {
  if (v === "draft") return "초안";
  if (v === "sent") return "제안발송";
  if (v === "accepted") return "수락";
  if (v === "processing") return "가공중";
  if (v === "completed") return "가공완료";
  if (v === "rejected") return "거절";
  return v || "-";
}

export default function ProcessOffersPage() {
  const [items, setItems] = useState<ProcessOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/process-offers?ts=" + Date.now(), {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "가공제안 조회 실패");
      }

      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "가공제안 조회 실패");
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
      raw: items.reduce((sum, x) => sum + n(x.raw_quantity), 0),
      output: items.reduce((sum, x) => sum + n(x.expected_output_quantity), 0),
      fee: items.reduce((sum, x) => sum + n(x.expected_processing_fee), 0),
      sales: items.reduce((sum, x) => sum + n(x.expected_sales_amount), 0),
      accepted: items.filter((x) => x.status === "accepted").length,
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2600px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI PROCESS OFFER CENTER</p>
            <h1 className="text-4xl font-black">가공제안센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <a href="/admin/processors" className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white no-underline">
              가공센터
            </a>
            <a href="/admin/storage-assets" className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white no-underline">
              저장자산
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
          <Stat title="가공제안" value={`${stats.total}건`} />
          <Stat title="원물수량" value={`${stats.raw.toLocaleString()}톤`} />
          <Stat title="예상생산" value={`${stats.output.toLocaleString()}톤`} />
          <Stat title="예상가공비" value={won(stats.fee)} />
          <Stat title="예상판매액" value={won(stats.sales)} />
          <Stat title="수락" value={`${stats.accepted}건`} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-7 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="품목·보유자·가공업체 검색" />
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 상태</option>
              <option>초안</option>
              <option>제안발송</option>
              <option>수락</option>
              <option>가공중</option>
              <option>가공완료</option>
            </select>
            <input className="h-10 border px-3 text-sm font-bold" placeholder="가공방식" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소 원물수량" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소 예상판매액" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="가공업체" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {items.length}건 / 원물을 가공품으로 전환하는 제안 관리
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2400px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>상태</Th>
                  <Th>품목</Th>
                  <Th>보유자</Th>
                  <Th>가공업체</Th>
                  <Th>담당자</Th>
                  <Th>전화</Th>
                  <Th>원물수량</Th>
                  <Th>단위</Th>
                  <Th>가공방식</Th>
                  <Th>예상수율</Th>
                  <Th>예상생산</Th>
                  <Th>생산단위</Th>
                  <Th>예상가공비</Th>
                  <Th>예상판매액</Th>
                  <Th>제목</Th>
                  <Th>메모</Th>
                  <Th>관리</Th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="border p-8 text-center font-black text-neutral-500">
                      가공제안 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td><input type="checkbox" /></Td>
                      <Td>{i + 1}</Td>
                      <Td strong>{statusLabel(x.status)}</Td>
                      <Td strong>{x.product_name || "-"}</Td>
                      <Td>{x.owner_name || "-"}</Td>
                      <Td strong>{x.processor_company_name || "-"}</Td>
                      <Td>{x.processor_contact_name || "-"}</Td>
                      <Td>{x.processor_phone || "-"}</Td>
                      <Td strong>{n(x.raw_quantity).toLocaleString()}</Td>
                      <Td>{x.raw_unit || "-"}</Td>
                      <Td strong>{x.process_type || "-"}</Td>
                      <Td>{percent(x.expected_yield_rate)}</Td>
                      <Td strong>{n(x.expected_output_quantity).toLocaleString()}</Td>
                      <Td>{x.output_unit || "-"}</Td>
                      <Td>{won(x.expected_processing_fee)}</Td>
                      <Td strong>{won(x.expected_sales_amount)}</Td>
                      <Td>{x.title || "-"}</Td>
                      <Td>{x.memo || "-"}</Td>
                      <Td>
                        <a
                          href={`/admin/process-offers/${x.id}`}
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
