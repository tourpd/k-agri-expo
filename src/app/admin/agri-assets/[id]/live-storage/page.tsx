import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LiveStorageManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/admin/agri-assets/${id}`}
          className="rounded bg-black px-4 py-3 font-black text-white no-underline"
        >
          ← 자산카드로 돌아가기
        </Link>

        <section className="mt-4 border-2 border-red-600 bg-white p-5">
          <div className="text-xs font-black text-red-700">
            K-AGRI LIVE STORAGE
          </div>
          <h1 className="mt-2 text-3xl font-black">
            🔴 LIVE 창고인증 연결 관리
          </h1>
          <p className="mt-3 text-lg font-bold text-neutral-700">
            이 화면은 저온창고 CCTV/NVR/API/RTSP 스트림을 농산물 자산과 연결하는 관리 화면입니다.
          </p>
        </section>

        <section className="mt-4 grid gap-3">
          <div className="border bg-white p-4">
            <h2 className="text-xl font-black">1단계. 농민 동의</h2>
            <p className="mt-2 font-bold text-neutral-700">
              창고 내부는 재산 정보이므로 농민이 공개 범위를 선택해야 합니다.
            </p>
            <div className="mt-3 grid gap-2 text-sm font-bold">
              <div className="rounded border p-3">□ 전체 비공개</div>
              <div className="rounded border p-3">□ 승인된 바이어만 보기</div>
              <div className="rounded border p-3">□ 견적 요청 바이어만 보기</div>
              <div className="rounded border p-3">□ 공개 판매페이지에 노출</div>
            </div>
          </div>

          <div className="border bg-white p-4">
            <h2 className="text-xl font-black">2단계. CCTV 연결 방식</h2>
            <div className="mt-3 grid gap-2 text-sm font-bold">
              <div className="rounded border p-3">RTSP 스트림 URL</div>
              <div className="rounded border p-3">NVR 제조사 API</div>
              <div className="rounded border p-3">공개 HLS/m3u8 URL</div>
              <div className="rounded border p-3">10초 스냅샷 인증 방식</div>
            </div>
          </div>

          <div className="border bg-white p-4">
            <h2 className="text-xl font-black">3단계. 바이어 화면 문구</h2>
            <div className="mt-3 rounded bg-neutral-100 p-4 text-lg font-black">
              이 농산물은 K-Agri LIVE 창고인증 자산입니다. 저온창고 실시간 화면과 보관 상태가 확인된 농산물입니다.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
