import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function won(v: unknown) {
  return `${n(v).toLocaleString()}원`;
}

function gradeClass(g?: string | null) {
  if (g === "A+") return "bg-purple-700 text-white";
  if (g === "A") return "bg-green-700 text-white";
  if (g === "B") return "bg-blue-700 text-white";
  if (g === "D") return "bg-red-700 text-white";
  return "bg-neutral-400 text-white";
}

export default async function BuyersPage() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("agri_buyers")
    .select("*")
    .order("buyer_grade", { ascending: true })
    .order("ai_score", { ascending: false });

  const buyers = data || [];

  const totalAmount = buyers.reduce((sum: number, b: any) => sum + n(b.expected_purchase_amount), 0);
  const verified = buyers.filter((b: any) => ["A+", "A", "B"].includes(String(b.buyer_grade || ""))).length;
  const active = buyers.filter((b: any) => b.status === "active").length;

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2600px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI VERIFIED BUYER CENTER</p>
            <h1 className="text-4xl font-black">인증 바이어센터</h1>
          </div>

          <div className="flex gap-2">
            <Link href="/admin/agri-assets" className="rounded bg-black px-4 py-3 font-black text-white no-underline">
              농산물 자산센터
            </Link>
          </div>
        </div>

        <section className="mb-3 grid grid-cols-5 gap-2">
          <Stat title="전체 바이어" value={`${buyers.length}개`} />
          <Stat title="검증 바이어" value={`${verified}개`} />
          <Stat title="거래중" value={`${active}개`} />
          <Stat title="예상 구매금액" value={won(totalAmount)} />
          <Stat title="운영목표" value="50개" />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-6 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="회사명 검색" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="지역" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="관심품목" />
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 등급</option>
              <option>A+</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
              <option>D</option>
            </select>
            <input className="h-10 border px-3 text-sm font-bold" placeholder="검증자" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 font-black">
            표시 {buyers.length}건 / K-Agri 인증 바이어 등급·실거래·결제 신뢰도 관리
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2300px] border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-200">
                  <Th>등급</Th>
                  <Th>회사명</Th>
                  <Th>실거래</Th>
                  <Th>농민평점</Th>
                  <Th>결제점수</Th>
                  <Th>AI점수</Th>
                  <Th>담당자</Th>
                  <Th>전화</Th>
                  <Th>구분</Th>
                  <Th>지역</Th>
                  <Th>관심품목</Th>
                  <Th>월 구매량</Th>
                  <Th>예상구매액</Th>
                  <Th>검증자</Th>
                  <Th>검증일</Th>
                  <Th>상태</Th>
                  <Th>메모</Th>
                </tr>
              </thead>

              <tbody>
                {buyers.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="border p-8 text-center font-black text-neutral-500">
                      등록된 바이어가 없습니다.
                    </td>
                  </tr>
                ) : (
                  buyers.map((b: any) => (
                    <tr key={b.id} className="hover:bg-green-50">
                      <Td>
                        <span className={`inline-flex min-w-12 justify-center rounded px-3 py-1 text-xs font-black ${gradeClass(b.buyer_grade)}`}>
                          {b.buyer_grade || "C"}
                        </span>
                      </Td>
                      <Td strong>
                        <Link href={`/admin/buyers/${b.id}`} className="font-black text-black underline">
                          {b.company_name || "-"}
                        </Link>
                      </Td>
                      <Td>{n(b.trade_count).toLocaleString()}회</Td>
                      <Td>{n(b.farmer_rating).toFixed(1)}</Td>
                      <Td>{n(b.payment_score)}점</Td>
                      <Td strong>{n(b.ai_score)}점</Td>
                      <Td>{b.contact_name || "-"}</Td>
                      <Td>{b.phone || "-"}</Td>
                      <Td>{b.buyer_type || "-"}</Td>
                      <Td>{b.region || "-"}</Td>
                      <Td>{b.interest_products || "-"}</Td>
                      <Td>{n(b.monthly_purchase_qty).toLocaleString()}</Td>
                      <Td strong>{won(b.expected_purchase_amount)}</Td>
                      <Td>{b.verified_by || "-"}</Td>
                      <Td>{b.verification_date ? String(b.verification_date).slice(0, 10) : "-"}</Td>
                      <Td>{b.status || "-"}</Td>
                      <Td>{b.memo || "-"}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-3 border bg-white p-4">
          <h2 className="text-xl font-black">등급 기준</h2>
          <div className="mt-3 grid gap-2 text-sm font-bold lg:grid-cols-5">
            <div className="border p-3"><b>A+</b><br />K-Agri 인증 / 실거래 검증 / 결제사고 없음</div>
            <div className="border p-3"><b>A</b><br />구매력 검증 / 대형·전략 바이어</div>
            <div className="border p-3"><b>B</b><br />사업자·담당자 확인 완료</div>
            <div className="border p-3"><b>C</b><br />신규 등록 / 실거래 전</div>
            <div className="border p-3"><b>D</b><br />주의 / 클레임·결제지연 이력</div>
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
  return <th className="whitespace-nowrap border bg-neutral-200 px-3 py-2 text-left font-black">{children}</th>;
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return <td className={`whitespace-nowrap border px-3 py-2 ${strong ? "font-black" : "font-bold text-neutral-700"}`}>{children}</td>;
}
