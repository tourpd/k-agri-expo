"use client";

import React, { useMemo, useState } from "react";

export type DealAsset = {
  asset_id: string;
  deal_id: string;
  kind: "youtube" | "image" | "pdf";
  title: string | null;
  url: string; // youtube url / image url / pdf url
  thumb_url: string | null;
  sort_order: number | null;
  created_at: string | null;
};

export default function DealMediaClient({
  assets,
  allowDownloads,
}: {
  assets?: DealAsset[] | null;
  allowDownloads: boolean;
}) {
  const safeAssets = useMemo(
    () => (Array.isArray(assets) ? assets : []),
    [assets]
  );

  const youtube = useMemo(
    () => safeAssets.find((a) => a.kind === "youtube") ?? null,
    [safeAssets]
  );

  const images = useMemo(
    () => safeAssets.filter((a) => a.kind === "image"),
    [safeAssets]
  );

  const pdfs = useMemo(
    () => safeAssets.filter((a) => a.kind === "pdf"),
    [safeAssets]
  );

  const [imgIdx, setImgIdx] = useState(0);
  const currentImg = images[imgIdx] ?? null;

  const ytEmbed = youtube ? toYoutubeEmbedUrl(youtube.url) : null;

  return (
    <section style={wrap}>
      <div style={head}>
        <div style={title}>전시 자료</div>
        <div style={sub}>영상 → 사진 → PDF 순서로 확인하시면 가장 빠릅니다.</div>
      </div>

      {/* 1) 영상 */}
      <div style={block}>
        <div style={blockTitle}>🎥 소개 영상</div>
        {ytEmbed ? (
          <div style={videoFrame}>
            <iframe
              title="youtube"
              src={ytEmbed}
              style={{ width: "100%", height: "100%", border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div style={empty}>영상이 아직 등록되지 않았습니다.</div>
        )}
      </div>

      {/* 2) 갤러리 */}
      <div style={block}>
        <div style={blockTitle}>🖼️ 제품 사진(갤러리)</div>
        {images.length === 0 ? (
          <div style={empty}>사진이 아직 등록되지 않았습니다.</div>
        ) : (
          <div>
            <div style={galleryFrame}>
              {currentImg ? (
                <img
                  src={currentImg.url}
                  alt={currentImg.title ?? "image"}
                  style={img}
                />
              ) : (
                <div style={emptyInFrame}>표시할 사진이 없습니다.</div>
              )}
            </div>

            <div style={thumbRow}>
              {images.map((it, i) => (
                <button
                  key={it.asset_id}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  style={thumbBtn(i === imgIdx)}
                >
                  <img
                    src={it.thumb_url ?? it.url}
                    alt={it.title ?? `thumb-${i + 1}`}
                    style={thumbImg}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3) PDF + 다운로드 */}
      <div style={block}>
        <div style={blockTitle}>📄 팜플렛(PDF)</div>

        {pdfs.length === 0 ? (
          <div style={empty}>PDF가 아직 등록되지 않았습니다.</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {pdfs.map((p) => (
              <div key={p.asset_id} style={pdfRow}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 950 }}>
                    {p.title ?? "카탈로그 PDF"}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 14,
                      color: "#6b7280",
                      lineHeight: 1.6,
                    }}
                  >
                    {allowDownloads ? "다운로드 가능" : "입장 등록 후 다운로드 가능"}
                  </div>
                </div>

                {allowDownloads ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    style={dlBtn}
                  >
                    다운로드
                  </a>
                ) : (
                  <button type="button" style={dlBtnDisabled} disabled>
                    잠금
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** YouTube URL -> embed */
function toYoutubeEmbedUrl(url: string) {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    const v = u.searchParams.get("v");
    if (v) {
      return `https://www.youtube.com/embed/${v}`;
    }

    if (u.pathname.includes("/embed/")) {
      return url;
    }
  } catch {
    return null;
  }

  return null;
}

/** styles */
const wrap: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  padding: 14,
};

const head: React.CSSProperties = {
  marginBottom: 10,
};

const title: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 950,
};

const sub: React.CSSProperties = {
  marginTop: 6,
  fontSize: 16,
  color: "#444",
  lineHeight: 1.6,
};

const block: React.CSSProperties = {
  marginTop: 12,
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "#fff",
  padding: 12,
};

const blockTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 950,
};

const videoFrame: React.CSSProperties = {
  marginTop: 10,
  width: "100%",
  aspectRatio: "16 / 9",
  borderRadius: 14,
  overflow: "hidden",
  background: "#111",
};

const empty: React.CSSProperties = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  fontSize: 16,
  color: "#444",
  lineHeight: 1.6,
};

const emptyInFrame: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f9fafb",
  color: "#6b7280",
  fontSize: 16,
};

const galleryFrame: React.CSSProperties = {
  marginTop: 10,
  width: "100%",
  aspectRatio: "16 / 10",
  borderRadius: 14,
  overflow: "hidden",
  background: "#f3f4f6",
};

const img: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const thumbRow: React.CSSProperties = {
  marginTop: 10,
  display: "flex",
  gap: 10,
  overflowX: "auto",
  paddingBottom: 6,
};

const thumbBtn = (active: boolean): React.CSSProperties => ({
  width: 86,
  height: 64,
  borderRadius: 12,
  border: active ? "2px solid #111" : "1px solid #e5e7eb",
  background: "#fff",
  padding: 0,
  cursor: "pointer",
  flex: "0 0 auto",
  overflow: "hidden",
});

const thumbImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const pdfRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 12,
  background: "#fff",
};

const dlBtn: React.CSSProperties = {
  height: 56,
  padding: "0 16px",
  borderRadius: 16,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  fontSize: 18,
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

const dlBtnDisabled: React.CSSProperties = {
  height: 56,
  padding: "0 16px",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  color: "#9ca3af",
  fontWeight: 950,
  fontSize: 18,
  whiteSpace: "nowrap",
};