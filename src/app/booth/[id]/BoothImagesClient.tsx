"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  fetchBoothImages,
  uploadBoothImage,
  insertBoothImageRow,
  setPrimaryBoothImage,
  removeBoothImageRow,
  removeBoothAssetObject,
  getSignedBoothAssetUrl,
  BoothImageRow,
} from "@/lib/boothImages";

export default function BoothImagesClient({ boothId }: { boothId: string }) {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [images, setImages] = useState<BoothImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const list = await fetchBoothImages(supabase, boothId);
      setImages(list);
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boothId]);

  function resetFileState() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  function onPickFile(f: File | null) {
    // 이전 미리보기 해제
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  }

  async function handleUpload() {
    if (!file) {
      setMsg("파일을 선택하세요.");
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      // 1) Storage 업로드 (경로: booths/<boothId>/images/<timestamp>_filename)
      const path = await uploadBoothImage(supabase, boothId, file);

      // 2) booth_images row insert (반드시 return row가 오도록 lib에서 구현)
      const row = await insertBoothImageRow(supabase, boothId, path);

      // 3) 새 업로드 이미지를 대표로 지정(요청하신 A안: is_primary)
      await setPrimaryBoothImage(supabase, row.id);

      resetFileState();
      await load();
      setMsg("업로드 완료");
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(img: BoothImageRow) {
    if (!confirm("삭제하시겠습니까?")) return;

    setBusy(true);
    setMsg(null);

    try {
      // 1) DB row 삭제
      await removeBoothImageRow(supabase, img.id);

      // 2) Storage object 삭제
      await removeBoothAssetObject(supabase, img.file_path);

      await load();
      setMsg("삭제 완료");
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handlePreview(img: BoothImageRow) {
    setMsg(null);
    try {
      const url = await getSignedBoothAssetUrl(supabase, img.file_path);
      window.open(url, "_blank");
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    }
  }

  async function handleSetPrimary(img: BoothImageRow) {
    setBusy(true);
    setMsg(null);
    try {
      await setPrimaryBoothImage(supabase, img.id);
      await load();
      setMsg("대표 이미지로 지정했습니다.");
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>부스 이미지</h2>
          <div style={{ fontSize: 12, color: "#666" }}>
            경로 규칙: <b>{`booths/${boothId}/images/<timestamp>_파일명`}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={load} disabled={busy || loading} style={btnGhost}>
            새로고침
          </button>
        </div>
      </div>

      {msg ? <div style={infoBox}>메시지: {msg}</div> : null}

      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input type="file" accept="image/*" disabled={busy} onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />

        <button onClick={handleUpload} disabled={busy || !file} style={{ ...btnPrimary, opacity: busy || !file ? 0.5 : 1 }}>
          {busy ? "처리 중..." : "업로드"}
        </button>

        {file ? (
          <button onClick={resetFileState} disabled={busy} style={btnGhost}>
            선택 해제
          </button>
        ) : null}
      </div>

      {previewUrl ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>선택한 파일 미리보기</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <img
              src={previewUrl}
              alt="preview"
              style={{
                width: 180,
                height: 180,
                objectFit: "cover",
                borderRadius: 12,
                border: "1px solid #eee",
                background: "#fafafa",
              }}
            />
            <div style={{ fontSize: 12, color: "#666" }}>
              <div>
                파일명: <b style={{ color: "#111" }}>{file?.name}</b>
              </div>
              <div>
                크기: <b style={{ color: "#111" }}>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "-"}</b>
              </div>
              <div>
                타입: <b style={{ color: "#111" }}>{file?.type || "-"}</b>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <div>불러오는 중...</div>
        ) : images.length === 0 ? (
          <div style={{ color: "#666" }}>이미지가 없습니다.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {images.map((img) => (
              <div key={img.id} style={rowCard}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: img.is_primary ? "#22c55e" : "#d1d5db",
                      border: "1px solid #e5e7eb",
                    }}
                    title={img.is_primary ? "대표 이미지" : "일반 이미지"}
                  />
                  <div>
                    <div style={{ fontWeight: 900 }}>{img.is_primary ? "⭐ 대표 이미지" : "일반 이미지"}</div>
                    <div style={{ fontSize: 12, color: "#666", wordBreak: "break-all" }}>{img.file_path}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button onClick={() => handlePreview(img)} disabled={busy} style={btnGhost}>
                    보기
                  </button>

                  {!img.is_primary ? (
                    <button onClick={() => handleSetPrimary(img)} disabled={busy} style={btnGhost}>
                      대표 지정
                    </button>
                  ) : (
                    <span style={pillGreen}>대표</span>
                  )}

                  <button onClick={() => handleDelete(img)} disabled={busy} style={btnDanger}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: "#888" }}>
        ※ 삭제는 <b>DB(booth_images)</b>와 <b>Storage(booth-assets)</b>에서 모두 제거됩니다.
      </div>
    </section>
  );
}

/* ---------------- styles ---------------- */

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 16,
  background: "#fff",
};

const rowCard: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const infoBox: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  color: "#1e40af",
  whiteSpace: "pre-wrap",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 900,
  cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ef4444",
  background: "#fff",
  color: "#ef4444",
  fontWeight: 900,
  cursor: "pointer",
};

const pillGreen: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #bbf7d0",
  background: "#dcfce7",
  color: "#166534",
  fontSize: 12,
  fontWeight: 900,
};