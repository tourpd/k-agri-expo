"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Product = {
  name: string;
  category?: string;
  reason?: string;
  crops?: string[];
  problems?: string[];
  image_url?: string;
  selected?: boolean;
  detailUsage?: string;
  detailMethod?: string;
  detailTable?: string;
  detailWarning?: string;
};

type Job = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  fileName: string;
  fileSize: number;
  currentChunk: number;
  totalChunks: number;
  progress: number;
  message: string;
  result: any | null;
  error: string | null;
  logs: string[];
  partialProducts?: Product[];
};

export default function AnalysisPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [catalogFile, setCatalogFile] = useState<File | null>(null);
  const [homepageUrl, setHomepageUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [running, setRunning] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [editableProducts, setEditableProducts] = useState<Product[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [productFilter, setProductFilter] = useState<"all" | "selected">("all");

  const products = useMemo(() => {
    return job?.result?.analysis?.allProducts ?? job?.partialProducts ?? [];
  }, [job]);

  useEffect(() => {
    if (products.length > 0 && editableProducts.length === 0) {
      setEditableProducts(
        products.map((p: Product) => ({
          ...p,
          selected: true,
          detailUsage: "",
          detailMethod: "",
          detailTable: "",
          detailWarning: "",
        }))
      );
      setActiveIndex(0);
    }
  }, [products, editableProducts.length]);

  const selectedProducts = editableProducts.filter((p) => p.selected);
  const pick10 = selectedProducts.slice(0, 10);
  const pick20 = selectedProducts.slice(0, 20);
  const activeProduct =
    activeIndex !== null ? editableProducts[activeIndex] : null;

  async function startAnalysis() {
    if (
      !catalogFile &&
      !homepageUrl.trim() &&
      !youtubeUrl.trim() &&
      !storeUrl.trim() &&
      !blogUrl.trim() &&
      !productImage
    ) {
      alert("PDF, 홈페이지, 유튜브, 쇼핑몰, 제품사진 중 하나 이상 입력하세요.");
      return;
    }

    setRunning(true);
    setJob(null);
    setDisplayProgress(0);
    setEditableProducts([]);
    setActiveIndex(null);

    if (!catalogFile) {
      setJob({
        id: "url-analysis",
        status: "running",
        fileName: "URL 자료 분석",
        fileSize: 0,
        currentChunk: 0,
        totalChunks: 0,
        progress: 20,
        message: "회사 홈페이지·유튜브·블로그·제품자료를 읽고 농민마트용 제품을 분석중입니다.",
        result: null,
        error: null,
        logs: [
          `${new Date().toLocaleTimeString()} URL 분석 시작`,
          `${new Date().toLocaleTimeString()} 홈페이지 URL: ${homepageUrl || "없음"}`,
          `${new Date().toLocaleTimeString()} 유튜브 URL: ${youtubeUrl || "없음"}`,
          `${new Date().toLocaleTimeString()} 쇼핑몰 URL: ${storeUrl || "없음"}`,
          `${new Date().toLocaleTimeString()} 블로그/카페 URL: ${blogUrl || "없음"}`,
        ],
        partialProducts: [],
      });

      setDisplayProgress(25);

      const res = await fetch("/api/ai/create-farmer-mart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homepageUrl,
          youtubeUrl,
          storeUrl,
          blogUrl,
          projectId: id,
        }),
      });

      setDisplayProgress(70);

      const data = await res.json();

      if (!data.ok) {
        setJob({
          id: "url-analysis",
          status: "failed",
          fileName: "URL 자료 분석",
          fileSize: 0,
          currentChunk: 0,
          totalChunks: 0,
          progress: 100,
          message: "AI 농민마트 분석 실패",
          result: null,
          error: data.error ?? "AI 농민마트 분석 실패",
          logs: [
            `${new Date().toLocaleTimeString()} 오류: ${data.error ?? "AI 농민마트 분석 실패"}`,
          ],
          partialProducts: [],
        });

        setRunning(false);
        return;
      }

      const found = data.analysis?.allProducts ?? [];

      setJob({
        id: "url-analysis",
        status: "completed",
        fileName: "URL 자료 분석",
        fileSize: 0,
        currentChunk: 1,
        totalChunks: 1,
        progress: 100,
        message: `AI 농민마트 분석 완료 / 발견 제품 ${found.length}개`,
        result: {
          fileName: "URL 자료 분석",
          pageCount: data.pageCount,
          chunkCount: 1,
          analysis: data.analysis,
        },
        error: null,
        logs: [
          `${new Date().toLocaleTimeString()} AI 농민마트 분석 완료 / 발견 제품 ${found.length}개`,
          `${new Date().toLocaleTimeString()} 제품 카드·농민마트 추천 구성 생성 완료`,
        ],
        partialProducts: found,
      });

      setEditableProducts(
        found.map((p: any) => ({
          ...p,
          name: p.name ?? p.productName ?? "제품명 미확인",
          category: p.category ?? "미분류",
          reason:
            p.reason ??
            p.sellingPoint ??
            p.farmerProblem ??
            "농민 문제 해결 관점에서 추가 확인이 필요합니다.",
          crops: p.crops ?? p.targetCrops ?? [],
          problems: p.problems ?? (p.farmerProblem ? [p.farmerProblem] : []),
          selected: true,
          detailUsage: p.detailUsage ?? p.usageSummary ?? "",
          detailMethod:
            p.detailMethod ??
            (Array.isArray(p.keyBenefits) ? p.keyBenefits.join("\n") : ""),
          detailTable: p.detailTable ?? "",
          detailWarning:
            p.detailWarning ??
            (Array.isArray(p.evidenceNeeded)
              ? `추가 근거 필요: ${p.evidenceNeeded.join(", ")}`
              : ""),
        }))
      );

      setActiveIndex(found.length > 0 ? 0 : null);
      setDisplayProgress(100);
      setRunning(false);
      return;
    }

    const form = new FormData();
    form.append("file", catalogFile);
    form.append("projectId", id);
    form.append("homepageUrl", homepageUrl);
    form.append("youtubeUrl", youtubeUrl);
    form.append("storeUrl", storeUrl);
    form.append("blogUrl", blogUrl);

    const res = await fetch("/api/ai/analyze-pdf/start", {
      method: "POST",
      body: form,
    });

    const data = await res.json();

    if (!data.ok) {
      alert(data.error ?? "분석 시작 실패");
      setRunning(false);
      return;
    }

    setJobId(data.jobId);
  }

  useEffect(() => {
    if (!jobId) return;

    const timer = setInterval(async () => {
      const res = await fetch(`/api/ai/analyze-pdf/job/${jobId}`);
      const data = await res.json();

      if (data.ok) {
        setJob(data.job);
        setDisplayProgress((prev) => Math.max(prev, data.job.progress ?? 0));

        if (data.job.status === "completed" || data.job.status === "failed") {
          setRunning(false);
          clearInterval(timer);
        }
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [jobId]);

  useEffect(() => {
    if (!running || !job || job.status !== "running") return;

    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        const real = job.progress ?? 0;
        if (prev < real) return real;

        const total = job.totalChunks || 6;
        const current = job.currentChunk || 1;
        const chunkEnd = 15 + Math.round((current / total) * 70);
        const softLimit = Math.min(Math.max(real, chunkEnd - 2), 97);

        if (prev >= softLimit) return prev;
        return Math.min(softLimit, prev + 1);
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [running, job]);

  function updateProduct(index: number, patch: Partial<Product>) {
    setEditableProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  }

  function deleteProduct(index: number) {
    setEditableProducts((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex(null);
  }

  function exportProductsCsv() {
    const rows = [
      ["선택", "제품명", "카테고리", "설명", "작물", "문제", "사용법", "약제처리", "처리표", "주의사항"],
      ...editableProducts.map((p) => [
        p.selected ? "선택" : "제외",
        p.name ?? "",
        p.category ?? "",
        p.reason ?? "",
        (p.crops ?? []).join(", "),
        (p.problems ?? []).join(", "),
        p.detailUsage ?? "",
        p.detailMethod ?? "",
        p.detailTable ?? "",
        p.detailWarning ?? "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "AI_제품_발견_목록.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleProduct(index: number) {
    setEditableProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/admin/sales-automation/${id}`}
          className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
        >
          ← 대시보드
        </Link>

        <section className="mt-6 rounded-3xl bg-white p-8 shadow-xl">
          <div className="flex items-center justify-between gap-5">
            <div>
              <h1 className="text-5xl font-black">AI 자료 분석실</h1>
              <p className="mt-4 text-2xl font-black">
                PDF 분석 → 제품 편집 → 10개·20개 구성 → 상세페이지 제작까지 연결합니다.
              </p>
            </div>

            <button
              onClick={startAnalysis}
              disabled={running}
              className="rounded-2xl bg-green-700 px-8 py-5 text-2xl font-black text-white disabled:bg-stone-400"
            >
              {running ? "실제 분석중" : "AI 분석 시작"}
            </button>
          </div>

          <section className="mt-8 rounded-3xl border-4 border-black bg-stone-50 p-6">
            <h2 className="text-3xl font-black">통합 분석 자료 입력</h2>
            <p className="mt-2 text-xl font-black text-stone-700">
              PDF·홈페이지·유튜브·쇼핑몰·제품사진을 함께 넣어 제품을 통합 분석합니다.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block rounded-2xl border-2 border-dashed border-black bg-white p-6">
                <p className="text-2xl font-black">① PDF 카탈로그 / 회사소개서</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCatalogFile(e.target.files?.[0] ?? null)}
                  className="mt-4 block w-full text-xl font-black"
                />
                <p className="mt-3 text-xl font-black">
                  {catalogFile ? catalogFile.name : "선택된 파일 없음"}
                </p>
              </label>

              <label className="block rounded-2xl border-2 border-black bg-white p-6">
                <p className="text-2xl font-black">② 회사 홈페이지 URL</p>
                <input
                  value={homepageUrl}
                  onChange={(e) => setHomepageUrl(e.target.value)}
                  placeholder="https://회사홈페이지.com"
                  className="mt-4 w-full rounded-2xl border-2 border-black p-4 text-xl font-bold"
                />
              </label>

              <label className="block rounded-2xl border-2 border-black bg-white p-6">
                <p className="text-2xl font-black">③ 유튜브 채널 URL</p>
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@channel"
                  className="mt-4 w-full rounded-2xl border-2 border-black p-4 text-xl font-bold"
                />
              </label>

              <label className="block rounded-2xl border-2 border-black bg-white p-6">
                <p className="text-2xl font-black">④ 스마트스토어 / 쇼핑몰 URL</p>
                <input
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="https://smartstore.naver.com/..."
                  className="mt-4 w-full rounded-2xl border-2 border-black p-4 text-xl font-bold"
                />
              </label>

              <label className="block rounded-2xl border-2 border-black bg-white p-6">
                <p className="text-2xl font-black">⑤ 블로그 / 카페 URL</p>
                <input
                  value={blogUrl}
                  onChange={(e) => setBlogUrl(e.target.value)}
                  placeholder="https://blog.naver.com/..."
                  className="mt-4 w-full rounded-2xl border-2 border-black p-4 text-xl font-bold"
                />
              </label>

              <label className="block rounded-2xl border-2 border-dashed border-black bg-white p-6">
                <p className="text-2xl font-black">⑥ 제품 이미지</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductImage(e.target.files?.[0] ?? null)}
                  className="mt-4 block w-full text-xl font-black"
                />
                <p className="mt-3 text-xl font-black">
                  {productImage ? productImage.name : "선택된 이미지 없음"}
                </p>
              </label>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border-4 border-green-700 bg-green-50 p-6">
            <h2 className="text-4xl font-black">AI 작업 모니터</h2>
            <p className="mt-4 text-2xl font-black">
              {job?.message ?? "PDF를 선택하고 분석을 시작하세요."}
            </p>

            {job?.status === "running" && (
              <p className="mt-2 text-lg font-black text-green-800">
                실제 처리율 {job.progress}% · 화면 진행률 {displayProgress}%
              </p>
            )}

            <div className="mt-5 h-8 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full bg-green-700 transition-all duration-500"
                style={{ width: `${displayProgress}%` }}
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <Stat title="진행률" value={`${displayProgress}%`} />
              <Stat title="현재 조각" value={`${job?.currentChunk ?? 0}/${job?.totalChunks ?? 0}`} />
              <Stat title="상태" value={job?.status ?? "대기"} />
              <Stat title="발견 제품" value={`${editableProducts.length || products.length}개`} />
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="rounded-3xl border-2 border-black bg-white p-6">
              <h2 className="text-3xl font-black">실시간 로그</h2>
              <div className="mt-4 max-h-[520px] space-y-3 overflow-auto">
                {(job?.logs ?? []).map((log) => (
                  <p key={log} className="rounded-xl bg-stone-100 p-3 text-lg font-bold">
                    {log}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border-2 border-black bg-white p-6">
              <h2 className="text-3xl font-black">추천 구성</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <RecommendBox title="선택 제품" count={selectedProducts.length} />
                <RecommendBox title="10개 기본구성" count={pick10.length} />
                <RecommendBox title="20개 확장구성" count={pick20.length} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <ListBox title="10개 추천" products={pick10} />
                <ListBox title="20개 추천" products={pick20} />
              </div>
            </div>
          </section>
        </section>

        <section className="mt-10 rounded-3xl bg-white p-8 shadow-xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-5xl font-black">전체 제품 리스트</h2>
              <p className="mt-4 text-2xl font-black text-stone-700">
                PDF에서 발견된 전체 제품을 목록으로 확인합니다.
              </p>
            </div>

            <div className="rounded-full bg-green-100 px-6 py-3 text-2xl font-black text-green-800">
              총 {editableProducts.length}개
            </div>
          </div>

          <div className="mt-8 overflow-x-auto rounded-3xl border-2 border-black bg-white">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead className="bg-green-800 text-white">
                <tr>
                  <th className="p-4 text-lg font-black">번호</th>
                  <th className="p-4 text-lg font-black">선택</th>
                  <th className="p-4 text-lg font-black">제품명</th>
                  <th className="p-4 text-lg font-black">카테고리</th>
                  <th className="p-4 text-lg font-black">설명</th>
                  <th className="p-4 text-lg font-black">관리</th>
                </tr>
              </thead>
              <tbody>
                {editableProducts.map((product, idx) => (
                  <tr key={`${product.name}-${idx}`} className="border-b border-stone-200">
                    <td className="p-4 text-lg font-black">{idx + 1}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleProduct(idx)}
                        className={`rounded-xl px-4 py-2 font-black ${
                          product.selected ? "bg-green-700 text-white" : "bg-stone-200 text-black"
                        }`}
                      >
                        {product.selected ? "선택" : "제외"}
                      </button>
                    </td>
                    <td className="p-4 text-xl font-black">{product.name}</td>
                    <td className="p-4 font-bold">{product.category || "-"}</td>
                    <td className="p-4 font-bold">{product.reason || "-"}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveIndex(idx)}
                          className="rounded-xl bg-green-700 px-4 py-2 font-black text-white"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => deleteProduct(idx)}
                          className="rounded-xl bg-red-600 px-4 py-2 font-black text-white"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-white p-8 shadow-xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-5xl font-black">AI 제품 발견 보드</h2>
              <p className="mt-4 text-2xl font-black text-stone-700">
                PDF에서 발견된 전체 제품을 먼저 로드하고, 이번 상세페이지에 쓸 제품만 선택합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setProductFilter("all");
                  setViewMode("list");
                }}
                className={`rounded-2xl px-5 py-3 text-xl font-black ${
                  productFilter === "all" ? "bg-green-700 text-white" : "bg-stone-200 text-black"
                }`}
              >
                전체 제품 로드
              </button>
              <button
                onClick={() => {
                  setProductFilter("selected");
                  setViewMode("card");
                }}
                className={`rounded-2xl px-5 py-3 text-xl font-black ${
                  productFilter === "selected" ? "bg-green-700 text-white" : "bg-stone-200 text-black"
                }`}
              >
                선택 제품만 보기
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`rounded-2xl px-5 py-3 text-xl font-black ${
                  viewMode === "card" ? "bg-black text-white" : "bg-stone-200 text-black"
                }`}
              >
                카드형
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-2xl px-5 py-3 text-xl font-black ${
                  viewMode === "list" ? "bg-black text-white" : "bg-stone-200 text-black"
                }`}
              >
                표형
              </button>
              <button
                onClick={() => {
                  const firstSelected = editableProducts.findIndex((p) => p.selected);
                  setActiveIndex(firstSelected >= 0 ? firstSelected : editableProducts.length > 0 ? 0 : null);
                }}
                className="rounded-2xl bg-green-700 px-5 py-3 text-xl font-black text-white"
              >
                상세페이지 만들기
              </button>
              <button
                onClick={() => alert("다음 단계에서 4컷만화·8컷웹툰·쇼츠·홈쇼핑 대본 생성기를 연결합니다.")}
                className="rounded-2xl bg-purple-700 px-5 py-3 text-xl font-black text-white"
              >
                콘텐츠 확장
              </button>
              <button
                onClick={exportProductsCsv}
                className="rounded-2xl bg-yellow-300 px-5 py-3 text-xl font-black text-black"
              >
                엑셀 다운로드
              </button>
              <div className="rounded-full bg-green-100 px-6 py-3 text-2xl font-black text-green-800">
                총 {editableProducts.length}개
              </div>
            </div>
          </div>

          {editableProducts.length === 0 ? (
            <div className="mt-8 rounded-3xl border-2 border-dashed border-stone-300 p-10 text-center text-3xl font-black text-stone-500">
              분석이 완료되면 제품 카드가 여기에 표시됩니다.
            </div>
          ) : viewMode === "card" ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {editableProducts.map((product, idx) => (
                <ProductEditCard
                  key={`${product.name}-${idx}`}
                  product={product}
                  onToggle={() => toggleProduct(idx)}
                  onDelete={() => deleteProduct(idx)}
                  onEdit={() => setActiveIndex(idx)}
                />
              ))}
            </div>
          ) : (
            <ProductListTable
              products={editableProducts}
              onToggle={toggleProduct}
              onDelete={deleteProduct}
              onEdit={setActiveIndex}
            />
          )}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-4xl font-black">제품 편집실</h2>

            {!activeProduct ? (
              <p className="mt-6 text-2xl font-black text-stone-500">
                전체 제품 중 선택한 제품만 여기서 편집하고 상세페이지·콘텐츠 확장으로 넘깁니다.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                <EditorField
                  label="제품명"
                  value={activeProduct.name}
                  onChange={(v) => updateProduct(activeIndex!, { name: v })}
                />
                <EditorField
                  label="카테고리"
                  value={activeProduct.category ?? ""}
                  onChange={(v) => updateProduct(activeIndex!, { category: v })}
                />
                <EditorArea
                  label="제품 설명"
                  value={activeProduct.reason ?? ""}
                  onChange={(v) => updateProduct(activeIndex!, { reason: v })}
                />
                <EditorArea
                  label="사용법"
                  value={activeProduct.detailUsage ?? ""}
                  onChange={(v) => updateProduct(activeIndex!, { detailUsage: v })}
                />
                <EditorArea
                  label="약제 처리 방법"
                  value={activeProduct.detailMethod ?? ""}
                  onChange={(v) => updateProduct(activeIndex!, { detailMethod: v })}
                />
                <EditorArea
                  label="처리표 / 희석배수 / 시기"
                  value={activeProduct.detailTable ?? ""}
                  onChange={(v) => updateProduct(activeIndex!, { detailTable: v })}
                />
                <EditorArea
                  label="주의사항"
                  value={activeProduct.detailWarning ?? ""}
                  onChange={(v) => updateProduct(activeIndex!, { detailWarning: v })}
                />
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-4xl font-black">상세페이지 구성 미리보기</h2>

            {!activeProduct ? (
              <p className="mt-6 text-2xl font-black text-stone-500">
                제품을 선택하면 상세페이지 구조가 표시됩니다.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                <PreviewBlock title="1. 문제 제기" text={`${activeProduct.name}이 필요한 농민 문제를 설명합니다.`} />
                <PreviewBlock title="2. 제품 핵심 설명" text={activeProduct.reason || "제품 설명 입력 필요"} />
                <PreviewBlock title="3. 사용법" text={activeProduct.detailUsage || "사용법 입력 필요"} />
                <PreviewBlock title="4. 약제 처리 방법" text={activeProduct.detailMethod || "처리 방법 입력 필요"} />
                <PreviewBlock title="5. 처리표" text={activeProduct.detailTable || "희석배수·시기·횟수 표 입력 필요"} />
                <PreviewBlock title="6. 주의사항" text={activeProduct.detailWarning || "주의사항 입력 필요"} />

                <div className="grid grid-cols-2 gap-3">
                  <button className="rounded-2xl bg-green-700 py-5 text-xl font-black text-white">
                    상세페이지 저장
                  </button>
                  <button className="rounded-2xl bg-yellow-300 py-5 text-xl font-black text-black">
                    엑스포에 올리기
                  </button>
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <p className="text-lg font-black">{title}</p>
      <p className="mt-2 text-3xl font-black text-green-700">{value}</p>
    </div>
  );
}

function RecommendBox({ title, count }: { title: string; count: number }) {
  return (
    <div className="rounded-2xl bg-green-50 p-5">
      <p className="text-xl font-black">{title}</p>
      <p className="mt-2 text-4xl font-black text-green-700">{count}개</p>
    </div>
  );
}

function ListBox({ title, products }: { title: string; products: Product[] }) {
  return (
    <div className="rounded-2xl bg-stone-100 p-5">
      <h3 className="text-2xl font-black">{title}</h3>
      <div className="mt-3 space-y-2">
        {products.length === 0 ? (
          <p className="font-bold">제품 없음</p>
        ) : (
          products.map((p) => (
            <p key={p.name} className="rounded-xl bg-white p-3 font-bold">
              ✓ {p.name}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

function ProductEditCard({
  product,
  onToggle,
  onDelete,
  onEdit,
}: {
  product: Product;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-stone-200 bg-white shadow-sm">
      <div className="flex h-56 items-center justify-center bg-stone-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-6" />
        ) : (
          <div className="text-center">
            <p className="text-5xl">🧪</p>
            <p className="mt-3 text-xl font-black text-stone-500">제품 이미지 자리</p>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-green-100 px-4 py-2 text-base font-black text-green-800">
            {product.category || "카테고리 미정"}
          </span>
          <button
            onClick={onToggle}
            className={`rounded-full px-4 py-2 text-base font-black ${
              product.selected ? "bg-green-700 text-white" : "bg-stone-200 text-black"
            }`}
          >
            {product.selected ? "선택됨" : "제외됨"}
          </button>
        </div>

        <h3 className="mt-4 text-3xl font-black leading-tight">{product.name}</h3>
        <p className="mt-3 line-clamp-3 text-lg font-bold leading-relaxed text-stone-700">
          {product.reason || "제품 설명을 정리중입니다."}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button onClick={onEdit} className="rounded-2xl bg-green-700 py-4 text-lg font-black text-white">
            수정
          </button>
          <button className="rounded-2xl bg-yellow-300 py-4 text-lg font-black text-black">
            표로
          </button>
          <button onClick={onDelete} className="rounded-2xl bg-red-600 py-4 text-lg font-black text-white">
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}


function ProductListTable({
  products,
  onToggle,
  onDelete,
  onEdit,
}: {
  products: Product[];
  onToggle: (index: number) => void;
  onDelete: (index: number) => void;
  onEdit: (index: number) => void;
}) {
  return (
    <div className="mt-8 overflow-x-auto rounded-3xl border-2 border-black bg-white">
      <table className="w-full min-w-[1100px] border-collapse text-left">
        <thead className="bg-green-800 text-white">
          <tr>
            <th className="p-4 text-lg font-black">선택</th>
            <th className="p-4 text-lg font-black">제품명</th>
            <th className="p-4 text-lg font-black">카테고리</th>
            <th className="p-4 text-lg font-black">설명</th>
            <th className="p-4 text-lg font-black">작물</th>
            <th className="p-4 text-lg font-black">문제</th>
            <th className="p-4 text-lg font-black">관리</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={`${p.name}-${idx}`} className="border-b border-stone-200">
              <td className="p-4">
                <button
                  onClick={() => onToggle(idx)}
                  className={`rounded-xl px-4 py-2 font-black ${
                    p.selected ? "bg-green-700 text-white" : "bg-stone-200 text-black"
                  }`}
                >
                  {p.selected ? "선택" : "제외"}
                </button>
              </td>
              <td className="p-4 text-xl font-black">{p.name}</td>
              <td className="p-4 font-bold">{p.category || "-"}</td>
              <td className="p-4 font-bold">{p.reason || "-"}</td>
              <td className="p-4 font-bold">{(p.crops ?? []).join(", ") || "-"}</td>
              <td className="p-4 font-bold">{(p.problems ?? []).join(", ") || "-"}</td>
              <td className="p-4">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(idx)} className="rounded-xl bg-green-700 px-4 py-2 font-black text-white">
                    수정
                  </button>
                  <button onClick={() => onDelete(idx)} className="rounded-xl bg-red-600 px-4 py-2 font-black text-white">
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <p className="text-xl font-black">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border-2 border-black p-4 text-xl font-bold"
      />
    </label>
  );
}

function EditorArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <p className="text-xl font-black">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-2 w-full rounded-2xl border-2 border-black p-4 text-xl font-bold"
      />
    </label>
  );
}

function PreviewBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-stone-100 p-5">
      <h3 className="text-2xl font-black">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-lg font-bold leading-relaxed">{text}</p>
    </div>
  );
}
