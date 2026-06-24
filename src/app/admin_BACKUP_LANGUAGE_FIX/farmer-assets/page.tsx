"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Farmer = {
  id: string;
  name?: string | null;
  phone?: string | null;
  region?: string | null;
  crop?: string | null;
  farm_area?: string | null;
  farm_area_pyeong?: number | null;
  health_score?: number | null;
  joint_score?: number | null;
  blood_score?: number | null;
  eye_score?: number | null;
  interest_products?: string | null;
  consult_count?: number | null;
  order_count?: number | null;
  total_revenue_krw?: number | null;
  total_purchase_amount?: number | null;
  education_count?: number | null;
  groupbuy_count?: number | null;
  last_activity_at?: string | null;
  memo?: string | null;
  farmer_grade?: string | null;
};

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function calcGrade(f: Farmer) {
  const revenue = n(f.total_revenue_krw || f.total_purchase_amount);
  const orders = n(f.order_count);
  const area = n(f.farm_area_pyeong);
  const consults = n(f.consult_count);

  if (revenue >= 1000000 || orders >= 10 || area >= 10000) return "S";
  if (revenue >= 500000 || orders >= 5 || consults >= 5) return "A";
  if (revenue >= 200000 || orders >= 2 || consults >= 2) return "B";
  return "C";
}

function gradeReason(f: Farmer) {
  const grade = calcGrade(f);
  if (grade === "S") return "고매출·대면적·핵심농가";
  if (grade === "A") return "구매·상담 활발";
  if (grade === "B") return "관심·전환 가능";
  return "신규·관찰 필요";
}

function areaText(f: Farmer) {
  if (f.farm_area_pyeong && f.farm_area_pyeong > 0) {
    return `${n(f.farm_area_pyeong).toLocaleString()}평`;
  }
  return f.farm_area || "-";
}

export default function FarmerAssetsPage() {
  const [items, setItems] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/farmer-assets", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "고객 자산 조회 실패");
      }

      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "고객 자산 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = items.reduce(
      (sum, f) => sum + n(f.total_revenue_krw || f.total_purchase_amount),
      0
    );
    const totalOrders = items.reduce((sum, f) => sum + n(f.order_count), 0);
    const vipCount = items.filter((f) => ["S", "A"].includes(calcGrade(f))).length;

    return {
      total: items.length,
      vip: vipCount,
      health: items.filter((f) => n(f.health_score) >= 60).length,
      orders: totalOrders,
      revenue: totalRevenue,
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2200px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI FARMER ASSET CENTER</p>
            <h1 className="text-3xl font-black">고객 자산센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="h-10 rounded bg-green-700 px-4 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <button className="h-10 rounded bg-blue-700 px-4 text-sm font-black text-white">CRM 등록</button>
            <button className="h-10 rounded bg-orange-600 px-4 text-sm font-black text-white">건강관리</button>
            <button className="h-10 rounded bg-black px-4 text-sm font-black text-white">엑셀 다운로드</button>
          </div>
        </div>

        {error ? (
          <section className="mb-3 border border-red-300 bg-red-50 p-3 font-black text-red-700">
            {error}
          </section>
        ) : null}

        <section className="mb-3 grid grid-cols-5 gap-2">
          <MiniStat title="전체" value={`${stats.total}명`} />
          <MiniStat title="VIP" value={`${stats.vip}명`} />
          <MiniStat title="건강관심" value={`${stats.health}명`} />
          <MiniStat title="총주문" value={`${stats.orders}건`} />
          <MiniStat title="총매출" value={`${stats.revenue.toLocaleString()}원`} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-6 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="통합검색" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="지역" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="작목" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="건강관심" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소 매출" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {items.length}명 / 등급 기준: S 고매출·대면적·핵심농가, A 구매·상담 활발, B 관심·전환 가능, C 신규
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2400px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>등급</Th>
                  <Th>등급사유</Th>
                  <Th>고객명</Th>
                  <Th>전화</Th>
                  <Th>지역</Th>
                  <Th>작목</Th>
                  <Th>평수</Th>
                  <Th>건강</Th>
                  <Th>관절</Th>
                  <Th>혈행</Th>
                  <Th>눈건강</Th>
                  <Th>관심제품</Th>
                  <Th>상담</Th>
                  <Th>주문</Th>
                  <Th>매출</Th>
                  <Th>교육</Th>
                  <Th>공동구매</Th>
                  <Th>최근활동</Th>
                  <Th>메모</Th>
                  <Th>상세</Th>
                </tr>
              </thead>

              <tbody>
                {items.map((f, i) => (
                  <tr key={f.id} className="hover:bg-green-50">
                    <Td><input type="checkbox" /></Td>
                    <Td>{i + 1}</Td>
                    <Td strong>{calcGrade(f)}</Td>
                    <Td>{gradeReason(f)}</Td>
                    <Td strong>{f.name || "-"}</Td>
                    <Td>{f.phone || "-"}</Td>
                    <Td>{f.region || "-"}</Td>
                    <Td strong>{f.crop || "-"}</Td>
                    <Td strong>{areaText(f)}</Td>
                    <Td strong>{n(f.health_score)}점</Td>
                    <Td>{n(f.joint_score)}점</Td>
                    <Td>{n(f.blood_score)}점</Td>
                    <Td>{n(f.eye_score)}점</Td>
                    <Td>{f.interest_products || "-"}</Td>
                    <Td>{n(f.consult_count)}회</Td>
                    <Td>{n(f.order_count)}회</Td>
                    <Td strong>{n(f.total_revenue_krw || f.total_purchase_amount).toLocaleString()}원</Td>
                    <Td>{n(f.education_count)}회</Td>
                    <Td>{n(f.groupbuy_count)}회</Td>
                    <Td>{f.last_activity_at || "-"}</Td>
                    <Td>{f.memo || "-"}</Td>
                    <Td>
                      <Link
                        href={`/admin/farmer-assets/${f.id}`}
                        className="inline-flex rounded bg-green-700 px-3 py-1 text-xs font-black text-white"
                      >
                        보기
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="border bg-white px-4 py-3">
      <p className="text-xs font-black text-neutral-500">{title}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="sticky top-0 whitespace-nowrap border border-neutral-300 bg-neutral-200 px-2 py-2 text-left font-black">
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
