import Link from "next/link";

export const dynamic = "force-dynamic";

const items = [
  {
    name: "싹쓰리충",
    desc: "총채벌레·진딧물·응애 등 해충 의심 시",
  },
  {
    name: "싹쓰리충 골드",
    desc: "유기농 재배 농가의 해충 대응 자재",
  },
  {
    name: "총나와",
    desc: "총채벌레 예찰·유인 관리가 필요할 때",
  },
  {
    name: "멸규니",
    desc: "곰팡이성 병해·잎마름·탄저·노균 의심 시",
  },
];

export default function PhotoDoctorSelectPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8">
      <section className="mx-auto max-w-3xl rounded-[32px] bg-white p-6 shadow-sm">
        <div className="text-sm font-black text-green-700">
          PHOTO DOCTOR RECOMMEND
        </div>

        <h1 className="mt-3 text-4xl font-black text-neutral-950">
          진단 결과에 나온 자재를 선택하세요
        </h1>

        <p className="mt-4 text-lg font-bold leading-8 text-neutral-700">
          포토닥터 진단 화면에 표시된 자재명과 같은 항목을 선택하면
          주문 페이지로 이동합니다.
        </p>

        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <Link
              key={item.name}
              href={`/photodoctor/buy?product=${encodeURIComponent(
                item.name
              )}&source=photodoctor`}
              className="rounded-3xl border border-green-200 bg-green-50 p-5 no-underline"
            >
              <div className="text-3xl font-black text-green-800">
                {item.name}
              </div>
              <div className="mt-2 text-lg font-bold leading-8 text-neutral-700">
                {item.desc}
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/ai-consult"
          className="mt-6 block rounded-2xl border border-neutral-300 py-5 text-center text-xl font-black text-neutral-800"
        >
          포토닥터로 돌아가기
        </Link>
      </section>
    </main>
  );
}