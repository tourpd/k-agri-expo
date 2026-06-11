import Link from "next/link";
import SelectedProductVault from "@/components/sales-automation/SelectedProductVault";
import ContentExpansionPanel from "@/components/sales-automation/ContentExpansionPanel";
import VideoReviewCenter from "@/components/sales-automation/VideoReviewCenter";
import CreatorCenterPreview from "@/components/sales-automation/CreatorCenterPreview";

export const dynamic = "force-dynamic";

export default function SalesAutomationHubPage({
  params,
}: {
  params: { id: string };
}) {
  const sampleSelectedProducts = [
    {
      name: "올가포스",
      category: "유기질비료",
      reason: "고함량 동물성 유기질 비료로 지속효과와 친환경 포인트가 있음",
      selected: true,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href={`/admin/sales-automation/${params.id}/analysis`}
          className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
        >
          ← AI 자료 분석실
        </Link>

        <section className="rounded-3xl bg-gradient-to-r from-green-950 via-green-800 to-green-600 p-8 text-white shadow-xl">
          <p className="text-lg font-black text-green-100">K-HUB AI 판매자동화</p>
          <h1 className="mt-3 text-5xl font-black">선택 제품 판매 확장 허브</h1>
          <p className="mt-4 text-2xl font-bold text-green-50">
            PDF 분석으로 발견한 제품을 상세페이지, 콘텐츠, 영상 리뷰, 크리에이터 매칭으로 확장합니다.
          </p>
        </section>

        <SelectedProductVault products={sampleSelectedProducts} />
        <ContentExpansionPanel product={sampleSelectedProducts[0]} />
        <VideoReviewCenter />
        <CreatorCenterPreview />
      </div>
    </main>
  );
}
