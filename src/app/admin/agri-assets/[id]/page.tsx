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

type LiveCamera = {
  id: string;
  asset_id: string;
  camera_name: string | null;
  live_url: string | null;
  snapshot_url: string | null;
  temperature: number | null;
  humidity: number | null;
  is_active: boolean | null;
  last_checked_at: string | null;
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

function safeFileUrl(raw?: string | null) {
  const url = String(raw || "").trim();
  if (!url) return "#";

  try {
    const u = new URL(url);
    u.pathname = u.pathname
      .split("/")
      .map((part) => encodeURIComponent(decodeURIComponent(part)))
      .join("/");
    return u.toString();
  } catch {
    return url;
  }
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

  const { data: liveData } = await supabase
    .from("agri_asset_live_cameras")
    .select("*")
    .eq("asset_id", asset.id)
    .eq("is_active", true)
    .maybeSingle();

  const liveCamera = (liveData || null) as LiveCamera | null;

  const files = (filesData || []) as AssetFile[];
  const photos = files.filter((x) => x.file_type === "photo");
  const videos = files.filter((x) => x.file_type === "video");
  const documents = files.filter((x) => x.file_type === "document");

  const memo = String(asset.memo || "");
  const youtubeUrl = memo.match(/유튜브:\s*(https?:\/\/[^\s/]+[^\s]*)/)?.[1] || "";
  const youtubeId = getYoutubeId(youtubeUrl);

  const { data: buyersData } = await supabase
    .from("agri_buyers")
    .select("*")
    .order("ai_score", { ascending: false })
    .limit(20);

  const buyers = (buyersData || []) as any[];

  const productKeyword = String(asset.product_name || "").trim();

  const recommendedBuyers = buyers
    .map((buyer) => {
      const interest = String(buyer.interest_products || "");
      const type = String(buyer.buyer_type || "");
      let matchScore = n(buyer.ai_score);

      if (productKeyword && interest.includes(productKeyword)) matchScore += 20;
      if (productKeyword.includes("마늘") && (interest.includes("마늘") || type.includes("kimchi") || type.includes("food"))) matchScore += 15;
      if (productKeyword.includes("양파") && interest.includes("양파")) matchScore += 15;

      return { ...buyer, matchScore };
    })
    .sort((a, b) => n(b.matchScore) - n(a.matchScore))
    .slice(0, 5);

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
            <Link
              href={
                `/admin/agri-assets/${asset.id}/create-offer` +
                `?product_name=${encodeURIComponent(asset.product_name || "")}` +
                `&variety_name=${encodeURIComponent(asset.variety_name || "")}` +
                `&producer_region=${encodeURIComponent(asset.producer_region || "")}` +
                `&size_spec=${encodeURIComponent(asset.size_spec || asset.main_grade || "")}` +
                `&offer_quantity=${encodeURIComponent(String(asset.total_quantity || ""))}` +
                `&offer_price=${encodeURIComponent(String(asset.expected_price || ""))}` +
                `&unit=${encodeURIComponent(String(asset.unit || "톤"))}` +
                `&price_unit=${encodeURIComponent("kg")}`
              }
              className="rounded bg-black px-4 py-3 text-sm font-black text-white no-underline"
            >
              거래제안 생성
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

        <LiveStorageBox asset={asset} liveCamera={liveCamera} />


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

        <RecommendedBuyerBox asset={asset} buyers={recommendedBuyers} />

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


function RecommendedBuyerBox({ asset, buyers }: { asset: any; buyers: any[] }) {
  return (
    <section className="mb-3 border-2 border-green-700 bg-white">
      <div className="flex items-center justify-between border-b bg-green-50 px-3 py-3">
        <div>
          <div className="text-xs font-black text-green-700">K-AGRI AI BUYER MATCHING</div>
          <h2 className="text-2xl font-black">추천 바이어</h2>
        </div>

        <a
          href="/admin/buyers"
          className="rounded bg-black px-4 py-3 text-sm font-black text-white no-underline"
        >
          바이어센터
        </a>
      </div>

      {buyers.length === 0 ? (
        <div className="p-6 text-center font-black text-neutral-500">
          추천 가능한 바이어가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-200">
                <th className="border px-3 py-2 text-left">순위</th>
                <th className="border px-3 py-2 text-left">회사명</th>
                <th className="border px-3 py-2 text-left">구분</th>
                <th className="border px-3 py-2 text-left">지역</th>
                <th className="border px-3 py-2 text-left">관심품목</th>
                <th className="border px-3 py-2 text-left">월 구매량</th>
                <th className="border px-3 py-2 text-left">예상구매액</th>
                <th className="border px-3 py-2 text-left">AI점수</th>
                <th className="border px-3 py-2 text-left">매칭점수</th>
                <th className="border px-3 py-2 text-left">관리</th>
              </tr>
            </thead>

            <tbody>
              {buyers.map((buyer, i) => {
                const href =
                  `/admin/agri-assets/${asset.id}/create-offer` +
                  `?buyer_id=${encodeURIComponent(buyer.id || "")}` +
                  `&buyer_grade=${encodeURIComponent(buyer.buyer_grade || "")}` +
                  `&verified_by=${encodeURIComponent(buyer.verified_by || "")}` +
                  `&buyer_company_name=${encodeURIComponent(buyer.company_name || "")}` +
                  `&buyer_contact_name=${encodeURIComponent(buyer.contact_name || "")}` +
                  `&buyer_phone=${encodeURIComponent(buyer.phone || "")}` +
                  `&product_name=${encodeURIComponent(asset.product_name || "")}` +
                  `&variety_name=${encodeURIComponent(asset.variety_name || "")}` +
                  `&producer_region=${encodeURIComponent(asset.producer_region || "")}` +
                  `&size_spec=${encodeURIComponent(asset.size_spec || asset.main_grade || "")}` +
                  `&offer_quantity=${encodeURIComponent(String(asset.total_quantity || ""))}` +
                  `&offer_price=${encodeURIComponent(String(asset.expected_price || ""))}` +
                  `&unit=${encodeURIComponent(String(asset.unit || "톤"))}` +
                  `&price_unit=${encodeURIComponent("kg")}`;

                return (
                  <tr key={buyer.id} className="hover:bg-green-50">
                    <td className="border px-3 py-2 font-black">{i + 1}</td>
                    <td className="border px-3 py-2 font-black">{buyer.company_name || "-"}</td>
                    <td className="border px-3 py-2 font-bold">{buyer.buyer_type || "-"}</td>
                    <td className="border px-3 py-2 font-bold">{buyer.region || "-"}</td>
                    <td className="border px-3 py-2 font-bold">{buyer.interest_products || "-"}</td>
                    <td className="border px-3 py-2 font-bold">{n(buyer.monthly_purchase_qty).toLocaleString()}</td>
                    <td className="border px-3 py-2 font-black">{won(buyer.expected_purchase_amount)}</td>
                    <td className="border px-3 py-2 font-black text-green-700">{n(buyer.ai_score)}</td>
                    <td className="border px-3 py-2 font-black text-blue-700">{n(buyer.matchScore)}</td>
                    <td className="border px-3 py-2">
                      <a
                        href={href}
                        className="rounded bg-green-700 px-3 py-2 text-xs font-black text-white no-underline"
                      >
                        거래제안 생성
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
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


function LiveStorageBox({
  asset,
  liveCamera,
}: {
  asset: any;
  liveCamera: LiveCamera | null;
}) {
  const isLive = !!liveCamera?.live_url;

  return (
    <section className="mb-3 border-2 border-red-600 bg-white">
      <div className="flex flex-col gap-3 border-b bg-red-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-black text-red-700">K-AGRI LIVE STORAGE CERTIFICATION</div>
          <h2 className="mt-1 text-2xl font-black">
            🔴 LIVE 창고인증
          </h2>
          <p className="mt-1 text-sm font-bold text-neutral-700">
            바이어가 사진이 아니라 실시간 보관 상태를 확인하는 농산물 자산입니다.
          </p>
        </div>

        <div className="flex gap-2">
          {isLive ? (
            <a
              href={safeFileUrl(liveCamera?.live_url)}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-red-600 px-5 py-3 text-sm font-black text-white no-underline"
            >
              🔴 LIVE 보기
            </a>
          ) : (
            <span className="rounded bg-neutral-300 px-5 py-3 text-sm font-black text-neutral-700">
              LIVE 미연동
            </span>
          )}
          <a
            href={`/admin/agri-assets/${asset.id}/live-storage`}
            className="rounded bg-black px-5 py-3 text-sm font-black text-white no-underline"
          >
            CCTV 연결 관리
          </a>
        </div>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-4">
        <div className="rounded border bg-neutral-50 p-3">
          <div className="text-xs font-black text-neutral-500">인증상태</div>
          <div className={`mt-1 text-xl font-black ${isLive ? "text-red-600" : "text-neutral-500"}`}>
            {isLive ? "LIVE 인증중" : "연동 대기"}
          </div>
        </div>

        <div className="rounded border bg-neutral-50 p-3">
          <div className="text-xs font-black text-neutral-500">현재온도</div>
          <div className="mt-1 text-xl font-black">
            {liveCamera?.temperature != null ? `${liveCamera.temperature}℃` : "미수집"}
          </div>
        </div>

        <div className="rounded border bg-neutral-50 p-3">
          <div className="text-xs font-black text-neutral-500">현재습도</div>
          <div className="mt-1 text-xl font-black">
            {liveCamera?.humidity != null ? `${liveCamera.humidity}%` : "미수집"}
          </div>
        </div>

        <div className="rounded border bg-neutral-50 p-3">
          <div className="text-xs font-black text-neutral-500">최종확인</div>
          <div className="mt-1 text-sm font-black">
            {liveCamera?.last_checked_at || "확인 전"}
          </div>
        </div>
      </div>

      <div className="border-t bg-neutral-950 p-4 text-white">
        {isLive ? (
          <div className="aspect-video w-full overflow-hidden bg-black">
            <iframe
              src={safeFileUrl(liveCamera?.live_url)}
              className="h-full w-full"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center rounded border border-dashed border-neutral-600 text-center">
            <div>
              <div className="text-3xl">📹</div>
              <div className="mt-3 text-xl font-black">저온창고 CCTV 미연동</div>
              <div className="mt-2 text-sm font-bold text-neutral-300">
                농민 동의 후 CCTV/NVR/RTSP/공개 스트림 URL을 연결하면 바이어용 LIVE 인증이 활성화됩니다.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
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
            <a key={photo.id} href={safeFileUrl(photo.file_url)} target="_blank" rel="noreferrer" className="block overflow-hidden border bg-neutral-50">
              <img src={safeFileUrl(photo.file_url)} alt={photo.file_name || "photo"} className="h-32 w-full object-cover" />
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
            className="aspect-video w-full border bg-black"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube video"
            allowFullScreen
          />
        ) : youtubeUrl ? (
          <a href={youtubeUrl} target="_blank" rel="noreferrer" className="block border bg-neutral-50 p-3 text-sm font-black text-blue-700">
            유튜브 링크 열기
          </a>
        ) : null}

        {videos.map((video) => (
          <video key={video.id} controls className="aspect-video w-full border bg-black">
            <source src={safeFileUrl(video.file_url)} />
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
      <h2 className="border-b bg-neutral-100 px-3 py-2 text-lg font-black">
        {title} ({documents.length}개)
      </h2>

      {documents.length === 0 ? (
        <div className="p-4 text-sm font-black text-neutral-500">등록된 성적서가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={safeFileUrl(doc.file_url)}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden border bg-white no-underline"
            >
              <img
                src={safeFileUrl(doc.file_url)}
                alt={doc.file_name || "document"}
                className="h-40 w-full object-cover bg-white"
              />
              <div className="truncate border-t px-2 py-1 text-xs font-bold text-black">
                {doc.file_name || "성적서 보기"}
              </div>
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
