"use client";

import { useEffect, useMemo, useState } from "react";

type CustomerAsset = {
  id: string;
  customer_name?: string | null;
  phone?: string | null;
  customer_type?: string | null;
  customer_stage?: string | null;
  region?: string | null;
  interest_category?: string | null;
  interest_products?: string | null;
  total_purchase_amount?: number | null;
  order_count?: number | null;
  ltv?: number | null;
  last_activity_at?: string | null;
  memo?: string | null;

  main_crop?: string | null;
  main_category?: string | null;
  last_purchase_product?: string | null;
  last_purchase_date?: string | null;
  repurchase_count?: number | null;
  education_count?: number | null;
  consult_count?: number | null;
  groupbuy_count?: number | null;
  video_watch_count?: number | null;
  health_interest?: string | null;
  crop_interest?: string | null;
  ai_grade?: string | null;
  recommended_product?: string | null;
  recommended_action?: string | null;
  sms_sent_count?: number | null;
  kakao_sent_count?: number | null;
  crm_score?: number | null;
};

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function won(v: unknown) {
  return `${n(v).toLocaleString()}원`;
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).slice(0, 10);
}

function typeLabel(v?: string | null) {
  if (v === "farmer") return "고객";
  if (v === "consumer") return "일반소비자";
  if (v === "plant_lover") return "식집사";
  if (v === "garden") return "텃밭";
  if (v === "buyer") return "바이어";
  if (v === "vendor") return "업체";
  if (v === "student") return "교육생";
  if (v === "visitor") return "방문객";
  return v || "-";
}

function stageLabel(v?: string | null) {
  if (v === "visitor") return "방문자";
  if (v === "viewer") return "관람객";
  if (v === "lead") return "관심고객";
  if (v === "consult") return "상담고객";
  if (v === "buyer") return "구매고객";
  if (v === "repeat") return "재구매고객";
  if (v === "vip") return "VIP";
  return v || "-";
}

function grade(x: CustomerAsset) {
  if (x.ai_grade) return x.ai_grade;
  if (x.customer_stage === "vip") return "S";
  if (n(x.total_purchase_amount) >= 1000000 || n(x.order_count) >= 10) return "S";
  if (n(x.total_purchase_amount) >= 500000 || n(x.order_count) >= 5) return "A";
  if (n(x.total_purchase_amount) > 0 || n(x.order_count) > 0) return "B";
  return "C";
}

export default function CustomerAssetsPage() {
  const [items, setItems] = useState<CustomerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/customer-assets?ts=" + Date.now(), {
        cache: "no-store",
      });
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
    return {
      total: items.length,
      farmer: items.filter((x) => x.customer_type === "farmer").length,
      consumer: items.filter((x) => x.customer_type === "consumer").length,
      buyer: items.filter((x) => x.customer_type === "buyer").length,
      vip: items.filter((x) => grade(x) === "S").length,
      amount: items.reduce((sum, x) => sum + n(x.total_purchase_amount), 0),
      ltv: items.reduce((sum, x) => sum + n(x.ltv), 0),
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2600px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI CUSTOMER ASSET CENTER</p>
            <h1 className="text-3xl font-black">고객 자산센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="h-10 rounded bg-green-700 px-4 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <button className="h-10 rounded bg-blue-700 px-4 text-sm font-black text-white">CRM 추출</button>
            <button className="h-10 rounded bg-orange-600 px-4 text-sm font-black text-white">구매고객 추출</button>
            <button className="h-10 rounded bg-black px-4 text-sm font-black text-white">엑셀 다운로드</button>
          </div>
        </div>

        {error ? (
          <section className="mb-3 border border-red-300 bg-red-50 p-3 font-black text-red-700">
            {error}
          </section>
        ) : null}

        <section className="mb-3 grid grid-cols-7 gap-2">
          <MiniStat title="전체고객" value={`${stats.total}명`} />
          <MiniStat title="고객" value={`${stats.farmer}명`} />
          <MiniStat title="소비자" value={`${stats.consumer}명`} />
          <MiniStat title="바이어" value={`${stats.buyer}명`} />
          <MiniStat title="S등급" value={`${stats.vip}명`} />
          <MiniStat title="총구매액" value={won(stats.amount)} />
          <MiniStat title="예상 LTV" value={won(stats.ltv)} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-8 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="이름·전화·관심 검색" />
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 유형</option>
              <option>고객</option>
              <option>일반소비자</option>
              <option>식집사</option>
              <option>텃밭</option>
              <option>바이어</option>
            </select>
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 단계</option>
              <option>관람객</option>
              <option>관심고객</option>
              <option>상담고객</option>
              <option>구매고객</option>
              <option>VIP</option>
            </select>
            <select className="h-10 border px-3 text-sm font-bold">
              <option>AI등급</option>
              <option>S</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select>
            <input className="h-10 border px-3 text-sm font-bold" placeholder="작목" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="카테고리" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소 LTV" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {items.length}명 / 고객유형·고객단계·구매·상담·교육·AI추천 통합 관리
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[3300px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>등급</Th>
                  <Th>CRM점수</Th>
                  <Th>고객명</Th>
                  <Th>전화</Th>
                  <Th>유형</Th>
                  <Th>단계</Th>
                  <Th>지역</Th>
                  <Th>작목</Th>
                  <Th>대표카테고리</Th>
                  <Th>건강관심</Th>
                  <Th>작물관심</Th>
                  <Th>관심제품</Th>
                  <Th>최근구매</Th>
                  <Th>최근구매일</Th>
                  <Th>주문</Th>
                  <Th>재구매</Th>
                  <Th>상담</Th>
                  <Th>교육</Th>
                  <Th>공동구매</Th>
                  <Th>영상시청</Th>
                  <Th>구매금액</Th>
                  <Th>LTV</Th>
                  <Th>추천상품</Th>
                  <Th>추천액션</Th>
                  <Th>문자</Th>
                  <Th>카카오</Th>
                  <Th>메모</Th>
                  <Th>관리</Th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={30} className="border p-8 text-center font-black text-neutral-500">
                      고객 자산 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td><input type="checkbox" /></Td>
                      <Td>{i + 1}</Td>
                      <Td strong>{grade(x)}</Td>
                      <Td strong>{n(x.crm_score)}점</Td>
                      <Td strong>{x.customer_name || "-"}</Td>
                      <Td>{x.phone || "-"}</Td>
                      <Td>{typeLabel(x.customer_type)}</Td>
                      <Td>{stageLabel(x.customer_stage)}</Td>
                      <Td>{x.region || "-"}</Td>
                      <Td strong>{x.main_crop || "-"}</Td>
                      <Td>{x.main_category || x.interest_category || "-"}</Td>
                      <Td>{x.health_interest || "-"}</Td>
                      <Td>{x.crop_interest || "-"}</Td>
                      <Td>{x.interest_products || "-"}</Td>
                      <Td strong>{x.last_purchase_product || "-"}</Td>
                      <Td>{shortDate(x.last_purchase_date)}</Td>
                      <Td>{n(x.order_count)}회</Td>
                      <Td>{n(x.repurchase_count)}회</Td>
                      <Td>{n(x.consult_count)}회</Td>
                      <Td>{n(x.education_count)}회</Td>
                      <Td>{n(x.groupbuy_count)}회</Td>
                      <Td>{n(x.video_watch_count)}회</Td>
                      <Td strong>{won(x.total_purchase_amount)}</Td>
                      <Td strong>{won(x.ltv)}</Td>
                      <Td strong>{x.recommended_product || "-"}</Td>
                      <Td>{x.recommended_action || "-"}</Td>
                      <Td>{n(x.sms_sent_count)}회</Td>
                      <Td>{n(x.kakao_sent_count)}회</Td>
                      <Td>{x.memo || "-"}</Td>
                      <Td>
                        <a
                          href={`/admin/customer-assets/${x.id}`}
                          className="rounded bg-green-700 px-3 py-1 text-xs font-black text-white no-underline"
                        >
                          자산카드
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
