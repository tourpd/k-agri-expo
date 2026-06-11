"use client";

import { useEffect, useMemo, useState } from "react";

type Buyer = {
  id: string;
  company_name?: string;
  contact_name?: string;
  phone?: string;
  buyer_type?: string;
  region?: string;
  interest_products?: string;
  monthly_purchase_qty?: number;
  expected_purchase_amount?: number;
  ai_score?: number;
  status?: string;
  memo?: string;
};

export default function BuyersPage() {
  const [items, setItems] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/buyers?ts=" + Date.now(), {
        cache: "no-store",
      });

      const json = await res.json();

      if (json.ok) {
        setItems(json.items || []);
      }
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
      kimchi: items.filter(
        (x) => x.buyer_type === "kimchi_factory"
      ).length,
      processing: items.filter(
        (x) => x.buyer_type === "processing_factory"
      ).length,
      distributor: items.filter(
        (x) => x.buyer_type === "food_distributor"
      ).length,
      amount: items.reduce(
        (sum, x) =>
          sum + Number(x.expected_purchase_amount || 0),
        0
      ),
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2600px]">

        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">
              K-AGRI BUYER CENTER
            </p>
            <h1 className="text-4xl font-black">
              바이어센터
            </h1>
          </div>

          <div className="flex gap-2">
            <button className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">
              신규등록
            </button>

            <button className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white">
              AI 매칭
            </button>

            <button className="rounded bg-black px-4 py-3 text-sm font-black text-white">
              엑셀 다운로드
            </button>
          </div>
        </div>

        <section className="mb-3 grid grid-cols-5 gap-2">
          <StatBox title="전체 바이어" value={stats.total} />
          <StatBox title="김치공장" value={stats.kimchi} />
          <StatBox title="가공공장" value={stats.processing} />
          <StatBox title="유통업체" value={stats.distributor} />
          <StatBox
            title="예상 구매금액"
            value={stats.amount.toLocaleString() + "원"}
          />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-6 gap-2">
            <input
              className="h-10 border px-3"
              placeholder="회사명 검색"
            />

            <input
              className="h-10 border px-3"
              placeholder="지역"
            />

            <input
              className="h-10 border px-3"
              placeholder="관심품목"
            />

            <input
              className="h-10 border px-3"
              placeholder="최소 구매액"
            />

            <input
              className="h-10 border px-3"
              placeholder="AI점수"
            />

            <button className="h-10 bg-neutral-900 font-black text-white">
              검색
            </button>
          </div>
        </section>

        <section className="border bg-white">

          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {items.length}건
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1800px] border-collapse text-sm">

              <thead>

                <tr className="bg-neutral-200">
                  <Th>회사명</Th>
                  <Th>담당자</Th>
                  <Th>전화</Th>
                  <Th>유형</Th>
                  <Th>지역</Th>
                  <Th>관심품목</Th>
                  <Th>월구매량</Th>
                  <Th>예상구매액</Th>
                  <Th>AI점수</Th>
                  <Th>상태</Th>
                  <Th>메모</Th>
                </tr>

              </thead>

              <tbody>

                {items.map((x) => (
                  <tr key={x.id}>

                    <Td strong>{x.company_name}</Td>
                    <Td>{x.contact_name}</Td>
                    <Td>{x.phone}</Td>
                    <Td>{x.buyer_type}</Td>
                    <Td>{x.region}</Td>
                    <Td>{x.interest_products}</Td>
                    <Td>{x.monthly_purchase_qty}</Td>

                    <Td strong>
                      {Number(
                        x.expected_purchase_amount || 0
                      ).toLocaleString()}원
                    </Td>

                    <Td strong>{x.ai_score}</Td>
                    <Td>{x.status}</Td>
                    <Td>{x.memo}</Td>

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

function StatBox({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="border bg-white p-4">
      <p className="text-xs font-black text-neutral-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="border border-neutral-300 px-2 py-2 text-left font-black">
      {children}
    </th>
  );
}

function Td({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`border border-neutral-200 px-2 py-2 ${
        strong ? "font-black" : "font-bold text-neutral-700"
      }`}
    >
      {children}
    </td>
  );
}
