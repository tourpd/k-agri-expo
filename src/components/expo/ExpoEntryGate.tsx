import Link from "next/link";

const items = [
  {
    title: "나는 농민입니다",
    description: "특가 · 병해 상담 · 신제품 · 라이브 보기",
    href: "/expo/farmer",
  },
  {
    title: "나는 기업입니다",
    description: "부스 참가 · 리드 확보 · 제품 홍보",
    href: "/expo/vendor",
  },
  {
    title: "나는 바이어입니다",
    description: "공급사 찾기 · 수입상담 · 해외관 연결",
    href: "/expo/buyer",
  },
];

export default function ExpoEntryGate() {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-b from-green-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
            대한민국 농업 온라인 박람회
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-neutral-900 md:text-6xl">
            K-Agri Expo 2026
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-600 md:text-lg">
            농민 · 기업 · 바이어가 바로 연결되는 새로운 농업 플랫폼
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-full flex-col">
                <div className="text-xl font-bold text-neutral-900">{item.title}</div>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {item.description}
                </p>
                <div className="mt-6 text-sm font-semibold text-green-700">
                  바로 입장하기 →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}