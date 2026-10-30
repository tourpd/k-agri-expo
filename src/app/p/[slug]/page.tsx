import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getCrop, getProblem, problemsByCrop } from "@/lib/problems/catalog";
import { findAnswerProducts } from "@/lib/problems/products";
import StickyAsk from "@/components/problems/StickyAsk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProblem(slug);
  return { title: p ? `${p.title} | K-Agri Expo` : "문제 해결 | K-Agri Expo" };
}

function toEmbed(url?: string) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

/**
 * 문제 페이지 — 휴대폰 한 화면에서 끝나게
 *  1) 제목 + 증상 사진 + 한 줄
 *  2) 지금 할 일 3줄
 *  3) 영상 (있을 때만)
 *  4) 이럴 때 쓰는 자재 (많아야 2개, 버튼 하나)
 *  5) 아래 고정 띠: 전화하기 / 문의 남기기  ← 묻는 길은 이것 하나
 */
export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = getProblem(slug);
  if (!problem) notFound();

  const crop = getCrop(problem.crop);
  const products = await findAnswerProducts(problem, 2);
  const siblings = problemsByCrop(problem.crop).filter((p) => p.slug !== problem.slug && p.crop !== "common").slice(0, 2);
  const embed = toEmbed(problem.videoUrl);
  const photo = problem.imageUrls?.[0] ?? null;
  // 전화·문의는 첫 번째(가장 잘 맞는) 기업으로 갑니다. 기업 번호가 없으면 전화 버튼은 안 보입니다.
  const lead = products.find((p) => p.phone) ?? products[0] ?? null;

  return (
    <div style={S.wrap}>
      {/* 1. 제목 + 사진 + 한 줄 */}
      {crop && crop.key !== "common" ? (
        <Link href={`/crop/${crop.key}`} style={S.cropLink}>{crop.icon} {crop.label}</Link>
      ) : null}
      <h1 style={S.title}>{problem.title}</h1>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={`${problem.title} 증상`} style={S.photo} />
      ) : null}
      <p style={S.summary}>{problem.summary}</p>

      {/* 2. 지금 할 일 */}
      <section style={S.card}>
        <div style={S.cardTitle}>지금 할 일</div>
        <ol style={S.actions}>
          {problem.actions.map((a, i) => (
            <li key={i} style={S.action}>{a}</li>
          ))}
        </ol>
        <p style={S.cause}>{problem.cause}</p>
      </section>

      {/* 3. 영상 */}
      {embed ? (
        <section style={S.card}>
          <div style={S.cardTitle}>영상으로 보기</div>
          <div style={S.video}>
            <iframe src={embed} title={problem.title} allowFullScreen style={S.iframe} />
          </div>
        </section>
      ) : null}

      {/* 4. 자재 */}
      {problem.noProducts ? (
        <section style={S.card}>
          <div style={S.cardTitle}>먼저 원인부터</div>
          <p style={S.principle}>{problem.principle}</p>
          <a href="/ai-consult" style={S.bigBtn}>📷 사진으로 진단하기</a>
        </section>
      ) : products.length > 0 ? (
        <section style={S.card}>
          <div style={S.cardTitle}>이럴 때 쓰는 자재</div>
          <p style={S.principle}>{problem.principle}</p>
          <div style={S.products}>
            {products.map((p) => {
              const calcHref = p.source === "partner" ? `${p.href}&from=${problem.slug}` : null;
              return (
                <div key={p.id} style={S.product}>
                  <Link href={calcHref ?? p.href} style={S.productMain}>
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} style={S.productImg} />
                    ) : (
                      <div style={S.productImgEmpty}>{p.source === "partner" ? "📘" : ""}</div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={S.productBrand}>{p.brandName ?? "참여 기업"}</div>
                      <div style={S.productName}>{p.name}</div>
                      <div style={S.productPrice}>
                        {p.priceKrw ? `${p.priceKrw.toLocaleString("ko-KR")}원` : p.shortDescription ? <span style={S.productDesc}>{p.shortDescription}</span> : "가격 문의"}
                      </div>
                    </div>
                  </Link>
                  <Link href={calcHref ?? p.href} style={S.productCalc}>
                    {calcHref ? "내 밭엔 얼마나? ›" : "보기 ›"}
                  </Link>
                  {p.sourceLabel ? <div style={S.productSrc}>출처: {p.sourceLabel}</div> : null}
                </div>
              );
            })}
          </div>
          <div style={S.note}>농약은 온라인 판매가 안 됩니다. 아래 버튼으로 기업에 물으면 가까운 판매점을 알려 줍니다.</div>
        </section>
      ) : (
        <section style={S.card}>
          <div style={S.cardTitle}>자재는 문의로</div>
          <p style={S.principle}>{problem.principle}</p>
          <div style={S.note}>이 문제에 맞는 제품은 아래 '문의 남기기'로 물어보시면 맞는 기업을 연결해 드립니다.</div>
        </section>
      )}

      {/* 같은 작물 다른 문제 — 2개만 */}
      {siblings.length > 0 ? (
        <div style={S.siblings}>
          {siblings.map((p) => (
            <Link key={p.slug} href={`/p/${p.slug}`} style={S.sibling}>
              {p.title} ›
            </Link>
          ))}
        </div>
      ) : null}

      {/* 고정 띠 자리 확보 */}
      <div style={{ height: 84 }} />

      <StickyAsk
        problemSlug={problem.slug}
        problemTitle={problem.title}
        needsCrop={problem.crop === "common"}
        phone={lead?.phone ?? null}
        companyName={lead?.brandName ?? null}
        boothId={lead?.boothId ?? null}
      />
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "4px 0 20px", maxWidth: 680, margin: "0 auto" },
  cropLink: { fontSize: 13, fontWeight: 800, color: "#15803d", textDecoration: "none" },
  title: { marginTop: 6, fontSize: 28, fontWeight: 950, color: "#0f172a", letterSpacing: -0.5, wordBreak: "keep-all", lineHeight: 1.2 },
  photo: { marginTop: 12, width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 18, background: "#f1f5f9" },
  summary: { marginTop: 10, fontSize: 17, lineHeight: 1.6, color: "#1e293b", wordBreak: "keep-all", fontWeight: 600 },
  card: { marginTop: 16, padding: "16px", borderRadius: 18, background: "#fff", border: "1px solid #e5e7eb" },
  cardTitle: { fontSize: 15, fontWeight: 950, color: "#0f172a" },
  actions: { marginTop: 8, paddingLeft: 22, display: "grid", gap: 8, listStyle: "decimal" },
  action: { fontSize: 16, lineHeight: 1.6, color: "#1e293b", wordBreak: "keep-all" },
  cause: { marginTop: 12, paddingTop: 10, borderTop: "1px dashed #e2e8f0", fontSize: 13, lineHeight: 1.6, color: "#64748b", wordBreak: "keep-all" },
  video: { marginTop: 10, position: "relative", paddingTop: "56.25%", borderRadius: 14, overflow: "hidden", background: "#000" },
  iframe: { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 },
  principle: { marginTop: 6, fontSize: 14, lineHeight: 1.6, color: "#334155", wordBreak: "keep-all" },
  bigBtn: { display: "block", marginTop: 12, padding: "14px", borderRadius: 14, background: "#0f172a", color: "#fff", fontWeight: 900, fontSize: 16, textDecoration: "none", textAlign: "center" },
  products: { marginTop: 10, display: "grid", gap: 8 },
  product: { padding: 12, borderRadius: 14, border: "1px solid #e2e8f0", background: "#f8fafc" },
  productMain: { display: "flex", gap: 12, alignItems: "center", textDecoration: "none", color: "#0f172a" },
  productImg: { width: 64, height: 64, borderRadius: 12, objectFit: "cover", background: "#fff", flexShrink: 0 },
  productImgEmpty: { width: 64, height: 64, borderRadius: 12, background: "#e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 },
  productDesc: { fontSize: 13, fontWeight: 600, color: "#475569", lineHeight: 1.5, wordBreak: "keep-all" },
  productCalc: { display: "block", marginTop: 10, padding: "12px", borderRadius: 12, background: "#15803d", color: "#fff", fontWeight: 900, fontSize: 15, textDecoration: "none", textAlign: "center" },
  productSrc: { marginTop: 6, fontSize: 11, color: "#94a3b8" },
  productBrand: { fontSize: 12, fontWeight: 800, color: "#16a34a" },
  productName: { marginTop: 2, fontSize: 16, fontWeight: 950, wordBreak: "keep-all" },
  productPrice: { marginTop: 2, fontSize: 15, fontWeight: 900, color: "#0f172a" },
  note: { marginTop: 10, fontSize: 12, color: "#64748b", lineHeight: 1.6 },
  siblings: { marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" },
  sibling: { padding: "9px 12px", borderRadius: 999, background: "#f1f5f9", color: "#0f172a", fontWeight: 800, fontSize: 13, textDecoration: "none" },
};
