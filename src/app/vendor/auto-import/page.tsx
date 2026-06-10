"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type EvidenceImage = {
  image_url?: string;
  image_type?: string;
  reason?: string;
};

type ProductCandidate = {
  temp_id: string;
  product_name: string;
  category?: string;
  recommended_hall?: string;
  short_description?: string;
  ingredients?: string;
  usage?: string;
  target_crop?: string;
  selling_point?: string;
  farmer_pain_point?: string;
  priority?: string;
  priority_reason?: string;
  proof_needed?: string;
  kafs_tv_strategy?: string;
  legal_notice?: string;
  image_url?: string;
  evidence_images?: EvidenceImage[];
  selected?: boolean;
  source?: string;
  page_hint?: string;
  needs_deep_analysis?: boolean;
};

type RecommendedPlan = {
  plan_key?: string;
  plan_name?: string;
  reason?: string;
};

const DEFAULT_BRAND_SLUG = "dof-eagle-five";

export default function VendorAutoImportPage() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [vendorPlan, setVendorPlan] = useState("free");
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [catalogStep, setCatalogStep] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [progressLogs, setProgressLogs] = useState<string[]>([]);

  const [showVendorMemo, setShowVendorMemo] = useState(false);
  const [vendorMemo, setVendorMemo] = useState("");
  const [products, setProducts] = useState<ProductCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState("");

  const [message, setMessage] = useState("");
  const [companySummary, setCompanySummary] = useState("");
  const [recommendedPlan, setRecommendedPlan] = useState<RecommendedPlan | null>(null);
  const [topRecommendations, setTopRecommendations] = useState<string[]>([]);
  const [kafsPackage, setKafsPackage] = useState("");
  const [finalComment, setFinalComment] = useState("");
  const [productLimit, setProductLimit] = useState(1);
  const [analysisMode, setAnalysisMode] = useState<"website" | "pdf_product_list" | "">("");

  const selectedProducts = useMemo(
    () => products.filter((item) => selectedIds[item.temp_id]),
    [products, selectedIds],
  );

  const activeProduct = useMemo(
    () => products.find((item) => item.temp_id === activeId) || products[0] || null,
    [products, activeId],
  );

  const allSelected = products.length > 0 && selectedProducts.length === products.length;
  const isProductListOnly = analysisMode === "pdf_product_list";

  async function handleImport() {
    if (!websiteUrl.trim()) {
      alert("홈페이지 주소를 입력하세요.");
      return;
    }

    try {
      setLoading(true);
      resetResult();

      const res = await fetch("/api/vendor/auto-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website_url: websiteUrl.trim(),
          import_mode: "website",
          vendor_plan: vendorPlan,
          vendor_memo: vendorMemo.trim(),
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "AI 분석 실패");
        return;
      }

      applyAnalysisResult(json, "website");
    } catch (err) {
      console.error(err);
      alert("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCatalogUpload(file: File) {
    if (!file) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    try {
      setCatalogLoading(true);
      setCatalogStep("PDF 업로드 준비 중입니다...");
      setElapsedSec(0);
      resetResult(false);

      setProgressLogs([
        "📄 PDF 카탈로그 분석 시작",
        `📁 파일명: ${file.name}`,
        "⏳ 서버로 PDF를 보내는 중입니다.",
      ]);

      timer = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("vendor_plan", vendorPlan);
      formData.append("vendor_memo", vendorMemo.trim());
      formData.append("brand_slug", DEFAULT_BRAND_SLUG);

      setCatalogStep("PDF를 서버로 보내는 중입니다...");

      const res = await fetch("/api/vendor/catalog-import", {
        method: "POST",
        body: formData,
      });

      setCatalogStep("PDF를 나누고 제품명을 추출하는 중입니다...");

      const json = await res.json();

      if (Array.isArray(json.progress_logs)) {
        setProgressLogs(json.progress_logs);
      }

      if (!json.ok) {
        alert(json.error || "카탈로그 제품명 추출 실패");
        return;
      }

      setCatalogStep("제품명 추출이 완료되었습니다.");

      if (!Array.isArray(json.progress_logs)) {
        setProgressLogs((prev) => [
          ...prev,
          `✅ 제품명 추출 완료: ${json.total || 0}개 후보`,
        ]);
      }

      applyAnalysisResult(json, "pdf_product_list");
    } catch (error) {
      console.error(error);
      setProgressLogs((prev) => [...prev, "❌ 카탈로그 제품명 추출 중 오류 발생"]);
      alert("카탈로그 제품명 추출 중 오류가 발생했습니다.");
    } finally {
      if (timer) clearInterval(timer);
      setCatalogLoading(false);
      setCatalogStep("");
    }
  }

  async function handleDeepAnalysis() {
    if (selectedProducts.length === 0) {
      alert("정밀분석할 제품을 선택하세요.");
      return;
    }

    if (!websiteUrl.trim()) {
      alert(
        "정밀분석하려면 홈페이지 주소가 필요합니다.\n예: https://www.doff.co.kr 또는 제품안내 페이지 주소",
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("선택 제품 정밀분석 중입니다. 제품 사진·성분·소구점을 찾고 있습니다...");

      const res = await fetch("/api/vendor/product-deep-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website_url: websiteUrl.trim(),
          vendor_memo: vendorMemo.trim(),
          products: selectedProducts,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "선택 제품 정밀분석 실패");
        return;
      }

      applyAnalysisResult(json, "website");
      alert(json.message || "선택 제품 정밀분석이 완료되었습니다.");
    } catch (error) {
      console.error(error);
      alert("선택 제품 정밀분석 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProducts() {
    if (selectedProducts.length === 0) {
      alert("선택한 제품이 없습니다.");
      return;
    }

    if (isProductListOnly) {
      await handleDeepAnalysis();
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/vendor/brand-products/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_slug: DEFAULT_BRAND_SLUG,
          vendor_plan: vendorPlan,
          source_url: websiteUrl.trim(),
          vendor_memo: vendorMemo.trim(),
          products: selectedProducts,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "제품 저장 실패");
        return;
      }

      alert(json.message || `${selectedProducts.length}개 제품을 저장했습니다.`);
      location.href = "/vendor/brand-hall";
    } catch (error) {
      console.error(error);
      alert("제품 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function resetResult(clearLogs = true) {
    setMessage("");
    setProducts([]);
    setSelectedIds({});
    setActiveId("");
    setCompanySummary("");
    setRecommendedPlan(null);
    setTopRecommendations([]);
    setKafsPackage("");
    setFinalComment("");
    setProductLimit(getPlanLimit(vendorPlan));
    setAnalysisMode("");

    if (clearLogs) {
      setProgressLogs([]);
    }
  }

  function applyAnalysisResult(json: any, mode: "website" | "pdf_product_list") {
    const list = (json.products || []) as ProductCandidate[];

    setAnalysisMode(mode);
    setProducts(list);
    setSelectedIds(
      Object.fromEntries(list.map((item) => [item.temp_id, item.selected !== false])),
    );
    setActiveId(list[0]?.temp_id || "");
    setMessage(json.message || "");
    setCompanySummary(json.company_summary || "");
    setRecommendedPlan(json.recommended_plan || null);
    setTopRecommendations(json.top_recommendations || []);
    setKafsPackage(json.kafs_tv_package_suggestion || "");
    setFinalComment(json.final_comment || "");
    setProductLimit(Number(json.product_limit || getPlanLimit(vendorPlan)));
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds({});
      return;
    }

    setSelectedIds(Object.fromEntries(products.map((item) => [item.temp_id, true])));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <main style={S.page}>
      <section style={S.wrap}>
        <Link href="/vendor/manage" style={S.backBtn}>
          ← 업체 운영센터로 돌아가기
        </Link>

        <section style={S.hero}>
          <div style={S.kicker}>K-Agri Expo AI 상품전략센터</div>
          <h1 style={S.title}>AI 업체 자동입점센터</h1>
          <p style={S.desc}>
            홈페이지는 정밀분석, 대용량 PDF는 제품명만 먼저 빠르게 추출한 뒤 선택 제품만
            정밀분석하는 방식으로 운영합니다.
          </p>
        </section>

        <section style={S.grid2}>
          <section style={S.card}>
            <h2 style={S.cardTitle}>① 홈페이지 정밀분석</h2>
            <p style={S.guide}>
              홈페이지 주소를 입력하면 제품 후보, 대표 이미지, 우선순위, 농민 소구점,
              한국농수산TV 협업전략을 분석합니다.
            </p>

            <input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              type="text"
              placeholder="예: https://www.doff.co.kr"
              style={S.input}
            />

            <label style={S.selectLabel}>현재 입점 등급</label>
            <select
              value={vendorPlan}
              onChange={(e) => {
                setVendorPlan(e.target.value);
                setProductLimit(getPlanLimit(e.target.value));
              }}
              style={S.select}
            >
              <option value="free">무료 체험 · 대표상품 1개</option>
              <option value="basic">기본형 · 주력상품 3개</option>
              <option value="growth">성장형 · 핵심상품 10개</option>
              <option value="premium">프리미엄 · 전략상품 20개</option>
              <option value="vip">VIP 방송협업 · 최대 50개</option>
            </select>

            <button
              type="button"
              style={{
                ...S.primaryBtn,
                opacity: loading ? 0.65 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? "AI가 홈페이지를 분석하는 중..." : "홈페이지 AI 정밀분석 시작"}
            </button>
          </section>

          <section style={S.card}>
            <h2 style={S.cardTitle}>② PDF 제품명 빠른 추출</h2>
            <p style={S.guide}>
              대용량 카탈로그는 전체 정밀분석하면 오래 걸립니다. 먼저 제품명만 빠르게
              추출하고, 업체가 선택한 제품만 다음 단계에서 정밀분석합니다.
            </p>

            <input
              id="catalogFile"
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: "none" }}
              disabled={catalogLoading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCatalogUpload(file);
                e.currentTarget.value = "";
              }}
            />

            <label htmlFor="catalogFile" style={S.fileButton}>
              {catalogLoading ? "PDF 제품명 추출 중..." : "PDF 카탈로그 선택하기"}
            </label>

            {catalogLoading || progressLogs.length > 0 ? (
              <div style={S.progressBox}>
                <div style={S.progressTitle}>
                  {catalogLoading ? "AI가 카탈로그를 처리 중입니다" : "카탈로그 처리 기록"}
                </div>
                <div style={S.progressText}>{catalogStep || "처리 기록을 확인하세요."}</div>
                <div style={S.progressText}>경과 시간: {elapsedSec}초</div>

                {catalogLoading ? (
                  <div style={S.progressBar}>
                    <div style={S.progressFill} />
                  </div>
                ) : null}

                <div style={S.progressNotice}>
                  대용량 PDF는 몇 분 걸릴 수 있습니다. 이 화면을 닫지 마세요.
                </div>

                <div style={S.logBox}>
                  {progressLogs.map((log, index) => (
                    <div key={`${log}-${index}`} style={S.logLine}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </section>

        <section style={S.memoCard}>
          <button
            type="button"
            onClick={() => setShowVendorMemo((prev) => !prev)}
            style={S.memoToggle}
          >
            {showVendorMemo ? "▲ 업체 의견 닫기" : "▼ 업체 의견 추가하기 · 선택사항"}
          </button>

          {showVendorMemo ? (
            <div>
              <p style={S.guide}>
                안 써도 분석됩니다. 다만 올해 밀 제품, 재고 많은 제품, 신제품, 촬영 희망
                제품을 알려주면 AI 추천이 더 정확해집니다.
              </p>

              <textarea
                value={vendorMemo}
                onChange={(e) => setVendorMemo(e.target.value)}
                rows={6}
                placeholder={`예:
올해는 싹쓰리충과 멸규니를 밀고 싶습니다.
아미65는 재고가 많습니다.
질산칼슘LX는 공동구매보다 상담용으로 쓰고 싶습니다.
한국농수산TV 촬영은 병해충 제품 위주로 하고 싶습니다.`}
                style={S.textarea}
              />
            </div>
          ) : null}
        </section>

        {message ? (
          <section style={S.resultCard}>
            <div style={S.resultHeader}>
              <div>
                <h2 style={S.resultTitle}>{message}</h2>
                <div style={S.resultCount}>
                  전체 제품 {products.length}개 · 선택 {selectedProducts.length}개 · 현재 등급
                  권장 {productLimit}개
                </div>
              </div>

              <div style={S.actionRow}>
                <button type="button" onClick={toggleAll} style={S.smallBtn}>
                  {allSelected ? "전체 해제" : "전체 선택"}
                </button>

                <button
                  type="button"
                  onClick={handleSaveProducts}
                  disabled={saving || selectedProducts.length === 0}
                  style={{
                    ...S.saveBtn,
                    opacity: saving || selectedProducts.length === 0 ? 0.55 : 1,
                    cursor: saving || selectedProducts.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {saving
                    ? isProductListOnly
                      ? "정밀분석 중..."
                      : "처리 중..."
                    : isProductListOnly
                      ? `선택 ${selectedProducts.length}개 정밀분석하기`
                      : `선택 ${selectedProducts.length}개 브랜드관 등록`}
                </button>
              </div>
            </div>

            {isProductListOnly ? (
              <div style={S.noticeGuide}>
                현재는 <b>제품명만 추출한 1단계</b>입니다. 여기서 올해 밀 제품을 선택한 뒤
                <b> 선택 제품 정밀분석하기</b>를 누르면 성분, 사용법, 사진, 한국농수산TV
                협업전략을 채웁니다.
              </div>
            ) : null}

            <section style={S.summaryGrid}>
              {companySummary ? <InfoBox title="AI 업체 요약" text={companySummary} /> : null}

              {recommendedPlan ? (
                <InfoBox
                  title="AI 추천 입점 플랜"
                  text={`${recommendedPlan.plan_name || recommendedPlan.plan_key || "-"}\n${
                    recommendedPlan.reason || ""
                  }`}
                />
              ) : null}

              {kafsPackage ? (
                <InfoBox title="한국농수산TV 협업 제안" text={kafsPackage} />
              ) : null}

              {finalComment ? <InfoBox title="AI 최종 코멘트" text={finalComment} /> : null}
            </section>

            {topRecommendations.length > 0 ? (
              <ListBox title="AI 우선 안내" items={topRecommendations} />
            ) : null}

            <section style={S.workbench}>
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>선택</th>
                      <th style={S.th}>사진</th>
                      <th style={S.th}>우선</th>
                      <th style={S.th}>제품명</th>
                      <th style={S.th}>전시장</th>
                      <th style={S.th}>카테고리</th>
                      <th style={S.th}>추천 이유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((item) => {
                      const checked = !!selectedIds[item.temp_id];
                      const active = activeProduct?.temp_id === item.temp_id;

                      return (
                        <tr
                          key={item.temp_id}
                          onClick={() => setActiveId(item.temp_id)}
                          style={{
                            ...S.tr,
                            background: active ? "#ecfdf5" : checked ? "#f0fdf4" : "#ffffff",
                          }}
                        >
                          <td style={S.td}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleOne(item.temp_id);
                              }}
                              style={S.checkbox}
                            />
                          </td>

                          <td style={S.td}>
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.product_name} style={S.thumb} />
                            ) : (
                              <div style={S.noThumb}>없음</div>
                            )}
                          </td>

                          <td style={S.td}>
                            <span style={priorityStyle(item.priority)}>
                              {item.priority || "중"}
                            </span>
                          </td>
                          <td style={S.nameTd}>{item.product_name}</td>
                          <td style={S.td}>{item.recommended_hall || "-"}</td>
                          <td style={S.td}>{item.category || "-"}</td>
                          <td style={S.reasonTd}>
                            {item.priority_reason || item.selling_point || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <aside style={S.detailPanel}>
                {activeProduct ? (
                  <>
                    <div style={S.panelKicker}>
                      {isProductListOnly ? "제품명 후보" : "선택 제품 상세"}
                    </div>
                    <h3 style={S.panelTitle}>{activeProduct.product_name}</h3>

                    {activeProduct.image_url ? (
                      <img
                        src={activeProduct.image_url}
                        alt={activeProduct.product_name}
                        style={S.mainImage}
                      />
                    ) : (
                      <div style={S.mainImageEmpty}>
                        {isProductListOnly ? "정밀분석 후 이미지 연결" : "대표 이미지 없음"}
                      </div>
                    )}

                    <Detail label="전시장" value={activeProduct.recommended_hall || "-"} />
                    <Detail label="카테고리" value={activeProduct.category || "-"} />
                    <Detail label="성분·함량" value={activeProduct.ingredients || "-"} />
                    <Detail label="사용법·작물" value={activeProduct.usage || "-"} />
                    <Detail label="농민 문제" value={activeProduct.farmer_pain_point || "-"} />
                    <Detail label="농민 소구점" value={activeProduct.selling_point || "-"} />
                    <Detail label="우선순위 이유" value={activeProduct.priority_reason || "-"} />
                    <Detail label="보완자료" value={activeProduct.proof_needed || "-"} />
                    <Detail
                      label="한국농수산TV 협업"
                      value={activeProduct.kafs_tv_strategy || "-"}
                    />

                    {activeProduct.page_hint ? (
                      <Detail label="카탈로그 위치" value={activeProduct.page_hint} />
                    ) : null}

                    {activeProduct.legal_notice ? (
                      <div style={S.noticeBox}>
                        <b>표시·인증 확인사항</b>
                        <p>{activeProduct.legal_notice}</p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div style={S.emptyPanel}>왼쪽 표에서 제품을 선택하세요.</div>
                )}
              </aside>
            </section>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function getPlanLimit(plan: string) {
  if (plan === "free") return 1;
  if (plan === "basic") return 3;
  if (plan === "growth") return 10;
  if (plan === "premium") return 20;
  if (plan === "vip") return 50;
  return 1;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.detailItem}>
      <div style={S.detailLabel}>{label}</div>
      <div style={S.detailValue}>{value}</div>
    </div>
  );
}

function InfoBox({ title, text }: { title: string; text: string }) {
  return (
    <div style={S.infoBox}>
      <div style={S.infoTitle}>{title}</div>
      <p style={S.infoText}>{text}</p>
    </div>
  );
}

function ListBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={S.infoBox}>
      <div style={S.infoTitle}>{title}</div>
      <ul style={S.list}>
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function priorityStyle(priority?: string): React.CSSProperties {
  if (priority === "상") {
    return { ...S.priorityBadge, background: "#dcfce7", color: "#166534" };
  }

  if (priority === "하") {
    return { ...S.priorityBadge, background: "#f1f5f9", color: "#475569" };
  }

  return { ...S.priorityBadge, background: "#fef3c7", color: "#92400e" };
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f6f8f3", padding: 24, color: "#111827" },
  wrap: { maxWidth: 1380, margin: "0 auto" },
  backBtn: {
    display: "inline-flex",
    textDecoration: "none",
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 16,
    fontWeight: 900,
  },
  hero: {
    marginTop: 20,
    borderRadius: 30,
    background: "#111827",
    padding: 34,
    color: "#fff",
  },
  kicker: { color: "#86efac", fontSize: 15, fontWeight: 950 },
  title: { margin: "10px 0 0", fontSize: 42, lineHeight: 1.15, fontWeight: 950 },
  desc: { color: "#e5e7eb", fontSize: 20, marginTop: 14, lineHeight: 1.7, fontWeight: 800 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 24 },
  card: {
    marginTop: 24,
    background: "#fff",
    padding: 30,
    borderRadius: 24,
    border: "1px solid #d1d5db",
  },
  memoCard: {
    marginTop: 18,
    background: "#fff",
    padding: 22,
    borderRadius: 22,
    border: "1px solid #d1d5db",
  },
  memoToggle: {
    width: "100%",
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    color: "#166534",
    borderRadius: 16,
    padding: "16px 18px",
    fontSize: 18,
    fontWeight: 950,
    textAlign: "left",
    cursor: "pointer",
  },
  cardTitle: { margin: 0, color: "#111827", fontSize: 30, fontWeight: 950 },
  guide: { color: "#4b5563", fontSize: 18, marginTop: 10, lineHeight: 1.7, fontWeight: 800 },
  noticeGuide: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#78350f",
    fontSize: 17,
    lineHeight: 1.7,
    fontWeight: 850,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 18,
    padding: "20px 22px",
    fontSize: 20,
    fontWeight: 900,
    borderRadius: 16,
    border: "2px solid #9ca3af",
    background: "#fff",
    color: "#111827",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 18,
    padding: "18px 20px",
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.6,
    borderRadius: 16,
    border: "2px solid #9ca3af",
    background: "#fff",
    color: "#111827",
  },
  selectLabel: { display: "block", marginTop: 18, fontSize: 18, fontWeight: 950 },
  select: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 10,
    padding: "18px 20px",
    fontSize: 19,
    fontWeight: 900,
    borderRadius: 16,
    border: "2px solid #9ca3af",
    background: "#fff",
    color: "#111827",
  },
  primaryBtn: {
    width: "100%",
    marginTop: 24,
    border: 0,
    borderRadius: 18,
    background: "#16a34a",
    color: "#fff",
    padding: "22px",
    fontSize: 24,
    fontWeight: 950,
  },
  fileButton: {
    marginTop: 18,
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    background: "#16a34a",
    color: "#ffffff",
    padding: "22px",
    fontSize: 24,
    fontWeight: 950,
    cursor: "pointer",
  },
  progressBox: {
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
  },
  progressTitle: { fontSize: 19, fontWeight: 950 },
  progressText: { marginTop: 8, fontSize: 16, fontWeight: 850, lineHeight: 1.6 },
  progressBar: {
    marginTop: 14,
    width: "100%",
    height: 12,
    borderRadius: 999,
    background: "#dcfce7",
    overflow: "hidden",
  },
  progressFill: {
    width: "45%",
    height: "100%",
    borderRadius: 999,
    background: "#16a34a",
  },
  progressNotice: { marginTop: 12, fontSize: 14, fontWeight: 800, color: "#15803d" },
  logBox: {
    marginTop: 16,
    maxHeight: 260,
    overflowY: "auto",
    background: "#052e16",
    color: "#dcfce7",
    borderRadius: 12,
    padding: 16,
    fontSize: 13,
    lineHeight: 1.7,
    fontWeight: 700,
  },
  logLine: {
    whiteSpace: "pre-wrap",
    marginBottom: 4,
  },
  resultCard: {
    marginTop: 24,
    background: "#fff",
    padding: 30,
    borderRadius: 24,
    border: "1px solid #d1d5db",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  resultTitle: { margin: 0, fontSize: 30, fontWeight: 950 },
  resultCount: { marginTop: 12, fontSize: 19, color: "#16a34a", fontWeight: 950 },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  smallBtn: {
    border: "1px solid #16a34a",
    background: "#ecfdf5",
    color: "#166534",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 16,
    fontWeight: 950,
  },
  saveBtn: {
    border: 0,
    borderRadius: 14,
    background: "#111827",
    color: "#fff",
    padding: "12px 18px",
    fontSize: 16,
    fontWeight: 950,
  },
  summaryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 },
  infoBox: {
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: 18,
  },
  infoTitle: { fontSize: 20, fontWeight: 950 },
  infoText: {
    margin: "10px 0 0",
    whiteSpace: "pre-wrap",
    fontSize: 17,
    lineHeight: 1.8,
    fontWeight: 800,
    color: "#374151",
  },
  list: { margin: "12px 0 0", paddingLeft: 22, fontSize: 17, lineHeight: 1.9, fontWeight: 800 },
  workbench: { marginTop: 24, display: "grid", gridTemplateColumns: "1.35fr 0.65fr", gap: 18 },
  tableWrap: { overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 18 },
  table: { width: "100%", minWidth: 1080, borderCollapse: "collapse", background: "#fff" },
  th: {
    position: "sticky",
    top: 0,
    background: "#111827",
    color: "#fff",
    padding: 14,
    fontSize: 14,
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  tr: { cursor: "pointer", borderBottom: "1px solid #e5e7eb" },
  td: { padding: 14, fontSize: 14, fontWeight: 800, color: "#111827", verticalAlign: "top" },
  nameTd: { padding: 14, fontSize: 16, fontWeight: 950, color: "#111827", verticalAlign: "top" },
  reasonTd: {
    padding: 14,
    fontSize: 14,
    fontWeight: 800,
    color: "#374151",
    verticalAlign: "top",
    lineHeight: 1.55,
  },
  checkbox: { width: 22, height: 22, accentColor: "#16a34a" },
  thumb: {
    width: 64,
    height: 64,
    objectFit: "contain",
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  noThumb: {
    width: 64,
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 900,
  },
  priorityBadge: {
    display: "inline-flex",
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  detailPanel: {
    borderRadius: 22,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: 20,
    alignSelf: "start",
    position: "sticky",
    top: 20,
  },
  panelKicker: { color: "#16a34a", fontSize: 13, fontWeight: 950 },
  panelTitle: { margin: "8px 0 16px", fontSize: 26, fontWeight: 950, color: "#111827" },
  mainImage: {
    width: "100%",
    maxHeight: 260,
    objectFit: "contain",
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    marginBottom: 16,
  },
  mainImageEmpty: {
    height: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 16,
  },
  detailItem: {
    marginTop: 10,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: 14,
  },
  detailLabel: { fontSize: 13, fontWeight: 900, color: "#6b7280" },
  detailValue: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 1.6,
    fontWeight: 850,
    color: "#111827",
    whiteSpace: "pre-wrap",
  },
  noticeBox: {
    marginTop: 12,
    borderRadius: 16,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    padding: 16,
    fontSize: 15,
    lineHeight: 1.7,
    fontWeight: 800,
    color: "#9f1239",
  },
  emptyPanel: { color: "#64748b", fontSize: 16, fontWeight: 900 },
};