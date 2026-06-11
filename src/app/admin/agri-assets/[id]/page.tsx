import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AssetFile = {
  id: string;
  asset_id: string;
  file_type: "photo" | "video" | "document" | string;
  file_name: string | null;
  file_url: string | null;
  created_at: string | null;
};

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function won(v: unknown) {
  return `${Math.round(n(v)).toLocaleString()}원`;
}

function getYoutubeId(raw?: string | null) {
  const text = String(raw || "");
  const m1 = text.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  const m2 = text.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return m1[1];
  if (m2?.[1]) return m2[1];
  return "";
}

export default async function AgriAssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: asset } = await supabase
    .from("agri_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (!asset) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
        <Link href="/admin/agri-assets" className="rounded bg-black px-4 py-3 font-black text-white">
          ← 농산물 자산센터
        </Link>
        <div className="mt-4 border bg-white p-6 font-black">농산물 자산을 찾을 수 없습니다.</div>
      </main>
    );
  }

  const { data: filesData } = await supabase
    .from("agri_asset_files")
    .select("*")
    .eq("asset_id", asset.id)
    .order("created_at", { ascending: true });

  const files = (filesData || []) as AssetFile[];
  const photos = files.filter((x) => x.file_type === "photo");
  const videos = files.filter((x) => x.file_type === "video");
  const documents = files.filter((x) => x.file_type === "document");

  const memo = String(asset.memo || "");
  const youtubeUrl = memo.match(/유튜브:\s*(https?:\/\/[^\s/]+[^\s]*)/)?.[1] || "";
  const youtubeId = getYoutubeId(youtubeUrl);

  const largeValue = n(asset.large_quantity) * n(asset.expected_price) * 1000;
  const mediumValue = n(asset.medium_quantity) * n(asset.expected_price) * 0.9 * 1000;
  const smallValue = n(asset.small_quantity) * n(asset.expected_price) * 0.7 * 1000;

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2400px]">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/admin/agri-assets" className="rounded bg-black px-4 py-3 font-black text-white">
            ← 농산물 자산센터
          </Link>

          <div className="flex gap-2">
            <Link href="/admin/storage-assets" className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white no-underline">
              저장자산 연결
            </Link>
            <Link href="/admin/processors" className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white no-underline">
              가공센터 연결
            </Link>
            <Link href="/admin/sales-channels" className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white no-underline">
              판매처 찾기
            </Link>
            <Link href="/admin/trade-offers" className="rounded bg-black px-4 py-3 text-sm font-black text-white no-underline">
              거래제안
            </Link>
          </div>
        </div>

        <section className="mb-3 border bg-white p-4">
          <p className="text-xs font-black text-green-700">AGRI ASSET CARD</p>
          <h1 className="mt-1 text-3xl font-black">{asset.asset_name || "농산물 자산카드"}</h1>
          <p className="mt-2 text-lg font-bold text-neutral-700">
            {asset.product_name || "-"} · {asset.variety_name || "-"} · {asset.producer_name || "-"} · {asset.producer_region || "-"}
          </p>
        </section>

        <section className="mb-3 grid grid-cols-6 gap-2">
          <Mini title="총수량" value={`${n(asset.total_quantity).toLocaleString()}${asset.unit || ""}`} />
          <Mini title="예상가치" value={won(asset.estimated_value)} />
          <Mini title="품질점수" value={`${n(asset.quality_score)}점`} />
          <Mini title="AI판매점수" value={`${n(asset.ai_sales_score)}점`} />
          <Mini title="사진" value={`${photos.length}장`} />
          <Mini title="영상/성적서" value={`${videos.length + (youtubeUrl ? 1 : 0)}개 / ${documents.length}개`} />
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-3">
          <Box
            title="생산자 정보"
            rows={[
              ["생산자", asset.producer_name || "-"],
              ["지역", asset.producer_region || "-"],
              ["품목", asset.product_name || "-"],
              ["품종", asset.variety_name || "-"],
              ["수확일", asset.harvest_date || "-"],
              ["메모", asset.memo || "-"],
            ]}
          />

          <Box
            title="재고·규격 정보"
            rows={[
              ["총수량", `${n(asset.total_quantity).toLocaleString()} ${asset.unit || ""}`],
              ["규격", asset.size_spec || "-"],
              ["대", `${n(asset.large_quantity).toLocaleString()} ${asset.unit || ""}`],
              ["중", `${n(asset.medium_quantity).toLocaleString()} ${asset.unit || ""}`],
              ["소", `${n(asset.small_quantity).toLocaleString()} ${asset.unit || ""}`],
              ["기준가", won(asset.expected_price)],
            ]}
          />

          <Box
            title="저장·품질 정보"
            rows={[
              ["저장위치", asset.storage_location || "-"],
              ["저장방식", asset.storage_method || "-"],
              ["등급", asset.main_grade || "-"],
              ["품질점수", `${n(asset.quality_score)}점`],
              ["AI판매점수", `${n(asset.ai_sales_score)}점`],
              ["추천판매처", asset.recommended_channel || "-"],
            ]}
          />
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-3">
          <PhotoGallery title="사진 자산" photos={photos} />
          <VideoGallery title="영상 자산" videos={videos} youtubeUrl={youtubeUrl} youtubeId={youtubeId} />
          <DocumentGallery title="성적서 자산" documents={documents} />
        </section>

        <section className="mb-3 border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">규격별 재고·가치 분석</div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-200">
                <th className="border px-3 py-2 text-left">규격</th>
                <th className="border px-3 py-2 text-left">재고</th>
                <th className="border px-3 py-2 text-left">예상단가</th>
                <th className="border px-3 py-2 text-left">예상가치</th>
                <th className="border px-3 py-2 text-left">추천판매처</th>
              </tr>
            </thead>
            <tbody>
              <SpecRow grade="대" qty={asset.large_quantity} price={n(asset.expected_price)} value={largeValue} channel="급식·식자재·소비자 공동구매" unit={asset.unit} />
              <SpecRow grade="중" qty={asset.medium_quantity} price={n(asset.expected_price) * 0.9} value={mediumValue} channel="깐마늘공장·식자재유통" unit={asset.unit} />
              <SpecRow grade="소" qty={asset.small_quantity} price={n(asset.expected_price) * 0.7} value={smallValue} channel="김치공장·가공공장" unit={asset.unit} />
            </tbody>
          </table>
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-2">
          <Box
            title="AI 판매 추천"
            rows={[
              ["1순위", "깐마늘공장 / 중·소 규격 우선"],
              ["2순위", "김치공장 / 가격 중심 대량거래"],
              ["3순위", "급식·식자재 / 대·중 규격"],
              ["4순위", "소비자 공동구매 / 대과 중심"],
              ["5순위", "흑마늘·분말 가공 / 고부가가치"],
            ]}
          />

          <Box
            title="다음 액션"
            rows={[
              ["가공 검토", "가공센터에서 깐마늘·흑마늘·분말 검토"],
              ["판매처 연결", "판매처센터에서 급식·식자재·온라인몰 연결"],
              ["거래제안", "바이어에게 거래제안 생성"],
              ["정산", "계약 후 정산센터 자동 연결"],
            ]}
          />
        </section>
      </div>
    </main>
  );
}

function Mini({ title, value }: { title: string; value: string }) {
  return (
    <div className="border bg-white px-4 py-3">
      <p className="text-xs font-black text-neutral-500">{title}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function Box({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="border bg-white">
      <h2 className="border-b bg-neutral-100 px-3 py-2 text-lg font-black">{title}</h2>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="w-44 border bg-neutral-50 px-3 py-2 font-black">{k}</td>
              <td className="border px-3 py-2 font-bold">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PhotoGallery({ title, photos }: { title: string; photos: AssetFile[] }) {
  return (
    <div className="border bg-white">
      <h2 className="border-b bg-neutral-100 px-3 py-2 text-lg font-black">{title} ({photos.length}장)</h2>
      {photos.length === 0 ? (
        <div className="p-4 text-sm font-black text-neutral-500">등록된 사진이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3">
          {photos.map((photo) => (
            <a key={photo.id} href={photo.file_url || "#"} target="_blank" className="block overflow-hidden border bg-neutral-50">
              <img src={photo.file_url || ""} alt={photo.file_name || "photo"} className="h-32 w-full object-cover" />
              <div className="truncate px-2 py-1 text-xs font-bold">{photo.file_name}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoGallery({
  title,
  videos,
  youtubeUrl,
  youtubeId,
}: {
  title: string;
  videos: AssetFile[];
  youtubeUrl: string;
  youtubeId: string;
}) {
  return (
    <div className="border bg-white">
      <h2 className="border-b bg-neutral-100 px-3 py-2 text-lg font-black">{title} ({videos.length + (youtubeUrl ? 1 : 0)}개)</h2>
      <div className="grid gap-2 p-3">
        {youtubeId ? (
          <iframe
            className="h-48 w-full border"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube video"
            allowFullScreen
          />
        ) : youtubeUrl ? (
          <a href={youtubeUrl} target="_blank" className="block border bg-neutral-50 p-3 text-sm font-black text-blue-700">
            유튜브 링크 열기
          </a>
        ) : null}

        {videos.map((video) => (
          <video key={video.id} controls className="h-48 w-full border bg-black">
            <source src={video.file_url || ""} />
          </video>
        ))}

        {!youtubeUrl && videos.length === 0 ? (
          <div className="p-4 text-sm font-black text-neutral-500">등록된 영상이 없습니다.</div>
        ) : null}
      </div>
    </div>
  );
}

function DocumentGallery({ title, documents }: { title: string; documents: AssetFile[] }) {
  return (
    <div className="border bg-white">
      <h2 className="border-b bg-neutral-100 px-3 py-2 text-lg font-black">{title} ({documents.length}개)</h2>
      {documents.length === 0 ? (
        <div className="p-4 text-sm font-black text-neutral-500">등록된 성적서가 없습니다.</div>
      ) : (
        <div className="grid gap-2 p-3">
          {documents.map((doc) => (
            <a key={doc.id} href={doc.file_url || "#"} target="_blank" className="block rounded border bg-neutral-50 p-3 text-sm font-black text-blue-700">
              {doc.file_name || "성적서 보기"}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function SpecRow({
  grade,
  qty,
  price,
  value,
  channel,
  unit,
}: {
  grade: string;
  qty: unknown;
  price: number;
  value: number;
  channel: string;
  unit?: string | null;
}) {
  return (
    <tr>
      <td className="border px-3 py-2 font-black">{grade}</td>
      <td className="border px-3 py-2 font-bold">{n(qty).toLocaleString()} {unit || ""}</td>
      <td className="border px-3 py-2 font-bold">{won(price)}</td>
      <td className="border px-3 py-2 font-black">{won(value)}</td>
      <td className="border px-3 py-2 font-bold">{channel}</td>
    </tr>
  );
}
