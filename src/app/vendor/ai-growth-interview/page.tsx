/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  product_name?: string | null;
  category?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  catalog_url?: string | null;
  manual_url?: string | null;
  is_active?: boolean | null;
};

type GrowthFile = {
  id: string;
  product_id: string;
  file_type: string;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
};

type FormState = {
  product_id: string;
  youtube_urls: string;
  farmer_problem: string;
  competitor_advantage: string;
  success_case: string;
  has_before_after: boolean;
  has_test_data: boolean;
  has_farmer_interview: boolean;
  weak_point: string;
};

type AnalysisItem = {
  title?: string;
  detail?: string;
  reason?: string;
  source_type?: string;
};

type AiAnalysis = {
  summary?: string;
  material_score?: number;
  trust_score?: number;
  farmer_purchase_score?: number;
  ingredient_strengths?: AnalysisItem[];
  evidence_found?: AnalysisItem[];
  missing_evidence?: AnalysisItem[];
  farmer_selling_points?: string[];
  recommended_questions?: string[];
  kafs_tv_strategy?: string[];
  final_comment?: string;
};

const DEFAULT_BRAND_SLUG = "dof-eagle-five";

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  basic: 10,
  pro: 30,
  premium: 100,
  vip: 999,
};

const emptyForm: FormState = {
  product_id: "",
  youtube_urls: "",
  farmer_problem: "",
  competitor_advantage: "",
  success_case: "",
  has_before_after: false,
  has_test_data: false,
  has_farmer_interview: false,
  weak_point: "",
};

const inputClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-950 outline-none focus:border-green-700";

const textareaClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-950 outline-none placeholder:text-stone-400 focus:border-green-700";

function getFileNameFromUrl(url: string) {
  try {
    const clean = url.split("?")[0] || "";
    const parts = clean.split("/");
    const last = parts[parts.length - 1] || "업로드 자료";
    return decodeURIComponent(last);
  } catch {
    return "업로드 자료";
  }
}

function isPdfFile(file: GrowthFile) {
  const url = String(file.file_url || "").toLowerCase();
  const mime = String(file.mime_type || "").toLowerCase();
  const name = String(file.file_name || "").toLowerCase();

  return mime.includes("pdf") || url.includes(".pdf") || name.endsWith(".pdf");
}

function isImageFile(file: GrowthFile) {
  const url = String(file.file_url || "").toLowerCase();
  const mime = String(file.mime_type || "").toLowerCase();
  const name = String(file.file_name || "").toLowerCase();

  return (
    mime.startsWith("image/") ||
    [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif", ".bmp"].some(
      (x) => url.includes(x) || name.endsWith(x),
    )
  );
}

function fileTypeLabel(type: string) {
  switch (type) {
    case "label":
      return "제품 라벨";
    case "catalog":
      return "카탈로그";
    case "organic_cert":
      return "공시·등록자료";
    case "test_report":
      return "시험성적서";
    case "before_after":
      return "전후사진·후기";
    case "patent":
      return "특허자료";
    default:
      return "기타자료";
  }
}

function scoreText(score?: number) {
  const n = Number(score || 0);
  if (n >= 80) return "좋음";
  if (n >= 60) return "보통";
  if (n > 0) return "보완필요";
  return "분석중";
}

function splitYoutubeUrls(v: string) {
  return v
    .split(/\n|,/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function VendorAiGrowthInterviewPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [files, setFiles] = useState<GrowthFile[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState("");

  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);
  const [firstAnalysis, setFirstAnalysis] = useState<AiAnalysis | null>(null);
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, string>>({});

  const vendorPlan = "free";
  const maxFiles = PLAN_LIMITS[vendorPlan] || PLAN_LIMITS.free;

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.product_id) || null,
    [products, form.product_id],
  );

  const youtubeCount = useMemo(
    () => splitYoutubeUrls(form.youtube_urls).length,
    [form.youtube_urls],
  );

  const evidenceCount = files.length + (youtubeCount > 0 ? 1 : 0);

  const labelFiles = files.filter((file) => file.file_type === "label");
  const catalogFiles = files.filter((file) => file.file_type === "catalog");
  const organicFiles = files.filter((file) => file.file_type === "organic_cert");
  const testFiles = files.filter((file) => file.file_type === "test_report");
  const beforeAfterFiles = files.filter((file) => file.file_type === "before_after");

  const hasAnyCoreData = evidenceCount > 0;

  const aiQuestions = useMemo(() => {
    const list = firstAnalysis?.recommended_questions || [];
    return list.filter((q) => String(q || "").trim());
  }, [firstAnalysis]);

  async function loadProducts() {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/vendor/brand-hall?brand_slug=${DEFAULT_BRAND_SLUG}`,
        { cache: "no-store" },
      );

      const json = await res.json();
      const list = (json.products || []) as Product[];

      setProducts(list);

      if (list.length > 0) {
        const first = list[0];

        setForm((prev) => ({
          ...prev,
          product_id: prev.product_id || first.id,
        }));

        await loadFiles(first.id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadFiles(productId: string) {
    if (!productId) return;

    setFilesLoading(true);

    try {
      const res = await fetch(
        `/api/vendor/ai-growth-files?product_id=${encodeURIComponent(productId)}`,
        { cache: "no-store" },
      );

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "업로드 자료를 불러오지 못했습니다.");
        setFiles([]);
        return;
      }

      setFiles(json.files || []);
    } finally {
      setFilesLoading(false);
    }
  }

  function resetAnalysis() {
    setAnalysisStarted(false);
    setAnalyzing(false);
    setAnalysisDone(false);
    setShowFollowup(false);
    setFirstAnalysis(null);
    setDynamicAnswers({});
  }

  async function uploadFile(file: File, fileType: string) {
    if (!form.product_id) {
      alert("먼저 제품을 선택하세요.");
      return;
    }

    if (files.length >= maxFiles) {
      alert(`현재 등급(${vendorPlan})은 제품당 자료 ${maxFiles}개까지 업로드할 수 있습니다.`);
      return;
    }

    setUploadingType(fileType);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append(
        "asset_type",
        fileType === "label" ? "product" : fileType === "catalog" ? "catalog" : "manual",
      );
      data.append("brand_slug", DEFAULT_BRAND_SLUG);

      const uploadRes = await fetch("/api/vendor/brand-assets/upload", {
        method: "POST",
        body: data,
      });

      const uploadJson = await uploadRes.json();

      if (!uploadJson.ok) {
        alert(uploadJson.error || "파일 업로드 실패");
        return;
      }

      const publicUrl = String(uploadJson.public_url || "");

      if (!publicUrl) {
        alert("업로드 URL을 받지 못했습니다.");
        return;
      }

      const saveRes = await fetch("/api/vendor/ai-growth-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: form.product_id,
          file_type: fileType,
          file_url: publicUrl,
          file_name: file.name || getFileNameFromUrl(publicUrl),
          mime_type: file.type || "",
          file_size: file.size || 0,
        }),
      });

      const saveJson = await saveRes.json();

      if (!saveJson.ok) {
        alert(saveJson.error || "자료 저장 실패");
        return;
      }

      resetAnalysis();
      await loadFiles(form.product_id);
    } finally {
      setUploadingType("");
    }
  }

  async function deleteFile(fileId: string) {
    if (!confirm("이 자료를 삭제할까요?")) return;

    const res = await fetch(`/api/vendor/ai-growth-files?id=${encodeURIComponent(fileId)}`, {
      method: "DELETE",
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "삭제 실패");
      return;
    }

    resetAnalysis();
    await loadFiles(form.product_id);
  }

  async function startFirstAnalysis() {
    if (!hasAnyCoreData) {
      alert("제품 자료를 하나 이상 올리거나 유튜브 링크를 입력하세요.");
      return;
    }

    setAnalysisStarted(true);
    setAnalyzing(true);
    setAnalysisDone(false);
    setShowFollowup(false);
    setFirstAnalysis(null);
    setDynamicAnswers({});

    try {
      const res = await fetch("/api/vendor/ai-growth-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "first_analysis",
          product_id: form.product_id,
          youtube_urls: splitYoutubeUrls(form.youtube_urls),
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "1차 AI 분석 실패");
        return;
      }

      setFirstAnalysis(json.analysis || null);
      setAnalysisDone(true);

      window.setTimeout(() => {
        document
          .getElementById("ai-analysis-result-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveInterview() {
    if (!form.product_id) {
      alert("진단할 제품을 선택하세요.");
      return;
    }

    if (evidenceCount === 0) {
      alert("제품 라벨, 카탈로그, 공시자료, 시험성적서, 영상 중 하나 이상은 등록해야 합니다.");
      return;
    }

    try {
      setSaving(true);

      const hasBeforeAfter =
        form.has_before_after || files.some((file) => file.file_type === "before_after");

      const hasTestData =
        form.has_test_data ||
        files.some((file) => ["test_report", "organic_cert", "patent"].includes(file.file_type));

      const dynamicFollowupAnswers = aiQuestions.map((question, index) => ({
        question,
        answer: dynamicAnswers[String(index)] || "",
      }));

      const res = await fetch("/api/vendor/ai-growth-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: form.product_id,
          youtube_urls: splitYoutubeUrls(form.youtube_urls),
          farmer_problem: form.farmer_problem,
          competitor_advantage: form.competitor_advantage,
          success_case: form.success_case,
          has_before_after: hasBeforeAfter,
          has_test_data: hasTestData,
          has_farmer_interview: form.has_farmer_interview,
          weak_point: form.weak_point,
          uploaded_file_count: files.length,
          youtube_count: youtubeCount,
          file_types: files.map((file) => file.file_type),
          ai_first_analysis: firstAnalysis,
          dynamic_followup_answers: dynamicFollowupAnswers,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "저장 실패");
        return;
      }

      alert("AI 제품 성장진단 자료 저장 완료");
      location.href = `/vendor/ai-growth-report/${form.product_id}`;
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5 text-stone-950">
      <section className="mx-auto max-w-6xl">
        <Link
          href="/vendor/brand-hall"
          className="inline-flex rounded-2xl bg-white px-4 py-3 text-base font-black text-stone-900 ring-1 ring-black/10"
        >
          ← 업체 운영센터로 돌아가기
        </Link>

        <section className="mt-4 rounded-[32px] bg-stone-950 p-6 text-white">
          <p className="text-sm font-black text-yellow-300">
            K-Agri Expo AI 제품 성장센터
          </p>
          <h1 className="mt-2 text-3xl font-black">AI 제품 성장진단</h1>
          <p className="mt-3 text-lg font-bold leading-relaxed text-stone-200">
            제품 자료를 올리면 AI가 실제 카탈로그, 이미지, PDF 내용을 읽고 1차 분석한 뒤
            그 제품에 맞는 2차 질문을 자동으로 만듭니다.
          </p>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-black text-stone-950">진단할 제품</h2>

            {loading ? (
              <div className="mt-5 rounded-2xl bg-stone-50 p-6 text-lg font-black text-stone-500">
                제품을 불러오는 중...
              </div>
            ) : products.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-stone-50 p-6 text-lg font-black text-stone-500">
                등록된 제품이 없습니다.
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                <select
                  value={form.product_id}
                  onChange={async (e) => {
                    const productId = e.target.value;
                    setForm((prev) => ({ ...prev, product_id: productId }));
                    resetAnalysis();
                    await loadFiles(productId);
                  }}
                  className={inputClass}
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product_name || "제품명 없음"}
                    </option>
                  ))}
                </select>

                {selectedProduct ? (
                  <div className="rounded-3xl bg-stone-50 p-4 ring-1 ring-black/5">
                    <div className="flex h-48 items-center justify-center rounded-2xl bg-white">
                      {selectedProduct.image_url ? (
                        <img
                          src={selectedProduct.image_url}
                          alt={selectedProduct.product_name || "제품 이미지"}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <span className="text-base font-black text-stone-400">
                          제품 이미지
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-sm font-black text-green-700">
                      {selectedProduct.category || "제품"}
                    </p>

                    <h3 className="mt-1 text-2xl font-black text-stone-950">
                      {selectedProduct.product_name || "제품명 없음"}
                    </h3>

                    <p className="mt-2 text-base font-bold leading-7 text-stone-600">
                      {selectedProduct.short_description || "설명 준비중"}
                    </p>

                    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/10">
                      <p className="text-sm font-black text-stone-500">현재 등급</p>
                      <p className="mt-1 text-xl font-black text-stone-950">
                        {vendorPlan.toUpperCase()} · 자료 {files.length}/{maxFiles}개
                      </p>
                    </div>

                    <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-black/10">
                      <p className="text-sm font-black text-stone-500">진단자료</p>
                      <p className="mt-1 text-2xl font-black text-green-700">
                        {evidenceCount}개
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </aside>

          <section className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-black text-stone-950">
              1단계. 제품 자료 업로드
            </h2>

            <p className="mt-2 text-base font-bold leading-7 text-stone-600">
              PDF, 이미지, 스캔본, 캡처본 모두 가능합니다. 업로드한 자료는 각 항목
              아래에서 바로 확인할 수 있습니다.
            </p>

            <div className="mt-4 rounded-2xl bg-yellow-50 p-4 text-base font-black text-stone-800 ring-1 ring-yellow-200">
              현재 {vendorPlan.toUpperCase()} 등급은 제품당 자료 {maxFiles}개까지
              업로드할 수 있습니다.
            </div>

            <div className="mt-6 grid gap-5">
              <UploadGroup
                title="제품 라벨 / 제품 사진"
                desc="제품명, 성분, 용도, 사용법이 보이는 사진이면 좋습니다."
                fileType="label"
                accept="image/*,.heic,.heif,.bmp"
                files={labelFiles}
                uploadingType={uploadingType}
                onUpload={uploadFile}
                onDelete={deleteFile}
              />

              <UploadGroup
                title="제품 카탈로그"
                desc="PDF 2장 이상, 이미지 여러 장 모두 가능합니다."
                fileType="catalog"
                accept="application/pdf,image/*,.heic,.heif,.bmp"
                files={catalogFiles}
                uploadingType={uploadingType}
                onUpload={uploadFile}
                onDelete={deleteFile}
              />

              <UploadGroup
                title="유기농 공시자료 / 등록허가 자료"
                desc="유기농업자재 공시, 비료 등록증, 시험기관 자료가 있으면 올리세요."
                fileType="organic_cert"
                accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.heic,.heif,.bmp"
                files={organicFiles}
                uploadingType={uploadingType}
                onUpload={uploadFile}
                onDelete={deleteFile}
              />

              <UploadGroup
                title="시험성적서 / 실험결과"
                desc="수확량, 당도, 비대, 병해 감소, 생육 비교자료가 있으면 점수가 올라갑니다."
                fileType="test_report"
                accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.heic,.heif,.bmp"
                files={testFiles}
                uploadingType={uploadingType}
                onUpload={uploadFile}
                onDelete={deleteFile}
              />

              <UploadGroup
                title="전후사진 / 사용후기 자료"
                desc="농민이 가장 신뢰하는 자료입니다. 현장 사진이 있으면 올리세요."
                fileType="before_after"
                accept="application/pdf,image/*,.doc,.docx,.heic,.heif,.bmp"
                files={beforeAfterFiles}
                uploadingType={uploadingType}
                onUpload={uploadFile}
                onDelete={deleteFile}
              />

              <Field
                label="홍보영상 / 사용영상 유튜브 링크"
                guide="제품 소개영상, 농가 사용영상, 사용법 영상이 있으면 줄바꿈으로 여러 개 입력하세요."
              >
                <textarea
                  rows={4}
                  value={form.youtube_urls}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      youtube_urls: e.target.value,
                    }))
                  }
                  className={textareaClass}
                  placeholder="https://youtube.com/..."
                />
              </Field>

              <button
                type="button"
                onClick={startFirstAnalysis}
                disabled={filesLoading || uploadingType !== "" || !hasAnyCoreData || analyzing}
                className="rounded-2xl bg-stone-950 px-5 py-5 text-xl font-black text-white disabled:bg-stone-300 disabled:text-stone-500"
              >
                {analyzing ? "AI가 실제 자료를 읽는 중..." : "1차 AI 자료분석 시작"}
              </button>

              {analysisStarted ? (
                <AnalysisResultSection
                  analyzing={analyzing}
                  analysisDone={analysisDone}
                  firstAnalysis={firstAnalysis}
                  showFollowup={showFollowup}
                  setShowFollowup={setShowFollowup}
                />
              ) : null}

              {showFollowup ? (
                <section
                  id="ai-followup-section"
                  className="rounded-3xl bg-yellow-50 p-5 ring-1 ring-yellow-200"
                >
                  <h2 className="text-2xl font-black text-stone-950">
                    2단계. AI가 자료를 읽고 만든 맞춤 질문
                  </h2>

                  <p className="mt-2 text-base font-bold leading-7 text-stone-600">
                    아래 질문은 고정 질문이 아니라 AI가 업로드 자료의 강점과 부족한 부분을
                    보고 만든 질문입니다.
                  </p>

                  {aiQuestions.length === 0 ? (
                    <div className="mt-5 rounded-2xl bg-white p-5 text-base font-black text-stone-600 ring-1 ring-black/10">
                      AI가 추가 질문을 만들지 못했습니다. 자료를 추가하거나 1차 분석을 다시
                      실행하세요.
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-5">
                      {aiQuestions.map((question, index) => (
                        <div
                          key={`${question}-${index}`}
                          className="rounded-3xl bg-white p-5 ring-1 ring-black/10"
                        >
                          <p className="text-sm font-black text-green-700">
                            AI 맞춤 질문 {index + 1}
                          </p>
                          <p className="mt-2 text-xl font-black leading-8 text-stone-950">
                            {question}
                          </p>
                          <textarea
                            rows={4}
                            value={dynamicAnswers[String(index)] || ""}
                            onChange={(e) =>
                              setDynamicAnswers((prev) => ({
                                ...prev,
                                [String(index)]: e.target.value,
                              }))
                            }
                            className={`${textareaClass} mt-4`}
                            placeholder="이 질문에 대한 답변을 입력하세요."
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={saveInterview}
                    disabled={saving || loading || products.length === 0}
                    className="mt-6 w-full rounded-2xl bg-green-700 px-5 py-5 text-xl font-black text-white disabled:bg-stone-300 disabled:text-stone-500"
                  >
                    {saving ? "저장중..." : "AI 제품 성장보고서 만들기"}
                  </button>
                </section>
              ) : null}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function AnalysisResultSection({
  analyzing,
  analysisDone,
  firstAnalysis,
  showFollowup,
  setShowFollowup,
}: {
  analyzing: boolean;
  analysisDone: boolean;
  firstAnalysis: AiAnalysis | null;
  showFollowup: boolean;
  setShowFollowup: (v: boolean) => void;
}) {
  return (
    <section
      id="ai-analysis-result-section"
      className="rounded-3xl bg-yellow-50 p-5 ring-1 ring-yellow-200"
    >
      {analyzing ? (
        <div>
          <h2 className="text-2xl font-black text-stone-950">
            AI가 업로드 자료 내용을 읽고 있습니다
          </h2>
          <p className="mt-3 text-lg font-bold leading-8 text-stone-700">
            파일 개수만 보는 것이 아니라 카탈로그, 이미지, PDF 안의 성분 함량,
            고함량 표현, 균 실험, 사용량표, 공시번호, 전후사진 내용을 확인하고 있습니다.
          </p>
          <div className="mt-5 h-4 overflow-hidden rounded-full bg-white ring-1 ring-yellow-200">
            <div className="h-full w-2/3 rounded-full bg-green-700" />
          </div>
        </div>
      ) : null}

      {analysisDone && firstAnalysis ? (
        <div>
          <h2 className="text-2xl font-black text-stone-950">
            1차 AI 자료분석 결과
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <ScoreCard title="자료 충실도" score={firstAnalysis.material_score} />
            <ScoreCard title="제품 신뢰도" score={firstAnalysis.trust_score} />
            <ScoreCard
              title="농민 구매 설득력"
              score={firstAnalysis.farmer_purchase_score}
            />
          </div>

          <TextBox title="AI 요약" text={firstAnalysis.summary || "AI 요약 결과가 없습니다."} />

          <ResultList
            title="고함량 성분 강점"
            emptyText="확인된 고함량 성분 강점이 없습니다."
            items={(firstAnalysis.ingredient_strengths || []).map((item) => ({
              title: item.title || "성분 강점",
              detail: item.detail || "",
              badge: item.source_type || "성분",
            }))}
          />

          <ResultList
            title="AI가 자료에서 확인한 근거"
            emptyText="확인된 근거가 없습니다."
            items={(firstAnalysis.evidence_found || []).map((item) => ({
              title: item.title || "확인 근거",
              detail: item.detail || "",
              badge: item.source_type || "자료",
            }))}
          />

          <ResultList
            title="부족하거나 추가 확인할 자료"
            emptyText="추가로 필요한 자료가 없습니다."
            items={(firstAnalysis.missing_evidence || []).map((item) => ({
              title: item.title || "보완 자료",
              detail: item.reason || item.detail || "",
              badge: "보완",
            }))}
          />

          <SimpleList
            title="농민이 살 수밖에 없는 소구점"
            items={firstAnalysis.farmer_selling_points || []}
          />

          <SimpleList
            title="한국농수산TV 연결 전략"
            items={firstAnalysis.kafs_tv_strategy || []}
          />

          <TextBox
            title="AI 최종 코멘트"
            text={firstAnalysis.final_comment || "최종 코멘트가 없습니다."}
          />

          {!showFollowup ? (
            <button
              type="button"
              onClick={() => {
                setShowFollowup(true);
                window.setTimeout(() => {
                  document
                    .getElementById("ai-followup-section")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
              }}
              className="mt-5 w-full rounded-2xl bg-stone-950 px-5 py-5 text-xl font-black text-white"
            >
              AI 맞춤 2차 질문 열기
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ScoreCard({ title, score }: { title: string; score?: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
      <p className="text-sm font-black text-stone-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-green-700">{scoreText(score)}</p>
      <p className="mt-1 text-lg font-black text-stone-950">{Number(score || 0)}점</p>
    </div>
  );
}

function TextBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-black/10">
      <p className="text-xl font-black text-stone-950">{title}</p>
      <p className="mt-3 text-base font-bold leading-8 text-stone-700">{text}</p>
    </div>
  );
}

function ResultList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: { title: string; detail: string; badge: string }[];
}) {
  return (
    <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-black/10">
      <p className="text-xl font-black text-stone-950">{title}</p>

      {items.length === 0 ? (
        <p className="mt-3 text-base font-bold text-stone-500">{emptyText}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-2xl bg-stone-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-black text-stone-950">{item.title}</p>
                <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 ring-1 ring-green-200">
                  {item.badge}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SimpleList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-black/10">
      <p className="text-xl font-black text-stone-950">{title}</p>

      {items.length === 0 ? (
        <p className="mt-3 text-base font-bold text-stone-500">
          아직 표시할 내용이 없습니다.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="rounded-xl bg-stone-50 p-3 text-base font-bold leading-7 text-stone-700"
            >
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  guide,
  children,
}: {
  label: string;
  guide: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xl font-black text-stone-950">{label}</span>
      <span className="mt-1 block text-base font-bold leading-7 text-stone-500">
        {guide}
      </span>
      <div className="mt-3">{children}</div>
    </label>
  );
}

function UploadGroup({
  title,
  desc,
  fileType,
  accept,
  files,
  uploadingType,
  onUpload,
  onDelete,
}: {
  title: string;
  desc: string;
  fileType: string;
  accept: string;
  files: GrowthFile[];
  uploadingType: string;
  onUpload: (file: File, fileType: string) => void;
  onDelete: (fileId: string) => void;
}) {
  const uploading = uploadingType === fileType;

  return (
    <div className="rounded-3xl bg-green-50 p-5 ring-1 ring-green-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-black text-stone-950">{title}</p>
          <p className="mt-1 text-base font-bold leading-7 text-stone-600">{desc}</p>
        </div>

        <div className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-black text-green-700 ring-1 ring-green-200">
          {files.length}개
        </div>
      </div>

      {files.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {files.map((file) => (
            <UploadedFileItem key={file.id} file={file} onDelete={onDelete} />
          ))}
        </div>
      ) : null}

      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl bg-white px-5 py-5 text-lg font-black text-stone-950 ring-1 ring-black/10">
        {uploading ? "업로드중..." : "파일 선택하기"}
        <input
          type="file"
          accept={accept}
          multiple
          disabled={uploading}
          onChange={(e) => {
            const selected = Array.from(e.target.files || []);
            selected.forEach((file) => onUpload(file, fileType));
            e.target.value = "";
          }}
          className="hidden"
        />
      </label>
    </div>
  );
}

function UploadedFileItem({
  file,
  onDelete,
}: {
  file: GrowthFile;
  onDelete: (fileId: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-black/10">
      <a
        href={file.file_url}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-stone-100">
          {isImageFile(file) ? (
            <img
              src={file.file_url}
              alt={file.file_name || "업로드 이미지"}
              className="h-full w-full rounded-xl object-contain"
            />
          ) : isPdfFile(file) ? (
            <span className="text-3xl">📄</span>
          ) : (
            <span className="text-3xl">📎</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black text-stone-950">
            {file.file_name || getFileNameFromUrl(file.file_url)}
          </p>
          <p className="mt-1 text-sm font-bold text-green-700">
            {fileTypeLabel(file.file_type)} · 자료 보기
          </p>
        </div>
      </a>

      <button
        type="button"
        onClick={() => onDelete(file.id)}
        className="shrink-0 rounded-xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 ring-1 ring-red-200"
      >
        삭제
      </button>
    </div>
  );
}