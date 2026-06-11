"use client";

import { useEffect, useMemo, useState } from "react";

type Settlement = {
  id: string;
  product_name?: string | null;
  seller_name?: string | null;
  seller_type?: string | null;
  buyer_company_name?: string | null;
  gross_amount?: number | null;
  product_tax_type?: string | null;
  platform_fee_payer?: string | null;
  platform_fee_rate?: number | null;
  seller_fee_amount?: number | null;
  buyer_fee_amount?: number | null;
  platform_revenue?: number | null;
  vat_amount?: number | null;
  seller_settlement_amount?: number | null;
  settlement_status?: string | null;
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

function sellerTypeLabel(v?: string | null) {
  if (v === "individual_farmer") return "개인농가";
  if (v === "corporation") return "법인";
  if (v === "cooperative") return "조합";
  if (v === "company") return "기업";
  return v || "-";
}

function taxLabel(v?: string | null) {
  if (v === "exempt") return "면세";
  if (v === "taxable") return "과세";
  if (v === "mixed") return "혼합";
  return v || "-";
}

function payerLabel(v?: string | null) {
  if (v === "seller") return "판매자";
  if (v === "buyer") return "구매자";
  if (v === "both") return "양쪽";
  return v || "-";
}

function statusLabel(v?: string | null) {
  if (v === "waiting") return "정산대기";
  if (v === "confirmed") return "정산확정";
  if (v === "paid") return "정산완료";
  if (v === "hold") return "보류";
  return v || "-";
}

export default function SettlementsPage() {
  const [items, setItems] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/settlements?ts=" + Date.now(), {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "정산 조회 실패");
      }

      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "정산 조회 실패");
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
      gross: items.reduce((sum, x) => sum + n(x.gross_amount), 0),
      platform: items.reduce((sum, x) => sum + n(x.platform_revenue), 0),
      vat: items.reduce((sum, x) => sum + n(x.vat_amount), 0),
      seller: items.reduce((sum, x) => sum + n(x.seller_settlement_amount), 0),
      waiting: items.filter((x) => x.settlement_status === "waiting").length,
      paid: items.filter((x) => x.settlement_status === "paid").length,
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2800px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI SETTLEMENT CENTER</p>
            <h1 className="text-4xl font-black">정산센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <button className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white">
              정산확정
            </button>
            <button className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white">
              정산완료
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
          <Stat title="정산건수" value={`${stats.total}건`} />
          <Stat title="총거래금액" value={won(stats.gross)} />
          <Stat title="플랫폼수익" value={won(stats.platform)} />
          <Stat title="부가세예상" value={won(stats.vat)} />
          <Stat title="판매자정산" value={won(stats.seller)} />
          <Stat title="대기" value={`${stats.waiting}건`} />
          <Stat title="완료" value={`${stats.paid}건`} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-8 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="품목·판매자·바이어 검색" />
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 판매자유형</option>
              <option>개인농가</option>
              <option>법인</option>
              <option>조합</option>
              <option>기업</option>
            </select>
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 세금구분</option>
              <option>면세</option>
              <option>과세</option>
              <option>혼합</option>
            </select>
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 수수료부담</option>
              <option>판매자</option>
              <option>구매자</option>
              <option>양쪽</option>
            </select>
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 상태</option>
              <option>정산대기</option>
              <option>정산확정</option>
              <option>정산완료</option>
              <option>보류</option>
            </select>
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소 거래금액" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소 수수료" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {items.length}건 / 전체 거래금액과 플랫폼 수수료 매출을 분리해 관리합니다.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2800px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>상태</Th>
                  <Th>품목</Th>
                  <Th>판매자</Th>
                  <Th>판매자유형</Th>
                  <Th>바이어</Th>
                  <Th>총거래금액</Th>
                  <Th>세금구분</Th>
                  <Th>수수료부담</Th>
                  <Th>수수료율</Th>
                  <Th>판매자수수료</Th>
                  <Th>구매자수수료</Th>
                  <Th>플랫폼수익</Th>
                  <Th>부가세예상</Th>
                  <Th>판매자정산</Th>
                  <Th>등록일</Th>
                  <Th>메모</Th>
                  <Th>관리</Th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="border p-8 text-center font-black text-neutral-500">
                      정산 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td><input type="checkbox" /></Td>
                      <Td>{i + 1}</Td>
                      <Td strong>{statusLabel(x.settlement_status)}</Td>
                      <Td strong>{x.product_name || "-"}</Td>
                      <Td>{x.seller_name || "-"}</Td>
                      <Td>{sellerTypeLabel(x.seller_type)}</Td>
                      <Td strong>{x.buyer_company_name || "-"}</Td>
                      <Td strong>{won(x.gross_amount)}</Td>
                      <Td>{taxLabel(x.product_tax_type)}</Td>
                      <Td>{payerLabel(x.platform_fee_payer)}</Td>
                      <Td>{`${Math.round(n(x.platform_fee_rate) * 10000) / 100}%`}</Td>
                      <Td>{won(x.seller_fee_amount)}</Td>
                      <Td>{won(x.buyer_fee_amount)}</Td>
                      <Td strong>{won(x.platform_revenue)}</Td>
                      <Td>{won(x.vat_amount)}</Td>
                      <Td strong>{won(x.seller_settlement_amount)}</Td>
                      <Td>{String(x.created_at || "").slice(0, 10)}</Td>
                      <Td>{x.memo || "-"}</Td>
                      <Td>
                        <SettlementStatusButtons id={x.id} onDone={load} />
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


function SettlementStatusButtons({
  id,
  onDone,
}: {
  id: string;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState("");

  async function update(status: string, label: string) {
    if (!confirm(`정산 상태를 ${label}(으)로 변경할까요?`)) return;

    setLoading(status);

    try {
      const res = await fetch(`/api/admin/settlements/${id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        alert(json.error || "상태 변경 실패");
        return;
      }

      alert(`${label} 처리 완료`);
      onDone();
    } catch (e) {
      alert("상태 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={() => update("confirmed", "정산확정")}
        disabled={!!loading}
        className="rounded bg-blue-700 px-2 py-1 text-xs font-black text-white disabled:opacity-50"
      >
        확정
      </button>

      <button
        onClick={() => update("paid", "정산완료")}
        disabled={!!loading}
        className="rounded bg-green-700 px-2 py-1 text-xs font-black text-white disabled:opacity-50"
      >
        완료
      </button>

      <button
        onClick={() => update("hold", "보류")}
        disabled={!!loading}
        className="rounded bg-orange-600 px-2 py-1 text-xs font-black text-white disabled:opacity-50"
      >
        보류
      </button>
    </div>
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
