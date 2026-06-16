export default function ArchiveCenterPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black">
          K-AGRI 원본영상 아카이브센터
        </h1>

        <p className="mt-3 text-lg font-bold text-gray-700">
          외장하드 영상 → AI 자산화 → 콘텐츠 생성
        </p>

        <div className="mt-8 rounded-3xl border bg-white p-6 shadow">
          <h2 className="text-2xl font-black">
            영상 스캔 준비 완료
          </h2>

          <p className="mt-3">
            외장하드 영상 목록을 수집하고
            썸네일과 메타데이터를 저장합니다.
          </p>
        </div>
      </div>
    </main>
  );
}
