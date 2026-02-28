"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type VendorMe = {
  id: string;
  user_id: string;
  status: string | null;
};

type Product = {
  product_id: string;
  booth_id: string;
  vendor_id: string;
  name: string;
  price: number | null;
  unit: string | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type Asset = {
  asset_id: string;
  product_id: string;
  booth_id: string;
  vendor_id: string;
  file_path: string;
  public_url: string | null;
  mime_type: string | null;
  bytes: number | null;
  sort_order: number;
  created_at: string;
};

const BUCKET = "booth-assets";

export default function ProductDetailPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const params = useParams();
  const boothId = String(params?.id ?? "");
  const productId = String((params as any)?.productId ?? "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const isVendorActive = !!vendor?.id && (vendor.status ?? "active") === "active";

  const [product, setProduct] = useState<Product | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // form
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [unit, setUnit] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "hidden">("draft");

  async function loadMeVendor() {
    const { data } = await supabase.auth.getUser();
    const u = data.user ?? null;
    setMeEmail(u?.email ?? null);

    if (!u?.id) {
      setVendor(null);
      return;
    }

    const { data: v, error: vErr } = await supabase
      .from("vendors")
      .select("id, user_id, status")
      .eq("user_id", u.id)
      .maybeSingle();

    if (vErr) {
      console.warn("[vendor me] blocked:", vErr.message);
      setVendor(null);
      return;
    }
    setVendor((v as VendorMe) ?? null);
  }

  async function loadProduct() {
    const { data, error } = await supabase
      .from("booth_products")
      .select("product_id, booth_id, vendor_id, name, price, unit, description, status, created_at, updated_at")
      .eq("product_id", productId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("상품을 찾을 수 없습니다.");

    const p = data as Product;

    // booth mismatch 방어
    if (p.booth_id !== boothId) throw new Error("booth_id가 일치하지 않습니다.");

    setProduct(p);
    setName(p.name ?? "");
    setPrice(p.price === null ? "" : String(p.price));
    setUnit(p.unit ?? "");
    setDescription(p.description ?? "");
    setStatus((p.status as any) ?? "draft");
  }

  async function loadAssets() {
    const { data, error } = await supabase
      .from("booth_product_assets")
      .select("asset_id, product_id, booth_id, vendor_id, file_path, public_url, mime_type, bytes, sort_order, created_at")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    setAssets((data ?? []) as Asset[]);
  }

  async function refresh() {
    setLoading(true);
    setErr(null);

    try {
      await loadMeVendor();
      await loadProduct();
      await loadAssets();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!boothId || !productId) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boothId, productId]);

  async function save() {
    if (!product) return;
    if (!vendor?.id) {
      alert("업체(vendor) 등록이 필요합니다.");
      return;
    }
    if (!isVendorActive) {
      alert(`업체 상태가 active가 아닙니다. (status=${vendor.status ?? "null"})`);
      return;
    }

    const nm = name.trim();
    if (!nm) {
      alert("상품명을 입력해 주세요.");
      return;
    }

    const priceInt =
      price.trim() === "" ? null : Number.isFinite(Number(price)) ? parseInt(price, 10) : null;

    setSaving(true);
    setErr(null);

    try {
      const { error } = await supabase
        .from("booth_products")
        .update({
          name: nm,
          price: priceInt,
          unit: unit.trim() || null,
          description: description.trim() || null,
          status,
        })
        .eq("product_id", productId);

      if (error) throw error;
      alert("저장 완료");
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      alert(`저장 실패: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function removeAsset(a: Asset) {
    if (!confirm("이미지를 삭제할까요?")) return;
    try {
      // 1) storage delete
      const { error: sErr } = await supabase.storage.from(BUCKET).remove([a.file_path]);
      if (sErr) throw sErr;

      // 2) db delete
      const { error: dErr } = await supabase.from("booth_product_assets").delete().eq("asset_id", a.asset_id);
      if (dErr) throw dErr;

      await refresh();
    } catch (e: any) {
      alert(`삭제 실패: ${e?.message ?? String(e)}`);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || !files.length) return;
    if (!product) return;
    if (!vendor?.id || !isVendorActive) {
      alert("업체 승인(active) 상태에서만 업로드 가능합니다.");
      return;
    }

    setSaving(true);
    setErr(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];

        const safeName = `${Date.now()}_${f.name.replace(/\s+/g, "_")}`;
        const path = `booth/${boothId}/products/${productId}/${safeName}`;

        const { data: up, error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, f, { upsert: false, contentType: f.type });

        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(up.path);

        // sort_order는 마지막 + 10 (간격을 둬서 추후 재정렬 편하게)
        const nextSort = (assets.at(-1)?.sort_order ?? 0) + 10;

        const { error: insErr } = await supabase.from("booth_product_assets").insert({
          product_id: productId,
          booth_id: boothId,
          vendor_id: vendor.id,
          file_path: up.path,
          public_url: pub.publicUrl ?? null,
          mime_type: f.type || null,
          bytes: f.size ?? null,
          sort_order: nextSort,
        });

        if (insErr) throw insErr;
      }

      alert("업로드 완료");
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      alert(`업로드 실패: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>불러오는 중...</div>;

  if (err) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900 }}>상품 상세</h1>
        <div style={errorBox}>에러: {err}</div>
        <button onClick={refresh} style={btnGhost}>새로고침</button>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <div>상품을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>상품 상세</h1>
          <div style={{ fontSize: 13, color: "#666" }}>
            product_id: <span style={{ color: "#111" }}>{productId}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={pill}>me: {meEmail ?? "not logged in"}</span>
          <span style={{ ...pill, background: isVendorActive ? "#e7ffef" : "#fff7e6" }}>
            vendor: {isVendorActive ? "YES" : "NO"}
          </span>

          <button onClick={() => router.push(`/booth/${boothId}/products`)} style={btnGhost}>
            목록
          </button>
          <button onClick={() => router.push(`/booth/${boothId}`)} style={btnGhost}>
            부스 상세
          </button>
        </div>
      </div>

      <section style={{ ...card, marginTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="상품명(name) *">
            <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
          </Field>

          <Field label="상태(status)">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} style={input}>
              <option value="draft">draft (비공개/작성중)</option>
              <option value="active">active (공개)</option>
              <option value="hidden">hidden (숨김)</option>
            </select>
          </Field>

          <Field label="가격(price) - 원(정수)">
            <input value={price} onChange={(e) => setPrice(e.target.value)} style={input} placeholder="예) 39000" />
          </Field>

          <Field label="단위(unit)">
            <input value={unit} onChange={(e) => setUnit(e.target.value)} style={input} placeholder="예) 1박스, 10L" />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="설명(description)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...input, minHeight: 140, resize: "vertical" }}
              />
            </Field>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button
            onClick={save}
            disabled={saving || !isVendorActive}
            style={{
              ...btnPrimary,
              opacity: saving || !isVendorActive ? 0.5 : 1,
              cursor: saving || !isVendorActive ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>

          <button onClick={refresh} disabled={saving} style={btnGhost}>
            새로고침
          </button>
        </div>
      </section>

      <section style={{ ...card, marginTop: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>이미지 업로드</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={saving || !isVendorActive}
            onChange={(e) => uploadFiles(e.target.files)}
          />
          <span style={{ fontSize: 12, color: "#666" }}>
            업로드 경로: <code>booth/{boothId}/products/{productId}/...</code>
          </span>
        </div>

        {!assets.length ? (
          <p style={{ marginTop: 12, color: "#666" }}>아직 업로드된 이미지가 없습니다.</p>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {assets.map((a) => {
              const url = a.public_url ?? "";
              return (
                <div key={a.asset_id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="asset" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10 }} />
                  ) : (
                    <div style={{ height: 160, background: "#fafafa", borderRadius: 10 }} />
                  )}

                  <div style={{ marginTop: 8, fontSize: 12, color: "#666", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {a.file_path}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                        보기
                      </a>
                    ) : null}
                    <button onClick={() => removeAsset(a)} style={btnMiniDanger}>
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 16,
  background: "#fff",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  outline: "none",
  fontSize: 14,
};

const pill: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #eee",
  borderRadius: 999,
  fontSize: 12,
  background: "#fafafa",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
};

const btnGhost: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 900,
};

const btnMiniDanger: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #ffd2d2",
  background: "#fff5f5",
  color: "#a40000",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
};

const errorBox: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #ffd2d2",
  background: "#fff5f5",
  whiteSpace: "pre-wrap",
};