"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Customer = {
  id: string;
  name?: string | null;
  phone?: string | null;
  region?: string | null;
  crop?: string | null;
  customer_type?: string | null;
  customer_stage?: string | null;
  joint_score?: number | null;
  blood_score?: number | null;
  eye_score?: number | null;
  interest_products?: string | null;
  order_count?: number | null;
  consult_count?: number | null;
  total_revenue_krw?: number | null;
  total_purchase_amount?: number | null;
  education_count?: number | null;
  groupbuy_count?: number | null;
  memo?: string | null;
};

type Log = {
  id: string;
  customer_id?: string | null;
  phone?: string | null;
  activity_type?: string | null;
  activity_title?: string | null;
};

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function typeLabel(v?: string | null) {
  if (v === "garden") return "텃밭";
  if (v === "balcony") return "베란다";
  if (v === "plant_parent") return "식집사";
  if (v === "consumer") return "일반소비자";
  if (v === "health") return "건강고객";
  if (v === "creator") return "크리에이터";
  return "고객";
}

function scoreCustomer(c: Customer, logs: Log[]) {
  const myLogs = logs.filter((l) => l.customer_id === c.id || (c.phone && l.phone === c.phone));
  let score = 0;

  score += myLogs.filter((l) => l.activity_type === "video_watch").length * 10;
  score += myLogs.filter((l) => l.activity_type === "product_click").length * 20;
  score += myLogs.filter((l) => l.activity_type === "consult").length * 30;
  score += myLogs.filter((l) => l.activity_type === "education").length * 20;
  score += myLogs.filter((l) => l.activity_type === "groupbuy").length * 40;
  score += myLogs.filter((l) => l.activity_type === "order").length * 50;

  score += n(c.order_count) * 8;
  score += n(c.consult_count) * 5;
  score += n(c.groupbuy_count) * 10;
  score += n(c.education_count) * 5;

  const revenue = n(c.total_revenue_krw || c.total_purchase_amount);
  if (revenue >= 1000000) score += 20;
  else if (revenue >= 500000) score += 10;

  return Math.min(score, 100);
}

function status(score: number) {
  if (score >= 90) return "HOT";
  if (score >= 70) return "WARM";
  if (score >= 50) return "관심";
  return "관찰";
}

function recommend(c: Customer) {
  const recs: string[] = [];
  if (n(c.joint_score) >= 70 || String(c.interest_products || "").includes("MSM")) recs.push("MSM");
  if (n(c.eye_score) >= 70 || String(c.interest_products || "").includes("루테인")) recs.push("루테인");
  if (n(c.blood_score) >= 70 || String(c.interest_products || "").includes("혈행")) recs.push("혈행");
  if (String(c.crop || "").includes("마늘")) recs.push("마늘교육");
  if (String(c.crop || "").includes("딸기")) recs.push("딸기교육");
  return recs.length ? recs.join("·") : "추천대기";
}

export default function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/crm?ts=" + Date.now(), { cache: "no-store" });
      const text = await res.text();

      if (!res.ok) {
        throw new Error(`CRM API 오류: ${res.status} ${text.slice(0, 120)}`);
      }

      const json = JSON.parse(text);

      if (!json.ok) throw new Error(json.error || "CRM 조회 실패");

      setCustomers(json.customers || []);
      setLogs(json.logs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CRM 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    return customers.map((c) => {
      const score = scoreCustomer(c, logs);
      const myLogs = logs.filter((l) => l.customer_id === c.id || (c.phone && l.phone === c.phone));
      const latest = myLogs[0];

      return {
        ...c,
        crmScore: score,
        crmStatus: status(score),
        recommendText: recommend(c),
        latestAction: latest?.activity_title || "-",
        latestType: latest?.activity_type || "-",
      };
    });
  }, [customers, logs]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      hot: rows.filter((x) => x.crmStatus === "HOT").length,
      warm: rows.filter((x) => x.crmStatus === "WARM").length,
      buyer: rows.filter((x) => n(x.order_count) > 0).length,
      logs: logs.length,
    };
  }, [rows, logs]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2300px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI AI CRM CENTER</p>
            <h1 className="text-3xl font-black">통합 CRM 센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="h-10 rounded bg-green-700 px-4 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <button className="h-10 rounded bg-blue-700 px-4 text-sm font-black text-white">문자발송</button>
            <button className="h-10 rounded bg-orange-600 px-4 text-sm font-black text-white">공동구매 추출</button>
            <button className="h-10 rounded bg-black px-4 text-sm font-black text-white">엑셀 다운로드</button>
          </div>
        </div>

        {error ? (
          <section className="mb-3 border border-red-300 bg-red-50 p-3 font-black text-red-700">
            {error}
          </section>
        ) : null}

        <section className="mb-3 grid grid-cols-5 gap-2">
          <MiniStat title="전체고객" value={`${stats.total}명`} />
          <MiniStat title="HOT" value={`${stats.hot}명`} />
          <MiniStat title="WARM" value={`${stats.warm}명`} />
          <MiniStat title="구매고객" value={`${stats.buyer}명`} />
          <MiniStat title="행동로그" value={`${stats.logs}건`} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-7 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="이름·전화·관심사 검색" />
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 유형</option>
              <option>고객</option>
              <option>텃밭</option>
              <option>식집사</option>
              <option>일반소비자</option>
              <option>건강고객</option>
            </select>
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 상태</option>
              <option>HOT</option>
              <option>WARM</option>
              <option>관심</option>
              <option>관찰</option>
            </select>
            <input className="h-10 border px-3 text-sm font-bold" placeholder="추천상품" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="지역" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="작목" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {rows.length}명 / CRM 점수 기준: 영상 +10, 클릭 +20, 상담 +30, 공동구매 +40, 주문 +50
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2300px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>상태</Th>
                  <Th>점수</Th>
                  <Th>고객명</Th>
                  <Th>유형</Th>
                  <Th>전화</Th>
                  <Th>지역</Th>
                  <Th>작목</Th>
                  <Th>관심제품</Th>
                  <Th>추천상품</Th>
                  <Th>최근행동</Th>
                  <Th>행동유형</Th>
                  <Th>주문</Th>
                  <Th>상담</Th>
                  <Th>매출</Th>
                  <Th>다음 액션</Th>
                  <Th>메모</Th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="border p-8 text-center font-black text-neutral-500">
                      CRM 대상 고객이 없습니다.
                    </td>
                  </tr>
                ) : (
                  rows.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td><input type="checkbox" /></Td>
                      <Td>{i + 1}</Td>
                      <Td strong>{x.crmStatus}</Td>
                      <Td strong>{x.crmScore}점</Td>
                      <Td strong>
                        <Link
                          href={`/admin/crm/${x.id}`}
                          className="font-black text-green-700 underline"
                        >
                          {x.name || "-"}
                        </Link>
                      </Td>
                      <Td>{typeLabel(x.customer_type)}</Td>
                      <Td>{x.phone || "-"}</Td>
                      <Td>{x.region || "-"}</Td>
                      <Td>{x.crop || "-"}</Td>
                      <Td>{x.interest_products || "-"}</Td>
                      <Td strong>{x.recommendText}</Td>
                      <Td>{x.latestAction}</Td>
                      <Td>{x.latestType}</Td>
                      <Td>{n(x.order_count)}회</Td>
                      <Td>{n(x.consult_count)}회</Td>
                      <Td strong>{n(x.total_revenue_krw || x.total_purchase_amount).toLocaleString()}원</Td>
                      <Td>맞춤 문자·공동구매 안내</Td>
                      <Td>{x.memo || "-"}</Td>
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
