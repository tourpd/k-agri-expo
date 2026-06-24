"use client";

import { useEffect, useMemo, useState } from "react";

type Processor = {
  id: string;
  company_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  processor_type?: string | null;
  region?: string | null;
  process_items?: string | null;
  monthly_capacity?: number | null;
  capacity_unit?: string | null;
  main_products?: string | null;
  service_type?: string | null;
  expected_processing_amount?: number | null;
  ai_score?: number | null;
  status?: string | null;
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

function typeLabel(v?: string | null) {
  if (v === "garlic_processor") return "마늘가공";
  if (v === "kimchi_factory") return "김치공장";
  if (v === "fishery_processor") return "수산가공";
  if (v === "juice_factory") return "즙가공";
  if (v === "powder_factory") return "분말가공";
  if (v === "frozen_factory") return "냉동가공";
  return v || "-";
}

export default function ProcessorsPage() {
  const [items, setItems] = useState<Processor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/processors?ts=" + Date.now(), {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "가공센터 조회 실패");
      }

      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "가공센터 조회 실패");
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
      capacity: items.reduce((sum, x) => sum + n(x.monthly_capacity), 0),
      amount: items.reduce((sum, x) => sum + n(x.expected_processing_amount), 0),
      garlic: items.filter((x) => x.processor_type === "garlic_processor").length,
      kimchi: items.filter((x) => x.processor_type === "kimchi_factory").length,
      fishery: items.filter((x) => x.processor_type === "fishery_processor").length,
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2600px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI PROCESSOR CENTER</p>
            <h1 className="text-4xl font-black">가공센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <button className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white">
              AI 가공매칭
            </button>
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
          <Stat title="전체 가공업체" value={`${stats.total}곳`} />
          <Stat title="월 처리능력" value={`${stats.capacity.toLocaleString()}톤`} />
          <Stat title="예상 가공액" value={won(stats.amount)} />
          <Stat title="마늘가공" value={`${stats.garlic}곳`} />
          <Stat title="김치공장" value={`${stats.kimchi}곳`} />
          <Stat title="수산가공" value={`${stats.fishery}곳`} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-7 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="업체명 검색" />
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 가공유형</option>
              <option>마늘가공</option>
              <option>김치공장</option>
              <option>수산가공</option>
              <option>즙가공</option>
              <option>냉동가공</option>
            </select>
            <input className="h-10 border px-3 text-sm font-bold" placeholder="지역" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="가공품목" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소 처리능력" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="AI점수" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {items.length}곳 / 저장자산을 가공품으로 전환할 수 있는 업체 자산
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2300px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>업체명</Th>
                  <Th>담당자</Th>
                  <Th>전화</Th>
                  <Th>가공유형</Th>
                  <Th>지역</Th>
                  <Th>가공품목</Th>
                  <Th>월처리능력</Th>
                  <Th>단위</Th>
                  <Th>주요생산품</Th>
                  <Th>서비스</Th>
                  <Th>예상가공액</Th>
                  <Th>AI점수</Th>
                  <Th>상태</Th>
                  <Th>메모</Th>
                  <Th>관리</Th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="border p-8 text-center font-black text-neutral-500">
                      가공업체 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td><input type="checkbox" /></Td>
                      <Td>{i + 1}</Td>
                      <Td strong>{x.company_name || "-"}</Td>
                      <Td>{x.contact_name || "-"}</Td>
                      <Td>{x.phone || "-"}</Td>
                      <Td>{typeLabel(x.processor_type)}</Td>
                      <Td>{x.region || "-"}</Td>
                      <Td strong>{x.process_items || "-"}</Td>
                      <Td strong>{n(x.monthly_capacity).toLocaleString()}</Td>
                      <Td>{x.capacity_unit || "-"}</Td>
                      <Td>{x.main_products || "-"}</Td>
                      <Td>{x.service_type || "-"}</Td>
                      <Td strong>{won(x.expected_processing_amount)}</Td>
                      <Td strong>{n(x.ai_score)}점</Td>
                      <Td>{x.status || "-"}</Td>
                      <Td>{x.memo || "-"}</Td>
                      <Td>
                        <button className="rounded bg-green-700 px-3 py-1 text-xs font-black text-white">
                          매칭
                        </button>
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
