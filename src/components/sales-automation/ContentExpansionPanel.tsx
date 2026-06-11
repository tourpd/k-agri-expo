import type { SalesProduct } from "@/lib/ai/sales-automation-types";

export default function ContentExpansionPanel({
  product,
}: {
  product: SalesProduct | null;
}) {
  return (
    <section className="rounded-3xl bg-white p-8 text-black shadow-xl">
      <h2 className="text-4xl font-black">콘텐츠 확장센터</h2>
      <p className="mt-3 text-xl font-bold text-stone-600">
        선택한 제품을 4컷만화, 8컷웹툰, 쇼츠, 홈쇼핑 대본으로 확장합니다.
      </p>

      {!product ? (
        <div className="mt-6 rounded-3xl border-2 border-dashed border-stone-300 p-8 text-center text-2xl font-black text-stone-500">
          먼저 제품을 선택하세요.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {["4컷만화", "8컷웹툰", "코믹 쇼츠", "공포 쇼츠", "다큐 쇼츠", "홈쇼핑 대본"].map((item) => (
            <div key={item} className="rounded-3xl bg-green-50 p-5">
              <h3 className="text-2xl font-black">{item}</h3>
              <p className="mt-2 text-lg font-bold">
                {product.name}의 농민 문제와 구매 이유를 바탕으로 생성됩니다.
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
