import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AgriTradeIntroPage() {
  return (
    <main className="min-h-screen bg-[#f3f7ef] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href="/expo" className="inline-flex rounded-2xl bg-black px-5 py-3 font-black text-white no-underline">
          ← 엑스포로 돌아가기
        </Link>

        <section className="mt-5 rounded-[32px] bg-gradient-to-br from-green-900 via-green-700 to-yellow-400 p-8 text-white shadow-2xl">
          <p className="text-sm font-black">K-AGRI TRADE CENTER</p>
          <h1 className="mt-3 text-5xl font-black leading-tight">
            농산물 거래센터
          </h1>
          <p className="mt-5 text-2xl font-black leading-relaxed">
            농민이 보유한 농산물을 등록하면 K-Agri가 검증 바이어와 연결해
            거래제안·화상상담·계약·정산까지 이어갑니다.
          </p>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            {[
              ["1", "농산물 등록", "사진·수량·단가 입력"],
              ["2", "AI 바이어 추천", "급식·김치·식자재 연결"],
              ["3", "거래제안", "수량·단가·총액 자동계산"],
              ["4", "상담·계약", "LIVE 창고확인 후 정산"],
            ].map(([no, title, desc]) => (
              <div key={no} className="rounded-3xl bg-white/15 p-5">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl font-black text-green-800">
                  {no}
                </div>
                <div className="text-xl font-black">{title}</div>
                <div className="mt-2 text-sm font-bold text-white/80">{desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/expo/agri-trade/register" className="rounded-2xl bg-white px-8 py-5 text-xl font-black text-green-800 no-underline">
              내 농산물 등록하기 →
            </Link>
            <Link href="/admin/agri-assets" className="rounded-2xl bg-black px-8 py-5 text-xl font-black text-white no-underline">
              관리자 자산센터
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border bg-white p-6">
          <h2 className="text-3xl font-black">이런 농산물을 등록하세요</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {["마늘·양파·감자", "저온창고 보관 농산물", "가공 가능한 농산물", "수산물", "김치·절임·분말 원료", "대량 거래 가능한 농산물"].map((x) => (
              <div key={x} className="rounded-2xl border p-5 text-xl font-black">
                {x}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
