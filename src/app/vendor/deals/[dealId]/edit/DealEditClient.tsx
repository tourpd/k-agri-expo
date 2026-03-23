// src/app/vendor/deals/[dealId]/edit/DealEditClient.tsx
"use client";

import React from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AssetRow = {
  id?: string;
  kind: "image" | "pdf" | "file";
  title: string;
  url: string;
  file_path: string;
  created_at?: string | null;
};

export type DealEditInitial = {
  deal_id: string;
  booth_id: string;
  title: string;
  description: string;
  youtube_url?: string;
  normal_price: number | null;
  expo_price: number | null;
  stock: number | null;
  end_at: string | null;
  is_active: boolean;
  image_url: string;
  assets: AssetRow[];
};

// ✅ bucket 고정
const DEAL_ASSETS_BUCKET = "deal-assets";

// ✅ 고령층 UX 기준(큰 글자/큰 버튼/큰 입력)
const UX = {
  fontBase: 18,
  label: 16,
  help: 14,
  inputH: 56,
  btnH: 56,
  radius: 16,
  maxW: 900,
};

function supabaseBrowser(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

function toNumOrNull(v: string): number | null {
  const t = String(v ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toIsoOrNull(v: string): string | null {
  const t = String(v ?? "").trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function fileKind(f: File): AssetRow["kind"] {
  const name = f.name.toLowerCase();
  if (f.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (f.type.startsWith("image/")) return "image";
  return "file";
}

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

export default function DealEditClient({ initial }: { initial: DealEditInitial }) {
  const sb = React.useMemo(() => supabaseBrowser(), []);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    title: initial.title,
    description: initial.description,
    youtube_url: initial.youtube_url ?? "",
    normal_price: initial.normal_price?.toString() ?? "",
    expo_price: initial.expo_price?.toString() ?? "",
    stock: initial.stock?.toString() ?? "",
    end_at: initial.end_at ? new Date(initial.end_at).toISOString().slice(0, 16) : "", // datetime-local
    is_active: initial.is_active,
  });

  const [assets, setAssets] = React.useState<AssetRow[]>(initial.assets || []);

  async function saveDeal() {
    setMsg(null);
    setSaving(true);
    try {
      const patch: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        youtube_url: form.youtube_url.trim(),
        normal_price: toNumOrNull(form.normal_price),
        expo_price: toNumOrNull(form.expo_price),
        stock: toNumOrNull(form.stock),
        end_at: toIsoOrNull(form.end_at),
        is_active: !!form.is_active,
      };

      const { error } = await sb.from("booth_deals").update(patch).eq("deal_id", initial.deal_id);

      if (error) throw error;
      setMsg("✅ 저장 완료");
    } catch (e: any) {
      setMsg(`❌ 저장 실패: ${e?.message || String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setMsg(null);
    setUploading(true);

    try {
      const uploaded: AssetRow[] = [];

      for (const f of Array.from(files)) {
        const kind = fileKind(f);
        const path = `deals/${initial.deal_id}/${Date.now()}_${safeName(f.name)}`;

        // ✅ Storage 업로드
        const { error: upErr } = await sb.storage.from(DEAL_ASSETS_BUCKET).upload(path, f, {
          upsert: false,
          contentType: f.type || undefined,
        });
        if (upErr) throw upErr;

        // ✅ public URL (버킷이 public일 때)
        const { data: pub } = sb.storage.from(DEAL_ASSETS_BUCKET).getPublicUrl(path);
        const url = pub?.publicUrl || "";

        // ✅ DB에 deal_assets 자동 등록
        const title = f.name;

        const { data: inserted, error: insErr } = await sb
          .from("deal_assets")
          .insert({
            deal_id: initial.deal_id,
            kind,
            title,
            url,
            file_path: path,
          })
          .select("id, deal_id, kind, title, url, file_path, created_at")
          .maybeSingle();

        if (insErr) throw insErr;

        uploaded.push({
          id: inserted?.id,
          kind,
          title: inserted?.title ?? title,
          url: inserted?.url ?? url,
          file_path: inserted?.file_path ?? path,
          created_at: inserted?.created_at ?? null,
        });
      }

      setAssets((prev) => [...uploaded, ...prev]);
      setMsg("✅ 업로드 + 자동 등록 완료");
    } catch (e: any) {
      setMsg(`❌ 업로드 실패: ${e?.message || String(e)}`);
    } finally {
      setUploading(false);
    }
  }

  async function removeAsset(a: AssetRow) {
    if (!a.id) return;
    setMsg(null);

    try {
      // 1) DB 삭제
      const { error: delErr } = await sb.from("deal_assets").delete().eq("id", a.id);
      if (delErr) throw delErr;

      // 2) Storage 삭제(실패해도 DB는 삭제됐으니 경고만)
      if (a.file_path) {
        const { error: stErr } = await sb.storage.from(DEAL_ASSETS_BUCKET).remove([a.file_path]);
        if (stErr) {
          setMsg(`⚠ DB는 삭제됨. 스토리지 삭제는 실패: ${stErr.message}`);
        }
      }

      setAssets((prev) => prev.filter((x) => x.id !== a.id));
      setMsg("✅ 삭제 완료");
    } catch (e: any) {
      setMsg(`❌ 삭제 실패: ${e?.message || String(e)}`);
    }
  }

  const headerRight = (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
      <a href="/vendor" style={btnGhost}>← 업체 대시보드</a>
      <a href={`/expo/${initial.deal_id}`} style={btnGhost} target="_blank" rel="noreferrer">
        상세 미리보기
      </a>
    </div>
  );

  return (
    <div style={shell}>
      <header style={topBar}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 950, fontSize: 22 }}>딜 편집</div>
          <div style={{ fontSize: 13, color: "#666" }}>deal_id: {initial.deal_id}</div>
        </div>
        {headerRight}
      </header>

      <main style={{ padding: 16 }}>
        {/* ✅ 기본 정보 */}
        <section style={card}>
          <div style={cardTitle}>기본 정보</div>

          <label style={label}>딜 제목</label>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="예) 영진로타리 산악형 돌분쇄기 (엑스포 특가)"
            style={input}
          />

          <label style={{ ...label, marginTop: 14 }}>유튜브 영상 링크</label>
          <input
            value={form.youtube_url}
            onChange={(e) => setForm((p) => ({ ...p, youtube_url: e.target.value }))}
            placeholder="https://www.youtube.com/watch?v=..."
            style={input}
          />
          <div style={help}>* 상세페이지 회색 영역에 영상 임베드로 노출할 수 있습니다.</div>

          <label style={{ ...label, marginTop: 14 }}>설명</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="제품 핵심 장점, 대상, 사용 조건, A/S, 배송 등"
            style={textarea}
          />

          <div style={grid2}>
            <div>
              <label style={label}>정상가(원)</label>
              <input
                value={form.normal_price}
                onChange={(e) => setForm((p) => ({ ...p, normal_price: e.target.value }))}
                inputMode="numeric"
                placeholder="예) 4200000"
                style={input}
              />
            </div>
            <div>
              <label style={label}>엑스포 특가(원)</label>
              <input
                value={form.expo_price}
                onChange={(e) => setForm((p) => ({ ...p, expo_price: e.target.value }))}
                inputMode="numeric"
                placeholder="예) 3150000"
                style={input}
              />
            </div>
          </div>

          <div style={grid2}>
            <div>
              <label style={label}>재고(수량)</label>
              <input
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                inputMode="numeric"
                placeholder="예) 7"
                style={input}
              />
            </div>
            <div>
              <label style={label}>행사 마감</label>
              <input
                value={form.end_at}
                onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))}
                type="datetime-local"
                style={input}
              />
              <div style={help}>* 노출용 “마감 카운트다운” 기준입니다.</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
            <label style={{ fontSize: UX.label, fontWeight: 900 }}>딜 활성화</label>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              style={{ width: 22, height: 22 }}
            />
            <div style={{ fontSize: UX.help, color: "#666" }}>* OFF면 상세 접근/노출을 제한할 수 있습니다.</div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            <button disabled={saving} onClick={saveDeal} style={btnPrimary}>
              {saving ? "저장 중..." : "저장하기"}
            </button>
            {msg ? <div style={{ fontSize: 15, fontWeight: 950, alignSelf: "center" }}>{msg}</div> : null}
          </div>
        </section>

        {/* ✅ 자료 업로드 (deal_assets 자동 등록) */}
        <section style={{ ...card, marginTop: 16 }}>
          <div style={cardTitle}>자료 업로드 (이미지 / PDF / 파일)</div>
          <div style={help}>
            * 업로드하면 <b>deal-assets</b> 버킷에 저장되고, 동시에 <b>deal_assets</b> 테이블에 자동 등록됩니다.
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <label style={uploadBox}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>여기를 눌러 파일 선택</div>
              <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                권장: PDF(카탈로그), JPG/PNG(제품 사진), 기타 첨부
              </div>
              <input
                type="file"
                multiple
                onChange={(e) => handleUpload(e.target.files)}
                style={{ display: "none" }}
              />
            </label>

            <button disabled={uploading} onClick={() => {}} style={btnDisabled}>
              {uploading ? "업로드 중..." : "업로드는 위 버튼(파일 선택)으로 진행됩니다"}
            </button>
          </div>

          {/* ✅ 등록된 자산 목록 */}
          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 950 }}>등록된 자료</div>

            {assets.length === 0 ? (
              <div style={{ fontSize: 15, color: "#666" }}>아직 등록된 자료가 없습니다.</div>
            ) : (
              assets.map((a) => (
                <div key={a.id || a.file_path} style={assetRow}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 950 }}>
                      {a.kind === "pdf" ? "📄" : a.kind === "image" ? "🖼️" : "📎"} {a.title || "파일"}
                    </div>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 4, wordBreak: "break-all" }}>
                      {a.url || a.file_path}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noreferrer" style={btnGhost}>
                        열기
                      </a>
                    ) : null}
                    <button onClick={() => removeAsset(a)} style={btnDanger}>
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <footer style={footer}>
          <div style={{ fontSize: 14, color: "#666" }}>
            * 이 화면은 <b>모바일 우선</b>으로 설계되어 있습니다. (버튼 56px+, 큰 입력창)
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ---------------- styles ---------------- */

const shell: React.CSSProperties = {
  maxWidth: UX.maxW,
  margin: "0 auto",
  fontFamily: "system-ui",
  fontSize: UX.fontBase,
  paddingBottom: 32,
};

const topBar: React.CSSProperties = {
  padding: "16px 16px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
};

const card: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: UX.radius,
  background: "#fff",
  padding: 16,
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 950,
};

const label: React.CSSProperties = {
  display: "block",
  marginTop: 12,
  marginBottom: 8,
  fontSize: UX.label,
  fontWeight: 900,
};

const help: React.CSSProperties = {
  marginTop: 8,
  fontSize: UX.help,
  color: "#666",
  lineHeight: 1.5,
};

const input: React.CSSProperties = {
  width: "100%",
  height: UX.inputH,
  borderRadius: UX.radius,
  border: "1px solid #d1d5db",
  padding: "0 14px",
  fontSize: UX.fontBase,
  outline: "none",
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 140,
  borderRadius: UX.radius,
  border: "1px solid #d1d5db",
  padding: "12px 14px",
  fontSize: UX.fontBase,
  outline: "none",
  lineHeight: 1.6,
  resize: "vertical",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
  marginTop: 12,
};

const btnPrimary: React.CSSProperties = {
  height: UX.btnH,
  padding: "0 18px",
  borderRadius: UX.radius,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  fontSize: 16,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  height: UX.btnH,
  padding: "0 16px",
  borderRadius: UX.radius,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111",
  fontWeight: 950,
  fontSize: 16,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const btnDanger: React.CSSProperties = {
  height: UX.btnH,
  padding: "0 16px",
  borderRadius: UX.radius,
  border: "1px solid #ef4444",
  background: "#fff",
  color: "#b91c1c",
  fontWeight: 950,
  fontSize: 16,
  cursor: "pointer",
};

const btnDisabled: React.CSSProperties = {
  height: UX.btnH,
  padding: "0 16px",
  borderRadius: UX.radius,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  color: "#6b7280",
  fontWeight: 900,
  fontSize: 16,
};

const uploadBox: React.CSSProperties = {
  border: "2px dashed #cbd5e1",
  borderRadius: UX.radius,
  padding: 16,
  cursor: "pointer",
  background: "#f8fafc",
};

const assetRow: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: UX.radius,
  padding: 14,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const footer: React.CSSProperties = {
  marginTop: 18,
  padding: "16px 16px",
  borderTop: "1px solid #e5e7eb",
};