"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export const dynamic = "force-dynamic";

export default function SalesAutomationNewPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [youtubeUrls, setYoutubeUrls] = useState("");
  const [notes, setNotes] = useState("");
  const [customConcept, setCustomConcept] = useState(
    "몬드리안 스타일 상세페이지. 광고 훅과 멘트를 이미지 장면으로 적극 전환. 상품이미지, 비포애프터, 주의사항, 작물별 시비법, 성분표, 사용장면, 공동구매 CTA를 각각 카드형 이미지 블록으로 분해. 고객 구매욕구와 농자재 업체 만족감을 동시에 높이는 살아 움직이는 상세페이지."
  );

  const [loading, setLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState("");

  const [imageAnalysis, setImageAnalysis] = useState("");
  const [pdfAnalysis, setPdfAnalysis] = useState("");
  const [result, setResult] = useState("");

  const detailPagePlan = useMemo(() => {
    if (!result) return "";
    return pickSection(result, ["상세페이지 설계", "SECTION 01 HERO"]);
  }, [result]);

  const imagePackage = useMemo(() => {
    if (!result) return "";
    return pickSection(result, ["상세페이지 이미지 패키지", "IMAGE_01_HERO"]);
  }, [result]);

  const adImagePackage = useMemo(() => {
    if (!result) return "";
    return pickSection(result, [
      "광고 훅 기반 이미지 생성 패키지",
      "IMAGE_AD_01",
      "광고 훅 이미지",
    ]);
  }, [result]);

  const geminiImagePrompt = useMemo(() => {
    if (!result) return "";
    return pickSection(result, [
      "Gemini 상세페이지 이미지 프롬프트",
      "Gemini 이미지",
      "이미지 프롬프트",
    ]);
  }, [result]);

  const geminiVideoPrompt = useMemo(() => {
    if (!result) return "";
    return pickSection(result, [
      "Gemini/Veo 영상 프롬프트",
      "Gemini 영상",
      "Veo 영상",
      "영상 프롬프트",
    ]);
  }, [result]);

  const htmlDraft = useMemo(() => {
    if (!result) return "";
    return pickSection(result, ["HTML 판매페이지 초안", "Tailwind"]);
  }, [result]);

  async function analyzeImage() {
    if (!imageFile) return "";

    const formData = new FormData();
    formData.append("file", imageFile);

    const res = await fetch("/api/ai/analyze-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.result || "이미지 분석 실패");
    }

    return String(data.result || "");
  }

  async function analyzePdf() {
    if (!pdfFile) return "";

    const formData = new FormData();
    formData.append("file", pdfFile);

    const res = await fetch("/api/ai/analyze-pdf", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.result || "PDF 분석 실패");
    }

    return String(data.result || "");
  }

  async function generateStrategy() {
    setLoading(true);
    setStepMessage("AI 분석을 시작합니다...");
    setImageAnalysis("");
    setPdfAnalysis("");
    setResult("");

    try {
      let analyzedImage = "";
      let analyzedPdf = "";

      if (imageFile) {
        setStepMessage("1단계: 제품사진을 AI가 분석하고 있습니다...");
        analyzedImage = await analyzeImage();
        setImageAnalysis(analyzedImage);
      }

      if (pdfFile) {
        setStepMessage("2단계: PDF 자료를 AI가 분석하고 있습니다...");
        analyzedPdf = await analyzePdf();
        setPdfAnalysis(analyzedPdf);
      }

      setStepMessage(
        "3단계: 상세페이지·광고훅 이미지·이미지패키지·광고전략을 생성하고 있습니다..."
      );

      const payload = {
        imageAnalysis:
          analyzedImage ||
          "제품사진 분석 없음. 제품 단독컷, 라벨, 성분, 인증, 사용 작물, 비포애프터 이미지로 나눌 수 있는지 추론하십시오.",
        pdfAnalysis:
          analyzedPdf ||
          "PDF 분석 없음. 사용방법, 주의사항, 작물별 시비법, 성분표, 시험자료, 비교표로 나눌 수 있는지 추론하십시오.",
        youtubeUrls,
        youtubeAnalysis: youtubeUrls,
        notes,
        customConcept,
      };

      const res = await fetch("/api/ai/sales-strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStepMessage("판매전략 생성 실패");
        setResult(data.result || "AI 판매전략 생성 실패");
        return;
      }

      setResult(data.result || "분석 결과 없음");
      setStepMessage("AI 분석 완료");
    } catch (error) {
      console.error("[sales-automation/new] error", error);
      setStepMessage("오류 발생");
      setResult(error instanceof Error ? error.message : "오류 발생");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-6 text-stone-950">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/sales-automation"
          className="text-xl font-black text-green-700"
        >
          ← AI 판매자동화센터
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="grid min-h-[320px] grid-cols-1 md:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-yellow-300 p-8">
              <p className="text-xl font-black">K-Agri Expo</p>
              <h1 className="mt-4 text-5xl font-black leading-tight">
                AI 판매자동화센터
              </h1>
              <p className="mt-5 text-2xl font-black leading-relaxed">
                광고 훅을 이미지 장면으로 바꾸고, 상세페이지 · 이미지패키지 ·
                쇼츠 · 배너 · 문자 · 공동구매까지 생성합니다.
              </p>
            </div>

            <div className="grid grid-rows-4">
              <div className="bg-red-600 p-6 text-3xl font-black text-white">
                상세페이지
              </div>
              <div className="bg-blue-700 p-6 text-3xl font-black text-white">
                이미지 7장
              </div>
              <div className="bg-black p-6 text-3xl font-black text-white">
                광고훅 이미지
              </div>
              <div className="bg-white p-6 text-3xl font-black text-black">
                쇼츠/광고
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-lg font-black text-green-700">STEP 1</p>
          <h2 className="mt-2 text-4xl font-black">제품 자료 업로드</h2>
          <p className="mt-3 text-xl font-bold text-black">
            사진과 PDF에서 상품이미지, 비포애프터, 주의사항, 작물별 시비법,
            성분표를 분리하고 광고 훅에 맞는 구매욕구 이미지를 생성합니다.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <UploadBox
              icon="📷"
              title="제품 사진"
              desc="상품이미지 · 라벨 · 사용장면 · 비포애프터"
              accept="image/*"
              fileName={imageFile?.name}
              onChange={(file) => setImageFile(file)}
            />

            <UploadBox
              icon="📄"
              title="PDF 자료"
              desc="성분표 · 주의사항 · 작물별 시비법 · 시험자료"
              accept="application/pdf"
              fileName={pdfFile?.name}
              onChange={(file) => setPdfFile(file)}
            />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Field title="유튜브 링크">
              <textarea
                value={youtubeUrls}
                onChange={(e) => setYoutubeUrls(e.target.value)}
                rows={5}
                className="w-full rounded-3xl border p-5 text-lg"
                placeholder="유튜브 링크 여러개 입력 가능"
              />
            </Field>

            <Field title="추가 메모">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="w-full rounded-3xl border p-5 text-lg"
                placeholder="제품명, 업체 요청사항, 강조할 내용"
              />
            </Field>
          </div>

          <div className="mt-6">
            <Field title="원하는 광고/상세페이지 컨셉">
              <textarea
                value={customConcept}
                onChange={(e) => setCustomConcept(e.target.value)}
                rows={6}
                className="w-full rounded-3xl border border-red-300 bg-yellow-50 p-5 text-lg font-bold"
                placeholder="예: 몬드리안 스타일 상세페이지, 광고 훅 기반 이미지, 왕의남자 패러디, 트로트 MV, 전문가 다큐형, 뉴스속보형"
              />
            </Field>
          </div>

          <button
            onClick={generateStrategy}
            disabled={loading}
            className="mt-8 w-full rounded-3xl bg-green-700 py-6 text-3xl font-black text-white disabled:bg-stone-400"
          >
            {loading ? "AI 분석 중..." : "AI 자동분석 시작"}
          </button>

          {stepMessage ? (
            <div className="mt-6 rounded-2xl bg-green-50 p-5 text-xl font-black text-green-800 ring-1 ring-green-200">
              {stepMessage}
            </div>
          ) : null}
        </section>

        {imageAnalysis ? (
          <ResultBlock title="제품사진 AI 분석 결과" color="blue" content={imageAnalysis} />
        ) : null}

        {pdfAnalysis ? (
          <ResultBlock title="PDF AI 분석 결과" color="yellow" content={pdfAnalysis} />
        ) : null}

        {detailPagePlan ? (
          <ResultBlock title="상세페이지 설계" color="green" content={detailPagePlan} />
        ) : null}

        {imagePackage ? (
          <ResultBlock title="상세페이지 이미지 패키지 7장" color="red" content={imagePackage} />
        ) : null}

        {adImagePackage ? (
          <ResultBlock title="광고 훅 기반 이미지 생성 패키지" color="pink" content={adImagePackage} />
        ) : null}

        {geminiImagePrompt ? (
          <ResultBlock title="Gemini 상세페이지 이미지 프롬프트" color="purple" content={geminiImagePrompt} />
        ) : null}

        {geminiVideoPrompt ? (
          <ResultBlock title="Gemini/Veo 영상 프롬프트" color="orange" content={geminiVideoPrompt} />
        ) : null}

        {htmlDraft ? (
          <ResultBlock title="HTML 판매페이지 초안" color="black" content={htmlDraft} />
        ) : null}

        {result ? (
          <ResultBlock title="AI 판매전략 전체 결과" color="stone" content={result} />
        ) : null}
      </div>
    </main>
  );
}

function Field({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-3 text-2xl font-black">{title}</div>
      {children}
    </label>
  );
}

function UploadBox({
  icon,
  title,
  desc,
  accept,
  fileName,
  onChange,
}: {
  icon: string;
  title: string;
  desc: string;
  accept: string;
  fileName?: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="rounded-3xl border-4 border-black bg-stone-50 p-8 text-center shadow-lg">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 text-2xl font-black">{title}</h3>
      <p className="mt-3 text-lg font-bold text-black">{desc}</p>

      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="mt-5 w-full rounded-2xl bg-white p-4"
      />

      {fileName ? (
        <p className="mt-4 break-all text-lg font-black text-green-700">
          선택됨: {fileName}
        </p>
      ) : null}
    </div>
  );
}

function ResultBlock({
  title,
  color,
  content,
}: {
  title: string;
  color:
    | "blue"
    | "yellow"
    | "green"
    | "purple"
    | "orange"
    | "stone"
    | "red"
    | "black"
    | "pink";
  content: string;
}) {
  const cls = {
    blue: "bg-blue-50 text-blue-950 ring-blue-200",
    yellow: "bg-yellow-50 text-yellow-950 ring-yellow-200",
    green: "bg-green-50 text-green-950 ring-green-200",
    purple: "bg-purple-50 text-purple-950 ring-purple-200",
    orange: "bg-orange-50 text-orange-950 ring-orange-200",
    stone: "bg-stone-100 text-stone-950 ring-stone-200",
    red: "bg-red-50 text-red-950 ring-red-200",
    pink: "bg-pink-50 text-pink-950 ring-pink-200",
    black: "bg-black text-white ring-black",
  }[color];

  return (
    <section className={`mt-8 rounded-3xl p-8 ring-1 ${cls}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-3xl font-black">{title}</h3>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(content)}
          className="rounded-2xl bg-white px-5 py-3 text-lg font-black text-black"
        >
          복사
        </button>
      </div>

      <pre className="mt-5 whitespace-pre-wrap text-lg leading-relaxed">
        {content}
      </pre>
    </section>
  );
}

function pickSection(text: string, labels: string[]) {
  const lines = text.split("\n");
  const startIndex = lines.findIndex((line) =>
    labels.some((label) => line.toLowerCase().includes(label.toLowerCase()))
  );

  if (startIndex < 0) return "";

  const picked: string[] = [];

  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i];
    const isNextBigSection =
      i > startIndex &&
      /^\d+\.\s/.test(line.trim()) &&
      !labels.some((label) => line.toLowerCase().includes(label.toLowerCase()));

    if (isNextBigSection) break;
    picked.push(line);
  }

  return picked.join("\n").trim();
}
