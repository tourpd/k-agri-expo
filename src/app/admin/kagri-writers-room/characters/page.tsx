import Link from "next/link";

export const dynamic = "force-dynamic";

const characters = [
  ["🚜 슈퍼농부", "40대 중반", "경북 구미", "경상도", "현장 실전파", "고추·마늘·시설재배", "그라믄 된다 아이가", "S급", "/images/characters/super-farmer.png"],
  ["🚩 철수동무", "40대", "함경북도", "함경도", "질문형", "DMZ 공동농장·신기술", "무엇입네까?", "S급", "/images/characters/chulsoo.png"],
  ["👩 직설하는 영희", "40대", "전라도", "전라도", "팩트체커", "가격·유통·농협·공동구매 검증", "그래서 얼마 남는데?", "S급", "/images/characters/younghee.png"],
  ["🎓 안이영 소장", "60대 초반", "충청도", "충청도", "농민교육 전문가", "재배력·병해충·토양·농사교육", "농사는 기본이여", "S급", "/images/characters/aniyoung.png"],
  ["🧬 안철현 박사", "40대 중반", "전문가", "전문가 말투", "식물생리 전문가", "아미65·블로킹칼·일소피해", "작물은 거짓말하지 않습니다", "S급", "/images/characters/ancheolhyun.png"],
  ["🧄 이성준 회장", "60대", "홍산마늘", "농민 리더 말투", "홍산마늘 대표 농민", "홍산마늘·마늘농가 권익·공동대응", "마늘값은 농민이 지켜야 합니다", "S급", "/images/characters/leesungjun.png"],
  ["🎬 조세환 PD", "50대", "한국농수산TV", "PD 진행자 말투", "세계관 총감독", "한국농수산TV·K-Agri Expo·라디오스타", "이건 그냥 콘텐츠가 아닙니다", "총감독", "/images/characters/sehwan-pd.png"],
  ["🪴 벌교댁 순자씨", "50대", "전남 벌교", "전남 사투리", "생활농업", "베란다텃밭·상추·방울토마토", "아이고~ 그라고 말이여~", "A급", "/images/characters/sunja.png"],
  ["👵 제주할망", "70대", "제주", "제주 방언", "감귤·생활지혜", "감귤·제주농업", "혼저 옵서예", "A급", "/images/characters/jeju-grandma.png"],
  ["🌱 초짜농부", "30대", "귀농 1년차", "쉬운 말투", "초보 질문자", "귀농·농사기초·실수", "이거 병인가요?", "A급", "/images/characters/new-farmer.png"],
  ["📸 포토닥터", "AI", "AI 농사응급실", "짧고 명확", "AI 진단 조수", "병해충·생리장해·사진진단", "농사는 추측보다 확인입니다", "S급", "/images/characters/photodoctor.png"],
  ["🇨🇳 연변 김사장", "50대", "연변", "연변 말투", "해외시장 담당", "중국시장·수출·유통", "중국에서도 통합니다무", "B급", "/images/characters/yanbian-kim.png"],
  ["🐕 복돌이", "강아지", "남측 진돗개", "마스코트", "남측 마스코트", "DMZ 공동농장", "멍!", "A급", "/images/characters/bokdori.png"],
  ["🐕 철봉이", "강아지", "북측 삽살개", "마스코트", "북측 마스코트", "DMZ 공동농장", "컹!", "A급", "/images/characters/cheolbongi.png"],
];

export default function CharacterCenterPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/admin/kagri-writers-room" className="rounded-2xl bg-black px-6 py-4 text-xl font-black text-white">
            ← K-Agri 작가실
          </Link>
          <Link href="/admin/sales-automation/test/builder" className="rounded-2xl bg-green-700 px-6 py-4 text-xl font-black text-white">
            🤝 공동편집구역
          </Link>
        </div>

        <section className="rounded-3xl bg-black p-8 text-white shadow-xl">
          <p className="text-xl font-black text-green-300">K-Agri Character Universe</p>
          <h1 className="mt-3 text-5xl font-black">🎭 캐릭터 자산센터</h1>
          <p className="mt-4 text-2xl font-bold text-stone-200">
            K-Agri Expo의 콘텐츠·뉴스·라디오·상세페이지에 투입할 캐릭터를 관리합니다.
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <div className="mb-5 flex flex-wrap gap-3">
            <button className="rounded-2xl bg-green-700 px-5 py-4 text-lg font-black text-white">+ 신규 캐릭터</button>
            <button className="rounded-2xl bg-black px-5 py-4 text-lg font-black text-white">선택 공동편집 투입</button>
            <button className="rounded-2xl bg-blue-700 px-5 py-4 text-lg font-black text-white">라디오 투입</button>
            <button className="rounded-2xl bg-purple-700 px-5 py-4 text-lg font-black text-white">DMZ 투입</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1600px] border-collapse text-left">
              <thead>
                <tr className="bg-black text-white">
                  <th className="p-4 text-lg">선택</th>
                  <th className="p-4 text-lg">이미지</th>
                  <th className="p-4 text-lg">캐릭터</th>
                  <th className="p-4 text-lg">나이</th>
                  <th className="p-4 text-lg">지역</th>
                  <th className="p-4 text-lg">사투리</th>
                  <th className="p-4 text-lg">역할</th>
                  <th className="p-4 text-lg">전문분야</th>
                  <th className="p-4 text-lg">대표대사</th>
                  <th className="p-4 text-lg">등급</th>
                  <th className="p-4 text-lg">작업</th>
                </tr>
              </thead>
              <tbody>
                {characters.map((c) => (
                  <tr key={c[0]} className="border-b-2 border-stone-200 hover:bg-green-50">
                    <td className="p-4"><input type="checkbox" className="h-6 w-6" /></td>
                    <td className="p-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-3xl">
                        {c[0].split(" ")[0]}
                      </div>
                    </td>
                    <td className="p-4 text-xl font-black">{c[0]}</td>
                    <td className="p-4 text-lg font-bold">{c[1]}</td>
                    <td className="p-4 text-lg font-bold">{c[2]}</td>
                    <td className="p-4 text-lg font-bold">{c[3]}</td>
                    <td className="p-4 text-lg font-bold">{c[4]}</td>
                    <td className="p-4 text-lg font-bold">{c[5]}</td>
                    <td className="p-4 text-lg font-black text-green-700">{c[6]}</td>
                    <td className="p-4 text-lg font-black text-red-700">{c[7]}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-xl bg-black px-4 py-3 font-black text-white">편집</button>
                        <button className="rounded-xl bg-green-700 px-4 py-3 font-black text-white">투입</button>
                      </div>
                    </td>
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
