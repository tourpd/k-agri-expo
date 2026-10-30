import { redirect } from "next/navigation";

// 예전 /booth/[slug] 화면은 가짜 부스 자료였습니다. 실제 부스 상세로 보냅니다.
export default async function BoothDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/expo/booths/${encodeURIComponent(slug)}`);
}
