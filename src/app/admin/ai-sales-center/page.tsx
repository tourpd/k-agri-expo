import Link from "next/link";

export const dynamic = "force-dynamic";

const menus = [
  {
    icon: "📦",
    title: "제품 등록센터",
    desc: "제품사진 · PDF · 유튜브 등록",
    href: "/vendor/ai-sales",
  },
  {
    icon: "🚨",
    title: "병해충 AI 센터",
    desc: "병해충 PDF + 포토닥터 분석",
    href: "/admin/pest-alerts",
  },
  {
    icon: "🎯",
    title: "광고문구 생성기",
    desc: "농민 심리 기반 광고 생성",
    href: "/admin/ad-copy",
  },
  {
    icon: "🎬",
    title: "쇼츠 생성기",
    desc: "사투리 · 상황극 쇼츠 생성",
    href: "/admin/shorts-generator",
  },
  {
    icon: "🎥",
    title: "광고영상 생성기",
    desc: "Veo · Kling · Hailuo 프롬프트",
    href: "/admin/video-generator",
  },
  {
    icon: "🔥",
    title: "공동구매 생성기",
    desc: "AI 판매페이지 자동 생성",
    href: "/admin/groupbuy-generator",
  },
  {
    icon: "📱",
    title: "문자 생성기",
    desc: "SMS · 카카오톡 문구 생성",
    href: "/admin/sms-generator",
  },
  {
    icon: "👨‍🌾",
    title: "CRM 센터",
    desc: "고객관리 · 재구매 예측",
    href: "/admin/crm",
  },
];

export default function AISalesCenterPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-stone-950">
      <div className="mx-auto max-w-7xl">

        {/* HERO */}
        <section className="rounded-3xl bg-gradient-to-r from-green-900 via-green-800 to-green-600 p-10 text-white shadow-2xl">
          <p className="text-xl font-black text-green-100">
            K-Agri Expo
          </p>

          <h1 className="mt-4 text-6xl font-black leading-tight">
            AI 농업 마케팅 센터
          </h1>

          <p className="mt-5 text-3xl font-black leading-relaxed">
            제품 하나만 등록하십시오.
          </p>

          <p className="mt-4 text-2xl font-bold leading-relaxed">
            AI가 광고 · 쇼츠 · 영상 · 공동구매 · 문자 · CRM까지 자동 생성합니다.
          </p>
        </section>

        {/* 실시간 위험도 */}
        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <p className="text-lg font-black text-red-700">
            실시간 위험도
          </p>

          <h2 className="mt-2 text-4xl font-black">
            포토닥터 기반 위험 병해충
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-4">

            <RiskCard
              title="총채벌레"
              value="1위"
              desc="최근 급증"
            />

            <RiskCard
              title="탄저병"
              value="2위"
              desc="장마 전 주의"
            />

            <RiskCard
              title="노린재"
              value="3위"
              desc="확산중"
            />

            <RiskCard
              title="흰가루병"
              value="4위"
              desc="관찰 필요"
            />

          </div>
        </section>

        {/* 메뉴 */}
        <section className="mt-8">
          <h2 className="text-4xl font-black">
            AI 마케팅 도구
          </h2>

          <div className="mt-6 grid gap-5 lg:grid-cols-4 md:grid-cols-2">

            {menus.map((menu) => (
              <Link
                key={menu.title}
                href={menu.href}
                className="rounded-3xl bg-white p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl ring-1 ring-black/5"
              >
                <div className="text-5xl">
                  {menu.icon}
                </div>

                <h3 className="mt-4 text-2xl font-black">
                  {menu.title}
                </h3>

                <p className="mt-3 text-lg font-bold text-stone-600">
                  {menu.desc}
                </p>
              </Link>
            ))}

          </div>
        </section>

        {/* AI 추천상품 */}
        <section className="mt-8 rounded-3xl bg-yellow-50 p-8 shadow-xl ring-1 ring-yellow-200">
          <p className="text-lg font-black text-yellow-800">
            AI 추천 광고 상품
          </p>

          <h2 className="mt-2 text-4xl font-black">
            지금 광고하면 좋은 제품
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-4">

            <ProductCard name="싹쓰리충" />
            <ProductCard name="멸규니" />
            <ProductCard name="켈팍" />
            <ProductCard name="K-Plus" />

          </div>
        </section>

        {/* AI 생성 현황 */}
        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <p className="text-lg font-black text-green-700">
            오늘 생성 현황
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-4">

            <StatCard
              title="광고문구"
              value="128건"
            />

            <StatCard
              title="쇼츠대본"
              value="56건"
            />

            <StatCard
              title="판매페이지"
              value="12건"
            />

            <StatCard
              title="문자발송"
              value="2,451건"
            />

          </div>
        </section>

      </div>
    </main>
  );
}

function RiskCard({
  title,
  value,
  desc,
}: {
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl bg-red-50 p-6 ring-1 ring-red-100">
      <p className="text-xl font-black">
        {title}
      </p>

      <p className="mt-3 text-4xl font-black text-red-700">
        {value}
      </p>

      <p className="mt-3 text-lg font-bold">
        {desc}
      </p>
    </div>
  );
}

function ProductCard({
  name,
}: {
  name: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-yellow-200">
      <p className="text-2xl font-black">
        {name}
      </p>

      <p className="mt-3 text-lg font-bold text-stone-600">
        광고 생성 가능
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-stone-50 p-6 ring-1 ring-black/5">
      <p className="text-xl font-black">
        {title}
      </p>

      <p className="mt-3 text-5xl font-black text-green-700">
        {value}
      </p>
    </div>
  );
}