"use client";

import { useEffect, useMemo, useState } from "react";

type SalesChannel = {
  id: string;
  company_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  channel_type?: string | null;
  region?: string | null;
  interest_products?: string | null;
  monthly_purchase_qty?: number | null;
  qty_unit?: string | null;
  expected_purchase_amount?: number | null;
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
  if (v === "food_service") return "식자재/급식";
  if (v === "school_meal") return "학교급식";
  if (v === "retail") return "유통매장";
  if (v === "franchise") return "프랜차이즈";
  if (v === "online_mall") return "온라인몰";
  if (v === "export") return "수출";
  return v || "-";
}

export default function SalesChannelsPage() {
  const [items, setItems] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/sales-channels?ts=" + Date.now(), {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "판매처 조회 실패");
      }

      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "판매처 조회 실패");
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
      qty: items.reduce((sum, x) => sum + n(x.monthly_purchase_qty), 0),
      amount: items.reduce((sum, x) => sum + n(x.expected_purchase_amount), 0),
      food: items.filter((x) => x.channel_type === "food_service").length,
      school: items.filter((x) => x.channel_type === "school_meal").length,
      active: items.filter((x) => x.status === "active").length,
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2600px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI SALES CHANNEL CENTER</p>
            <h1 className="text-4xl font-black">판매처센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <button className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white">
              AI 판매매칭
            </button>
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
          <Stat title="전체 판매처" value={`${stats.total}곳`} />
          <Stat title="월 구매량" value={`${stats.qty.toLocaleString()}톤`} />
          <Stat title="예상 구매액" value={won(stats.amount)} />
          <Stat title="식자재/급식" value={`${stats.food}곳`} />
          <Stat title="학교급식" value={`${stats.school}곳`} />
          <Stat title="활성" value={`${stats.active}곳`} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-7 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="회사명 검색" />
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 판매처유형</option>
              <option>식자재/급식</option>
              <option>학교급식</option>
              <option>유통매장</option>
              <option>프랜차이즈</option>
              <option>온라인몰</option>
              <option>수출</option>
            </select>
            <input className="h-10 border px-3 text-sm font-bold" placeholder="지역" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="관심품목" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소 월구매량" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="AI점수" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {items.length}곳 / 가공품을 판매할 수 있는 최종 판매처 자산
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2100px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>회사명</Th>
                  <Th>유형</Th>
                  <Th>담당자</Th>
                  <Th>전화</Th>
                  <Th>지역</Th>
                  <Th>관심품목</Th>
                  <Th>월구매량</Th>
                  <Th>단위</Th>
                  <Th>예상구매액</Th>
                  <Th>AI점수</Th>
                  <Th>상태</Th>
                  <Th>메모</Th>
                  <Th>관리</Th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="border p-8 text-center font-black text-neutral-500">
                      판매처 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td><input type="checkbox" /></Td>
                      <Td>{i + 1}</Td>
                      <Td strong>{x.company_name || "-"}</Td>
                      <Td>{typeLabel(x.channel_type)}</Td>
                      <Td>{x.contact_name || "-"}</Td>
                      <Td>{x.phone || "-"}</Td>
                      <Td>{x.region || "-"}</Td>
                      <Td strong>{x.interest_products || "-"}</Td>
                      <Td strong>{n(x.monthly_purchase_qty).toLocaleString()}</Td>
                      <Td>{x.qty_unit || "-"}</Td>
                      <Td strong>{won(x.expected_purchase_amount)}</Td>
                      <Td strong>{n(x.ai_score)}점</Td>
                      <Td>{x.status || "-"}</Td>
                      <Td>{x.memo || "-"}</Td>
                      <Td>
                        <button className="rounded bg-green-700 px-3 py-1 text-xs font-black text-white">
                          판매제안
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
