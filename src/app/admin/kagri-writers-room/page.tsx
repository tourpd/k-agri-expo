import Link from "next/link";

export const dynamic = "force-dynamic";

const menus = [
  {
    title: "🚨 K-Agri 뉴스센터",
    desc: "긴급속보, 농업뉴스, 병해충, 기상, 축산, 과수, 지원사업을 콘텐츠로 바꾸는 뉴스 편집 데스크",
    href: "/admin/kagri-writers-room/news",
  },
  {
    title: "📝 작가노트",
    desc: "운전 중 떠오른 생각, 인터뷰 아이디어, 방송 소재를 바로 적는 곳",
    href: "/admin/kagri-writers-room/writer-notes",
  },
  {
    title: "💡 아이디어 보관함",
    desc: "철수동무, 작물 시점, 역발상, 뉴트리킷 광고 같은 아이디어 저장소",
    href: "/admin/kagri-writers-room/ideas",
  },
  {
    title: "🎭 캐릭터 자산센터",
    desc: "안이영 소장, 안철현 박사, 슈퍼농부, 철수동무 등 인물·캐릭터 관리",
    href: "/admin/kagri-writers-room/characters",
  },
  {
    title: "🎓 농사지식센터",
    desc: "재배력, 병해충, 포토닥터, 안이영 소장 자료 등 농사 지식 정리",
    href: "/admin/kagri-writers-room/knowledge",
  },
  {
    title: "📖 콘텐츠 DNA",
    desc: "한국농수산TV 콘텐츠 제작 원칙, 관점, 역발상 규칙 저장",
    href: "/admin/kagri-writers-room/dna",
  },
  {
    title: "🤝 공동 편집구역",
    desc: "주제·대상·출연진·관점·콘텐츠 형식을 조합해 실제 콘텐츠 생산",
    href: "/admin/sales-automation/test/builder",
  },
];

export default function KagriWritersRoomPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl bg-black p-8 text-white">
          <p className="text-xl font-black text-green-300">
            K-Agri Content OS
          </p>
          <h1 className="mt-3 text-5xl font-black">
            🎬 K-Agri 작가실
          </h1>
          <p className="mt-4 text-2xl font-bold text-stone-200">
            아이디어 → 캐릭터 → 농사지식 → 공동 편집 → 콘텐츠 생산까지 이어지는 한국농수산TV 중앙 작가실입니다.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="rounded-3xl bg-white p-7 shadow-xl ring-1 ring-stone-200 transition hover:scale-[1.02]"
            >
              <h2 className="text-3xl font-black">{menu.title}</h2>
              <p className="mt-4 text-xl font-bold leading-relaxed text-stone-700">
                {menu.desc}
              </p>
              <div className="mt-6 inline-flex rounded-2xl bg-green-700 px-6 py-4 text-xl font-black text-white">
                들어가기 →
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
