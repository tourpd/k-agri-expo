"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Product = {
  product_id: string;
  booth_id: string;
  vendor_id: string;
  name: string;
  price: number | null;
  unit: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function BoothProductsPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const params = useParams();
  const boothId = String(params?.id ?? "");

  const [loading, setLoading] = useState(true);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const { data: me } = await supabase.auth.getUser();
      setMeEmail(me.user?.email ?? null);

      const { data, error } = await supabase
        .from("booth_products")
        .select("product_id, booth_id, vendor_id, name, price, unit, status, created_at, updated_at")
        .eq("booth_id", boothId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts((data ?? []) as Product[]);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!boothId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boothId]);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>상품 목록</h1>
          <div style={{ fontSize: 13, color: "#666" }}>
            booth_id: <span style={{ color: "#111" }}>{boothId}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={pill}>me: {meEmail ?? "not logged in"}</span>

          <button onClick={load} disabled={loading} style={btnGhost}>
            새로고침
          </button>

          <button
            onClick={() => router.push(`/booth/${boothId}/products/new`)}
            style={btnPrimary}
          >
            + 상품 추가
          </button>

          <button onClick={() => router.push(`/booth/${boothId}`)} style={btnGhost}>
            부스 상세로
          </button>
        </div>
      </div>

      {err ? <div style={errorBox}>에러: {err}</div> : null}

      {loading ? (
        <p style={{ marginTop: 16 }}>불러오는 중...</p>
      ) : !products.length ? (
        <p style={{ marginTop: 16, color: "#666" }}>아직 등록된 상품이 없습니다.</p>
      ) : (
        <ul style={{ marginTop: 16, display: "grid", gap: 10, padding: 0, listStyle: "none" }}>
          {products.map((p) => (
            <li key={p.product_id} style={row}>
              <Link
                href={`/booth/${boothId}/products/${p.product_id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                      {fmtPrice(p.price)} {p.unit ? `· ${p.unit}` : ""} · status: {p.status}
                    </div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis" }}>
                      product_id: {p.product_id}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={pillMini}>{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function fmtPrice(price: number | null) {
  if (price === null || !Number.isFinite(price)) return "가격 미입력";
  return `${price.toLocaleString()}원`;
}

const pill: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #eee",
  borderRadius: 999,
  fontSize: 12,
  background: "#fafafa",
};

const pillMini: React.CSSProperties = {
  padding: "4px 8px",
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

const row: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 12,
  background: "#fff",
};

const errorBox: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #ffd2d2",
  background: "#fff5f5",
  whiteSpace: "pre-wrap",
};