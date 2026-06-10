"use client";

import Link from "next/link";
import { useState } from "react";

type AiResult = {
  conversion_score?: number;
  sales_type?: string;
  hero_headline?: string;
  hero_subheadline?: string;
  farmer_problem?: string;
  target_farmer?: string;
  selling_points?: string[];
  image_prompts?: string[];
};

type YoutubeResult = {
  video_id?: string;
  youtube_url?: string;
  thumbnail_url?: string;
  summary?: string;
  farmer_problem_candidates?: string[];
  headline_candidates?: string[];
  page_sections?: string[];
  image_prompts?: string[];
  short_video_plan?: string[];
};

export const dynamic = "force-dynamic";

export default function AISalesCenterPage() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [homepageUrl, setHomepageUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoUrls, setVideoUrls] = useState("");

  const [regularPrice, setRegularPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [groupBuyPrice, setGroupBuyPrice] = useState("");
  const [shippingFee, setShippingFee] = useState("0원");
  const [unitLabel, setUnitLabel] = useState("");
  const [salesType, setSalesType] = useState("general_sale");
  const [bankName, setBankName] = useState("기업은행");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");

  const [loading, setLoading] = useState(false);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [youtubeResult, setYoutubeResult] = useState<YoutubeResult | null>(null);
  const [error, setError] = useState("");

  const displayVideoList = videoUrls
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

  async function handleYoutubeAnalyze() {
    setError("");
    setYoutubeResult(null);

    if (!youtubeUrl.trim()) {
      alert("분석용 유튜브 URL을 입력해주세요.");
      return;
    }

    try {
      setYoutubeLoading(true);

      const res = await fetch("/api/ai/youtube-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: youtubeUrl }),
      });

      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "유튜브 분석 실패");

      setYoutubeResult(data.result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "유튜브 분석 중 오류가 발생했습니다.");
    } finally {
      setYoutubeLoading(false);
    }
  }

  async function handleAnalyze() {
    setError("");
    setAiResult(null);

    if (!productName.trim()) {
      alert("제품명을 입력해주세요.");
      return;
    }

    if (!salePrice.trim() && !groupBuyPrice.trim()) {
      alert("판매가 또는 공동구매가를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/ai/product-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          category,
          homepage_url: homepageUrl,
          youtube_url: youtubeUrl,
          youtube_result: youtubeResult,
          video_urls: displayVideoList,

          regular_price: onlyNumber(regularPrice),
          sale_price: onlyNumber(salePrice),
          group_buy_price: onlyNumber(groupBuyPrice),
          shipping_fee: onlyNumber(shippingFee),
          unit_label: unitLabel,
          sales_type: salesType,
          bank_name: bankName,
          bank_account: bankAccount,
          bank_holder: bankHolder,
        }),
      });

      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "AI 분석 실패");

      setAiResult(data.ai_result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "AI 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-stone-950">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl bg-gradient-to-r from-green-900 via-green-800 to-green-600 p-8 text-white shadow-2xl">
          <p className="text-lg font-black text-green-100">K-Agri Expo</p>
          <h1 className="mt-3 text-5xl font-black leading-tight">
            AI 판매페이지 생성센터
          </h1>
          <p className="mt-4 text-2xl font-black leading-relaxed text-white">
            사진, PDF, 홈페이지, 유튜브 영상까지 분석해 농민 설득형 판매페이지를 자동 생성합니다.
          </p>
          <p className="mt-3 text-xl font-bold text-green-100">
            제품 등록이 아니라, 농민이 사고 싶게 만드는 광고형 구매페이지를 만듭니다.
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 text-stone-950 shadow-xl ring-1 ring-black/5">
          <p className="text-lg font-black text-green-700">STEP 01</p>
          <h2 className="mt-2 text-4xl font-black">제품 기본정보</h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Field label="제품명">
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className={inputClass}
                placeholder="예: 싹쓰리충, K-Plus, MSM 관절 부스터"
              />
            </Field>

            <Field label="카테고리">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                <option value="">카테고리를 선택하세요</option>
                <option value="농자재">농자재</option>
                <option value="종자·육묘">종자·육묘</option>
                <option value="농기계·장비">농기계·장비</option>
                <option value="건강식품">건강식품</option>
                <option value="미래식량·곤충">미래식량·곤충</option>
                <option value="상담형 상품">상담형 상품</option>
              </select>
            </Field>

            <Field label="홈페이지 URL">
              <input
                value={homepageUrl}
                onChange={(e) => setHomepageUrl(e.target.value)}
                className={inputClass}
                placeholder="https://example.com"
              />
            </Field>

            <Field label="분석용 유튜브 URL">
              <div className="grid gap-3">
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className={inputClass}
                  placeholder="AI가 분석할 대표 유튜브 영상 1개"
                />

                <button
                  type="button"
                  onClick={handleYoutubeAnalyze}
                  disabled={youtubeLoading}
                  className="rounded-2xl bg-red-600 px-5 py-5 text-xl font-black text-white disabled:bg-stone-400"
                >
                  {youtubeLoading ? "유튜브 분석중..." : "유튜브 영상 분석하기"}
                </button>
              </div>
            </Field>
          </div>

          <section className="mt-6 rounded-3xl bg-red-50 p-6 ring-1 ring-red-100">
            <p className="text-lg font-black text-red-700">유튜브 영상 노출</p>
            <h3 className="mt-2 text-3xl font-black text-stone-950">
              상세페이지에 보여줄 유튜브 링크
            </h3>
            <p className="mt-3 text-xl font-bold text-stone-700">
              분석용 영상과 별도로, 제품 상세페이지에 노출할 영상을 여러 개 넣을 수 있습니다.
            </p>

            <textarea
              value={videoUrls}
              onChange={(e) => setVideoUrls(e.target.value)}
              className={textareaClass}
              rows={5}
              placeholder={`줄마다 유튜브 링크를 입력하세요.
예:
https://youtube.com/watch?v=...
https://youtube.com/shorts/...`}
            />

            {displayVideoList.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {displayVideoList.map((url, index) => (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-white px-5 py-4 text-lg font-black text-stone-900 ring-1 ring-red-100"
                  >
                    영상 {index + 1} 보기: {url}
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          {youtubeResult ? (
            <section className="mt-6 rounded-3xl bg-red-50 p-6 ring-1 ring-red-100">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-red-700">
                    유튜브 영상 분석 결과
                  </p>
                  <h3 className="mt-2 text-3xl font-black text-stone-950">
                    영상도 판매페이지 재료로 사용합니다
                  </h3>
                </div>

                <a
                  href={youtubeResult.youtube_url || youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-red-600 px-5 py-4 text-lg font-black text-white"
                >
                  유튜브 영상 보기
                </a>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-[320px_1fr]">
                <a
                  href={youtubeResult.youtube_url || youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-3xl bg-black shadow"
                >
                  {youtubeResult.thumbnail_url ? (
                    <img
                      src={youtubeResult.thumbnail_url}
                      alt="유튜브 영상 썸네일"
                      className="w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center text-xl font-black text-white">
                      영상 썸네일
                    </div>
                  )}
                </a>

                <div className="grid gap-4">
                  <div className="rounded-2xl bg-white p-5 ring-1 ring-red-100">
                    <p className="text-xl font-black text-stone-950">분석 요약</p>
                    <p className="mt-2 text-lg font-bold leading-relaxed text-stone-700">
                      {youtubeResult.summary}
                    </p>
                  </div>

                  <MiniList
                    title="영상 기반 헤드라인 후보"
                    items={youtubeResult.headline_candidates || []}
                  />

                  <MiniList
                    title="상세페이지 섹션 후보"
                    items={youtubeResult.page_sections || []}
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-8 rounded-3xl bg-yellow-50 p-6 ring-1 ring-yellow-200">
            <p className="text-lg font-black text-yellow-800">STEP 02</p>
            <h2 className="mt-2 text-4xl font-black text-stone-950">
              가격 · 판매방식
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="정가">
                <input
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(formatPriceInput(e.target.value))}
                  className={inputClass}
                  placeholder="예: 75,000원"
                  inputMode="numeric"
                />
              </Field>

              <Field label="판매가">
                <input
                  value={salePrice}
                  onChange={(e) => setSalePrice(formatPriceInput(e.target.value))}
                  className={inputClass}
                  placeholder="예: 49,900원"
                  inputMode="numeric"
                />
              </Field>

              <Field label="공동구매가">
                <input
                  value={groupBuyPrice}
                  onChange={(e) => setGroupBuyPrice(formatPriceInput(e.target.value))}
                  className={inputClass}
                  placeholder="예: 49,900원"
                  inputMode="numeric"
                />
              </Field>

              <Field label="배송비">
                <input
                  value={shippingFee}
                  onChange={(e) => setShippingFee(formatPriceInput(e.target.value))}
                  className={inputClass}
                  placeholder="예: 3,000원 / 무료배송은 0원"
                  inputMode="numeric"
                />
              </Field>

              <Field label="판매단위">
                <input
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                  className={inputClass}
                  placeholder="예: 1병, 1포, 1박스, 20kg"
                />
              </Field>

              <Field label="판매방식">
                <select
                  value={salesType}
                  onChange={(e) => setSalesType(e.target.value)}
                  className={inputClass}
                >
                  <option value="general_sale">일반판매</option>
                  <option value="group_buy">공동구매</option>
                  <option value="sample">샘플신청</option>
                  <option value="live">라이브판매</option>
                  <option value="consulting">상담형 판매</option>
                </select>
              </Field>
            </div>

            <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-yellow-200">
              <p className="text-xl font-black text-stone-950">가격 미리보기</p>
              <div className="mt-3 grid gap-2 text-lg font-black text-stone-800">
                <p>정가: {regularPrice || "-"}</p>
                <p>판매가: {salePrice || "-"}</p>
                <p>공동구매가: {groupBuyPrice || "-"}</p>
                <p>배송비: {shippingFee || "-"}</p>
                <p>판매단위: {unitLabel || "-"}</p>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-3xl bg-blue-50 p-6 ring-1 ring-blue-100">
            <p className="text-lg font-black text-blue-800">STEP 03</p>
            <h2 className="mt-2 text-4xl font-black text-stone-950">
              입금계좌
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <Field label="은행명">
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className={inputClass}
                  placeholder="예: 기업은행"
                />
              </Field>

              <Field label="계좌번호">
                <input
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className={inputClass}
                  placeholder="예: 486-072683-04-011"
                />
              </Field>

              <Field label="예금주">
                <input
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  className={inputClass}
                  placeholder="예: 한국농수산TV"
                />
              </Field>
            </div>
          </section>

          <div className="mt-6 grid gap-5">
            <UploadBox
              title="제품 사진 업로드"
              desc="제품 사진, 포장 사진, 사용 장면 사진을 올립니다."
              note="다음 단계에서 Supabase Storage와 연결합니다."
            />

            <UploadBox
              title="PDF 파일 업로드"
              desc="카탈로그, 리플렛, 설명서, 시험성적서를 업로드합니다."
              note="다음 단계에서 PDF 텍스트 추출과 AI 분석을 연결합니다."
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-8 w-full rounded-3xl bg-green-700 py-6 text-3xl font-black text-white shadow-lg disabled:bg-stone-400"
          >
            {loading ? "AI 분석중..." : "AI 판매페이지 만들기"}
          </button>

          {error ? (
            <div className="mt-5 rounded-2xl bg-red-50 p-5 text-xl font-black text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 text-stone-950 shadow-xl ring-1 ring-black/5">
          <p className="text-lg font-black text-green-700">STEP 04</p>
          <h2 className="mt-2 text-4xl font-black">AI 생성 결과</h2>

          {aiResult ? (
            <>
              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                <ResultCard
                  label="전환율 예측"
                  value={`${aiResult.conversion_score || 0}점`}
                  desc="농민 구매 전환 가능성"
                  colorClass="bg-green-50 text-green-800"
                />

                <ResultCard
                  label="추천 판매방식"
                  value={aiResult.sales_type || salesType}
                  desc="일반판매/공동구매/상담형 추천"
                  colorClass="bg-yellow-50 text-yellow-800"
                />

                <ResultCard
                  label="타깃 농민"
                  value={aiResult.target_farmer || "농민"}
                  desc="이 제품에 반응할 가능성이 높은 고객"
                  colorClass="bg-blue-50 text-blue-800"
                />
              </div>

              <div className="mt-6 rounded-3xl bg-stone-50 p-6 ring-1 ring-black/5">
                <p className="text-lg font-black text-stone-500">추천 헤드라인</p>
                <h3 className="mt-3 text-3xl font-black leading-tight text-stone-950">
                  {aiResult.hero_headline}
                </h3>
                <p className="mt-3 text-xl font-bold leading-relaxed text-stone-700">
                  {aiResult.hero_subheadline}
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <AiOutputCard title="농민 문제 분석" items={[aiResult.farmer_problem || ""]} />
                <AiOutputCard title="판매 포인트" items={aiResult.selling_points || []} />
                <AiOutputCard title="이미지 생성 프롬프트" items={aiResult.image_prompts || []} />
                <AiOutputCard
                  title="상세페이지 노출 영상"
                  items={displayVideoList.length ? displayVideoList : ["등록된 노출용 영상 없음"]}
                />
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-3xl bg-stone-50 p-8 text-center ring-1 ring-black/5">
              <p className="text-2xl font-black text-stone-700">
                제품명과 가격을 입력하고 AI 판매페이지 만들기를 누르면 분석 결과가 표시됩니다.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-5">
          <NavCard href="/vendor/ai-sales/products" icon="📦" title="제품 관리" desc="등록한 제품 목록 조회" />
          <NavCard href="/admin/ai-sales-center" icon="📄" title="AI 상세페이지" desc="생성된 페이지 검수" />
          <NavCard href="/admin/ai-sales-center" icon="🖼️" title="AI 이미지" desc="생성 이미지 보기" />
          <NavCard href="/admin/ai-sales-center" icon="🎬" title="AI 쇼츠/영상" desc="생성 영상 보기" />
          <NavCard href="/admin/ai-sales-center" icon="⚙️" title="관리자 센터" desc="승인 및 운영 관리" />
        </section>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-950 outline-none placeholder:text-stone-400 focus:border-green-700";

const textareaClass =
  "mt-5 w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-950 outline-none placeholder:text-stone-400 focus:border-red-600";

function onlyNumber(v: string) {
  const n = Number(String(v || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatPriceInput(v: string) {
  const n = String(v || "").replace(/[^0-9]/g, "");
  if (!n) return "";
  return `${Number(n).toLocaleString("ko-KR")}원`;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-xl font-black text-stone-900">
        {label}
      </span>
      {children}
    </label>
  );
}

function UploadBox({
  title,
  desc,
  note,
}: {
  title: string;
  desc: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center">
      <p className="text-2xl font-black text-stone-950">{title}</p>
      <p className="mt-3 text-xl font-bold text-stone-700">{desc}</p>
      <p className="mt-2 text-lg font-bold text-stone-500">{note}</p>
      <input
        type="file"
        multiple
        className="mt-5 w-full rounded-2xl bg-white p-4 text-lg font-bold text-stone-900 ring-1 ring-black/10"
      />
    </div>
  );
}

function ResultCard({
  label,
  value,
  desc,
  colorClass,
}: {
  label: string;
  value: string;
  desc: string;
  colorClass: string;
}) {
  return (
    <div className={`rounded-3xl p-6 ${colorClass}`}>
      <p className="text-lg font-black opacity-80">{label}</p>
      <p className="mt-2 text-4xl font-black leading-tight">{value}</p>
      <p className="mt-3 text-lg font-bold opacity-90">{desc}</p>
    </div>
  );
}

function AiOutputCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h3 className="text-2xl font-black text-stone-950">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.filter(Boolean).map((item) => (
          <div
            key={item}
            className="rounded-2xl bg-stone-50 px-4 py-3 text-lg font-black text-stone-800"
          >
            ✓ {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-red-100">
      <p className="text-xl font-black text-stone-950">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.filter(Boolean).map((item) => (
          <div
            key={item}
            className="rounded-xl bg-red-50 px-4 py-3 text-base font-black text-stone-800"
          >
            ✓ {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl bg-white p-6 text-stone-950 shadow-xl ring-1 ring-black/5"
    >
      <div className="text-4xl">{icon}</div>
      <p className="mt-3 text-xl font-black text-stone-950">{title}</p>
      <p className="mt-2 text-base font-bold text-stone-600">{desc}</p>
    </Link>
  );
}