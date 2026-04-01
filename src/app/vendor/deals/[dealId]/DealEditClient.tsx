"use client";

import React from "react";

type Deal = {
  deal_id: string;
  booth_id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  normal_price: number | null;
  expo_price: number | null;
  discount_percent: number | null;
  stock: number | null;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean | null;
  consulting_count: number | null;
};

type Asset = {
  id: string;
  kind: "image" | "brochure" | "youtube";
  title: string | null;
  storage_path: string | null;
  url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export default function DealEditClient({ deal, initialAssets }: { deal: Deal; initialAssets: Asset[] }) {
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState(deal.title ?? "");
  const [description, setDescription] = React.useState(deal.description ?? "");
  const [normalPrice, setNormalPrice] = React.useState(String(deal.normal_price ?? ""));
  const [expoPrice, setExpoPrice] = React.useState(String(deal.expo_price ?? ""));
  const [stock, setStock] = React.useState(String(deal.stock ?? ""));
  const [endAt, setEndAt] = React.useState(deal.end_at ? toLocalInput(deal.end_at) : "");
  const [isActive, setIsActive] = React.useState(!!deal.is_active);

  const [assets, setAssets] = React.useState<Asset[]>(initialAssets);

  // 업로드
  const [uploadKind, setUploadKind] = React.useState<"brochure" | "image">("brochure");
  const [uploadTitle, setUploadTitle] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  // 유튜브
  const [ytTitle, setYtTitle] = React.useState("");
  const [ytUrl, setYtUrl] = React.useState("");

  async function saveDeal() {
    setMsg(null);
    setSaving(true);

    const payload = {
      deal_id: deal.deal_id,
      title: title.trim(),
      description: description.trim(),
      normal_price: numOrNull(normalPrice),
      expo_price: numOrNull(expoPrice),
      stock: numOrNull(stock),
      end_at: endAt ? new Date(endAt).toISOString() : null,
      is_active: isActive,
    };

    const res = await fetch("/api/vendor/deals/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      setMsg(`저장 실패: ${t || "권한/입력값을 확인해 주십시오."}`);
      return;
    }

    setMsg("✅ 저장 완료");
  }

  async function uploadFile(file: File) {
    setMsg(null);
    setUploading(true);

    const fd = new FormData();
    fd.set("deal_id", deal.deal_id);
    fd.set("kind", uploadKind);
    fd.set("title", uploadTitle.trim());
    fd.set("file", file);

    const res = await fetch("/api/vendor/deals/assets/upload", {
      method: "POST",
      body: fd,
    });

    setUploading(false);

    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setMsg(`업로드 실패: ${j?.error || "업로드 오류"}`);
      return;
    }

    setMsg("✅ 업로드 완료");
    setUploadTitle("");
    setAssets((prev) => [j.asset as Asset, ...prev]);
  }

  async function addYoutube() {
    setMsg(null);
    const url = ytUrl.trim();
    if (!url) return;

    const res = await fetch("/api/vendor/deals/assets/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deal_id: deal.deal_id,
        kind: "youtube",
        title: ytTitle.trim(),
        url,
      }),
    });

    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setMsg(`유튜브 등록 실패: ${j?.error || "오류"}`);
      return;
    }

    setMsg("✅ 유튜브 등록 완료");
    setYtTitle("");
    setYtUrl("");
    setAssets((prev) => [j.asset as Asset, ...prev]);
  }

  async function deleteAsset(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;

    setMsg(null);
    const res = await fetch("/api/vendor/deals/assets/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ asset_id: id }),
    });

    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setMsg(`삭제 실패: ${j?.error || "오류"}`);
      return;
    }

    setAssets((prev) => prev.filter((a) => a.id !== id));
    setMsg("✅ 삭제 완료");
  }

  async function moveAsset(id: string, dir: -1 | 1) {
    const idx = assets.findIndex((a) => a.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= assets.length) return;

    const newArr = [...assets];
    const [a] = newArr.splice(idx, 1);
    newArr.splice(next, 0, a);

    // sort_order 재정렬
    const patched = newArr.map((x, i) => ({ id: x.id, sort_order: i }));
    setAssets(newArr);

    await fetch("/api/vendor/deals/assets/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: patched }),
    }).catch(() => {});
  }

  return (
    <main style={wrap}>
      <header style={header}>
        <div style={{ fontSize: 14, fontWeight: 950, opacity: 0.75 }}>업체 딜 관리</div>
        <h1 style={h1}>딜 편집</h1>
        <div style={{ fontSize: 16, color: "#444", marginTop: 6 }}>
          딜ID: <b style={mono}>{deal.deal_id}</b>
        </div>
      </header>

      {msg ? <div style={msgBox}>{msg}</div> : null}

      <section style={card}>
        <div style={sectionTitle}>딜 기본 정보</div>

        <label style={label}>
          딜 제목
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inp} placeholder="예: 영진로타리 산악형 돌분쇄기 특가" />
        </label>

        <label style={label}>
          설명(상세)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={ta}
            placeholder="제품 특징 / 적용 면적 / 추천 대상 / 설치/납기 안내 등"
          />
        </label>

        <div style={grid2}>
          <label style={label}>
            정상가(원)
            <input value={normalPrice} onChange={(e) => setNormalPrice(e.target.value)} style={inp} inputMode="numeric" placeholder="예: 12000000" />
          </label>

          <label style={label}>
            엑스포 특가(원)
            <input value={expoPrice} onChange={(e) => setExpoPrice(e.target.value)} style={inp} inputMode="numeric" placeholder="예: 9900000" />
          </label>

          <label style={label}>
            잔여 수량
            <input value={stock} onChange={(e) => setStock(e.target.value)} style={inp} inputMode="numeric" placeholder="예: 3" />
          </label>

          <label style={label}>
            마감 시간(선택)
            <input value={endAt} onChange={(e) => setEndAt(e.target.value)} style={inp} type="datetime-local" />
          </label>
        </div>

        <label style={{ ...label, marginTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input checked={isActive} onChange={(e) => setIsActive(e.target.checked)} type="checkbox" style={{ width: 22, height: 22 }} />
            <span style={{ fontSize: 18, fontWeight: 950 }}>공개(엑스포에 노출)</span>
          </div>
        </label>

        <button onClick={saveDeal} disabled={saving} style={btnPrimary}>
          {saving ? "저장 중..." : "저장하기"}
        </button>

        <a href={`/expo/${deal.deal_id}`} style={ghostBtn}>
          공개 페이지 미리보기 →
        </a>
      </section>

      <section style={card}>
        <div style={sectionTitle}>자료/사진/영상 등록</div>
        <div style={{ fontSize: 16, color: "#444", lineHeight: 1.6 }}>
          업로드하면 자동으로 딜 상세 페이지의 “제품 자료/영상”에 표시됩니다.
        </div>

        {/* 파일 업로드 */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #eee" }}>
          <div style={subTitle}>파일 업로드(팜플렛 PDF / 제품 사진)</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <select value={uploadKind} onChange={(e) => setUploadKind(e.target.value as any)} style={select}>
              <option value="brochure">팜플렛/PDF</option>
              <option value="image">제품 사진</option>
            </select>

            <input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              style={inpFlex}
              placeholder="표시 제목(선택) 예: 2026 카탈로그"
            />
          </div>

          <input
            type="file"
            style={fileInp}
            accept={uploadKind === "brochure" ? "application/pdf,image/*" : "image/*"}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              e.currentTarget.value = "";
            }}
            disabled={uploading}
          />

          <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginTop: 6 }}>
            * 버튼을 누르지 않아도 파일을 선택하면 자동 업로드됩니다.
          </div>
        </div>

        {/* 유튜브 등록 */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #eee" }}>
          <div style={subTitle}>유튜브 링크 등록</div>

          <input value={ytTitle} onChange={(e) => setYtTitle(e.target.value)} style={inp} placeholder="표시 제목(선택) 예: 시연 영상" />
          <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} style={inp} placeholder="유튜브 링크(URL)" />
          <button onClick={addYoutube} style={btnPrimary}>
            유튜브 추가
          </button>
        </div>
      </section>

      <section style={card}>
        <div style={sectionTitle}>등록된 자료 목록</div>

        {assets.length === 0 ? (
          <div style={hint}>아직 등록된 자료가 없습니다.</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {assets.map((a, idx) => (
              <div key={a.id} style={assetRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 950 }}>
                    [{a.kind}] {a.title || "(제목 없음)"}
                  </div>
                  <div style={{ fontSize: 14, color: "#666", marginTop: 6 }}>
                    {a.kind === "youtube" ? a.url : a.storage_path}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => moveAsset(a.id, -1)} style={smallBtn} disabled={idx === 0}>
                    ↑
                  </button>
                  <button onClick={() => moveAsset(a.id, 1)} style={smallBtn} disabled={idx === assets.length - 1}>
                    ↓
                  </button>
                  <button onClick={() => deleteAsset(a.id)} style={dangerBtn}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer style={{ marginTop: 18, fontSize: 14, color: "#666", lineHeight: 1.6 }}>
        운영 팁: 팜플렛은 PDF 1~2개면 충분하고, 사진은 3~6장만 올려도 “전시 느낌”이 확 납니다.
      </footer>
    </main>
  );
}

function numOrNull(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const wrap: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "18px 14px",
  minHeight: "100vh",
  fontFamily: "system-ui",
  background: "#fff",
};

const header: React.CSSProperties = {
  padding: "8px 2px 14px",
};

const h1: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: 30,
  fontWeight: 950,
  lineHeight: 1.2,
};

const mono: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const card: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  background: "#fff",
  padding: 14,
  marginTop: 12,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 950,
};

const subTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 950,
};

const label: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 950,
  display: "grid",
  gap: 8,
  marginTop: 12,
};

const inp: React.CSSProperties = {
  height: 54,
  padding: "14px 14px",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  fontSize: 18,
  outline: "none",
};

const inpFlex: React.CSSProperties = {
  ...inp,
  flex: 1,
};

const select: React.CSSProperties = {
  height: 54,
  padding: "0 12px",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  fontSize: 18,
  background: "#fff",
};

const ta: React.CSSProperties = {
  minHeight: 140,
  padding: "14px 14px",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  fontSize: 18,
  outline: "none",
  lineHeight: 1.7,
  resize: "vertical",
};

const grid2: React.CSSProperties = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const btnPrimary: React.CSSProperties = {
  marginTop: 14,
  height: 56,
  borderRadius: 18,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  fontSize: 18,
  cursor: "pointer",
  padding: "0 16px",
};

const ghostBtn: React.CSSProperties = {
  marginTop: 10,
  height: 56,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111",
  fontWeight: 950,
  fontSize: 18,
  cursor: "pointer",
  padding: "0 16px",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const fileInp: React.CSSProperties = {
  marginTop: 12,
  width: "100%",
  height: 56,
  borderRadius: 18,
  border: "1px dashed #cbd5e1",
  background: "#f9fafb",
  padding: "12px 14px",
  fontSize: 16,
};

const assetRow: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 12,
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const smallBtn: React.CSSProperties = {
  height: 44,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontWeight: 950,
  fontSize: 16,
  padding: "0 14px",
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  height: 44,
  borderRadius: 14,
  border: "1px solid #ef4444",
  background: "#fff",
  color: "#ef4444",
  fontWeight: 950,
  fontSize: 16,
  padding: "0 14px",
  cursor: "pointer",
};

const hint: React.CSSProperties = {
  marginTop: 12,
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  background: "#f9fafb",
  padding: 14,
  fontSize: 16,
  color: "#444",
  lineHeight: 1.6,
};

const msgBox: React.CSSProperties = {
  marginTop: 10,
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  background: "#f9fafb",
  padding: 14,
  fontSize: 16,
  fontWeight: 950,
};