"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type VendorMe = {
  id: string; // vendors.id
  user_id: string;
  status: string | null;
};

export default function NewProductPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const params = useParams();
  const boothId = String(params?.id ?? "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const isVendorActive = !!vendor?.id && (vendor.status ?? "active") === "active";

  // form
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>(""); // 입력 편의상 string
  const [unit, setUnit] = useState("");
  const [description, setDescription] = useState("");

  async function loadMeVendor() {
    setLoading(true);
    setErr(null);

    try {
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

      if (vErr) throw vErr;
      setVendor((v as VendorMe) ?? null);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeVendor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    if (!vendor?.id) {
      alert("업체(vendor) 등록이 필요합니다.");
      return;
    }
    if (!isVendorActive) {
      alert(`업체 상태가 active가 아닙니다. (status=${vendor?.status ?? "null"})`);
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
      const { data, error } = await supabase
        .from("booth_products")
        .insert({
          booth_id: boothId,
          vendor_id: vendor.id,
          name: nm,
          price: priceInt,
          unit: unit.trim() || null,
          description: description.trim() || null,
          status: "draft",
        })
        .select("product_id")
        .maybeSingle();

      if (error) throw error;
      if (!data?.product_id) throw new Error("product_id 생성 결과가 없습니다.");

      alert("상품이 생성되었습니다. (draft)");
      router.push(`/booth/${boothId}/products/${data.product_id}`);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      alert(`생성 실패: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>상품 추가</h1>
          <div style={{ fontSize: 13, color: "#666" }}>
            booth_id: <span style={{ color: "#111" }}>{boothId}</span>
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
        </div>
      </div>

      {err ? <div style={errorBox}>에러: {err}</div> : null}

      {loading ? (
        <p style={{ marginTop: 16 }}>불러오는 중...</p>
      ) : (
        <section style={{ ...card, marginTop: 14 }}>
          <Field label="상품명(name) *">
            <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Field label="가격(price) - 원(정수)">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={input}
                placeholder="예) 39000"
              />
            </Field>

            <Field label="단위(unit)">
              <input value={unit} onChange={(e) => setUnit(e.target.value)} style={input} placeholder="예) 1박스, 10L" />
            </Field>
          </div>

          <div style={{ marginTop: 12 }}>
            <Field label="설명(description)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...input, minHeight: 140, resize: "vertical" }}
              />
            </Field>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button
              onClick={create}
              disabled={saving || !isVendorActive}
              style={{
                ...btnPrimary,
                opacity: saving || !isVendorActive ? 0.5 : 1,
                cursor: saving || !isVendorActive ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "생성 중..." : "생성(draft)"}
            </button>

            <button onClick={() => router.push(`/booth/${boothId}/products`)} style={btnGhost}>
              취소
            </button>
          </div>
        </section>
      )}
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

const errorBox: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #ffd2d2",
  background: "#fff5f5",
  whiteSpace: "pre-wrap",
};