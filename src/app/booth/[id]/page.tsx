"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type PageProps = {
  params: { id: string };
};

function toYouTubeEmbedUrl(url: string) {
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;

  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watch?.[1]) return `https://www.youtube.com/embed/${watch[1]}`;

  if (url.includes("/embed/")) return url;
  return url;
}

// 스키마가 바뀌어도 안전하게 쓰기 위한 유틸
function getAny(obj: any, keys: string[]) {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== "") return obj[k];
  }
  return null;
}

function fmtPrice(v: any) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  if (!Number.isFinite(n)) return String(v);
  return `${n.toLocaleString("ko-KR")}원`;
}

export default function BoothPage({ params }: PageProps) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [booth, setBooth] = useState<any>(null);
  const [video, setVideo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);

        const boothId = params.id;

        // 1) booth
        const { data: boothData, error: boothErr } = await supabase
          .from("booths")
          .select("*")
          .eq("booth_id", boothId)
          .single();

        if (boothErr) throw boothErr;

        // 2) latest video (content_links)
        const { data: videosData, error: videosErr } = await supabase
          .from("content_links")
          .select("*")
          .eq("booth_id", boothId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (videosErr) throw videosErr;

        // 3) products
        const { data: productsData, error: productsErr } = await supabase
          .from("products")
          .select("*")
          .eq("booth_id", boothId)
          .order("created_at", { ascending: false });

        if (productsErr) throw productsErr;

        if (cancelled) return;

        setBooth(boothData);
        setVideo(videosData?.[0] ?? null);

        // ✅ [수정] 일단 전부 노출 (status 필터 때문에 안 보이던 문제 해결)
        setProducts(productsData ?? []);

        /*
        // 나중에 "승인된 것만" 보여주고 싶으면 아래로 바꾸세요.
        setProducts(
          (productsData ?? []).filter((p: any) => !("status" in p) || p.status === "approved")
        );
        */
      } catch (e: any) {
        if (cancelled) return;
        setErrMsg(e?.message || "알 수 없는 오류");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id, supabase]);

  if (loading) {
    return (
      <main style={{ padding: 40, maxWidth: 1100, margin: "0 auto" }}>
        <div>불러오는 중...</div>
      </main>
    );
  }

  if (errMsg || !booth) {
    return (
      <main style={{ padding: 40, maxWidth: 1100, margin: "0 auto" }}>
        <div>부스를 찾을 수 없습니다.</div>
        {errMsg && (
          <p style={{ color: "#c00", marginTop: 10 }}>
            에러: {errMsg}
          </p>
        )}
      </main>
    );
  }

  const embedUrl = video?.url ? toYouTubeEmbedUrl(video.url) : null;
  const visibleProducts = products ?? [];

  return (
    <main style={{ padding: 40, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>{booth.name}</h1>
        <p style={{ marginTop: 10, marginBottom: 0, color: "#333" }}>
          <strong>지역:</strong> {booth.region || "미입력"}
        </p>
      </header>

      {(booth.intro || booth.description) && (
        <section
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 18,
            marginTop: 18,
          }}
        >
          {booth.intro && (
            <>
              <h3 style={{ marginTop: 0 }}>소개</h3>
              <p style={{ marginTop: 8, marginBottom: 14 }}>{booth.intro}</p>
            </>
          )}

          {booth.description && (
            <>
              <h3 style={{ marginTop: booth.intro ? 16 : 0 }}>설명</h3>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                {booth.description}
              </p>
            </>
          )}
        </section>
      )}

      {embedUrl && (
        <section style={{ marginTop: 26 }}>
          <h3 style={{ marginTop: 0 }}>홍보 영상</h3>
          <div style={{ maxWidth: 980 }}>
            <iframe
              width="100%"
              height="520"
              src={embedUrl}
              title={video?.title || booth.name || "YouTube"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
              }}
            />
          </div>
        </section>
      )}

      <section style={{ marginTop: 30 }}>
        <h3 style={{ marginTop: 0 }}>제품</h3>

        {visibleProducts.length === 0 ? (
          <p>등록된 제품이 없습니다.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
              marginTop: 12,
            }}
          >
            {visibleProducts.map((p: any) => {
              const productId = p.product_id || p.id || p.name;

              // 스키마에 없을 수도 있는 값들: 있으면 표시, 없으면 생략
              const imageUrl = getAny(p, ["image_url", "image", "thumbnail_url"]);
              const buyUrl = getAny(p, ["buy_url", "purchase_url", "link"]);
              const priceRaw = getAny(p, ["price", "price_text", "price_won"]);
              const price = fmtPrice(priceRaw);

              return (
                <article
                  key={productId}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 14,
                    background: "#fff",
                  }}
                >
                  {imageUrl && (
                    <div
                      style={{
                        width: "100%",
                        height: 160,
                        overflow: "hidden",
                        borderRadius: 10,
                        border: "1px solid #f1f1f1",
                        marginBottom: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#fafafa",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={p.name || "product"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 18 }}>
                      {p.name || "이름 없음"}
                    </strong>
                    {price && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          border: "1px solid #e8e8e8",
                          background: "#fafafa",
                          fontSize: 13,
                        }}
                      >
                        {price}
                      </span>
                    )}
                  </div>

                  {Array.isArray(p.crops) && p.crops.length > 0 && (
                    <div style={{ marginTop: 10, color: "#333" }}>
                      <span style={{ fontWeight: 600 }}>작물:</span>{" "}
                      {p.crops.join(", ")}
                    </div>
                  )}

                  {Array.isArray(p.effects) && p.effects.length > 0 && (
                    <div style={{ marginTop: 6, color: "#333" }}>
                      <span style={{ fontWeight: 600 }}>효과:</span>{" "}
                      {p.effects.join(", ")}
                    </div>
                  )}

                  {p.description && (
                    <p style={{ marginTop: 10, marginBottom: 0, color: "#333" }}>
                      {p.description}
                    </p>
                  )}

                  {buyUrl && (
                    <div style={{ marginTop: 12 }}>
                      <a
                        href={buyUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "1px solid #e8e8e8",
                          textDecoration: "none",
                          color: "#111",
                          background: "#fafafa",
                        }}
                      >
                        구매/문의 링크 열기 →
                      </a>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}