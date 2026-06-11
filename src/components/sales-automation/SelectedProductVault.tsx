import type { SalesProduct } from "@/lib/ai/sales-automation-types";

export default function SelectedProductVault({
  products,
}: {
  products: SalesProduct[];
}) {
  return (
    <section className="rounded-3xl bg-white p-8 text-black shadow-xl">
      <h2 className="text-4xl font-black">선택상품 보관함</h2>
      <p className="mt-3 text-xl font-bold text-stone-600">
        전체 제품 중 상세페이지와 판매 콘텐츠로 확장할 제품만 모읍니다.
      </p>

      {products.length === 0 ? (
        <div className="mt-6 rounded-3xl border-2 border-dashed border-stone-300 p-8 text-center text-2xl font-black text-stone-500">
          선택된 제품이 없습니다.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p, i) => (
            <article key={`${p.name}-${i}`} className="rounded-3xl border-2 border-black p-5">
              <p className="text-sm font-black text-green-700">{p.category || "미분류"}</p>
              <h3 className="mt-2 text-3xl font-black">{p.name}</h3>
              <p className="mt-3 text-lg font-bold text-stone-700">{p.reason || "설명 필요"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-xl bg-green-700 px-4 py-3 font-black text-white">
                  상세페이지
                </button>
                <button className="rounded-xl bg-purple-700 px-4 py-3 font-black text-white">
                  콘텐츠
                </button>
                <button className="rounded-xl bg-black px-4 py-3 font-black text-white">
                  엑스포 등록
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
