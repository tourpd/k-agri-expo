"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Booth = {
  booth_id: string;
  owner_user_id: string | null;
  vendor_id: string | null;      // ✅ vendors.id
  vendor_user_id: string | null; // (구 컬럼) 남아있어도 이제는 안 씀
  name: string | null;
  region: string | null;
  status: string | null;
  created_at: string;
};

type VendorMe = {
  id: string;             // vendors.id
  user_id: string;        // auth uid
  status: string | null;  // active/pending/suspended 등
  email: string | null;
  company_name: string | null;
};

export default function BoothsListClient() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [tab, setTab] = useState<"public" | "mine">("public");

  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);

  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const isVendorActive = !!vendor?.id && (vendor.status ?? "active") === "active";

  const [publicBooths, setPublicBooths] = useState<Booth[]>([]);
  const [myBooths, setMyBooths] = useState<Booth[]>([]);

  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function loadMe() {
    const { data } = await supabase.auth.getUser();
    const u = data.user ?? null;
    setMeId(u?.id ?? null);
    setMeEmail(u?.email ?? null);
    return u;
  }

  async function loadVendorMe(userId: string) {
    const { data, error } = await supabase
      .from("vendors")
      .select("id, user_id, status, email, company_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[vendor me] blocked:", error.message);
      setVendor(null);
      return;
    }
    setVendor((data as VendorMe) ?? null);
  }

  async function loadPublicBooths() {
    const { data, error } = await supabase
      .from("booths")
      .select("booth_id, owner_user_id, vendor_id, vendor_user_id, name, region, status, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setPublicBooths((data ?? []) as Booth[]);
  }

  async function loadMyBooths(userId: string) {
    const { data, error } = await supabase
      .from("booths")
      .select("booth_id, owner_user_id, vendor_id, vendor_user_id, name, region, status, created_at")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setMyBooths((data ?? []) as Booth[]);
  }

  async function refreshAll() {
    setLoading(true);
    setErrMsg(null);

    try {
      const u = await loadMe();
      await loadPublicBooths();

      if (u?.id) {
        await Promise.all([loadMyBooths(u.id), loadVendorMe(u.id)]);
      } else {
        setMyBooths([]);
        setVendor(null);
      }
    } catch (e: any) {
      console.error(e);
      setErrMsg(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goCreateBooth() {
    if (!meId) {
      alert("로그인이 필요합니다.");
      router.push(`/login?next=/booth/new`);
      return;
    }
    if (!isVendorActive) {
      alert("업체 승인(active) 후 생성 가능합니다.");
      return;
    }
    router.push("/booth/new");
  }

  const list = tab === "public" ? publicBooths : myBooths;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>부스 목록</h1>
          <div style={{ fontSize: 13, color: "#666" }}>공개(active) 부스 / 내 부스를 분리했습니다.</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={pill}>me: {meEmail ?? "not logged in"}</span>

          <span style={{ ...pill, background: isVendorActive ? "#e7ffef" : "#fff7e6" }}>
            vendor: {isVendorActive ? "YES" : "NO"}
          </span>

          {vendor?.id ? <span style={pillMini}>vendor_id: {vendor.id}</span> : null}
          {vendor?.status ? <span style={pillMini}>vendor_status: {vendor.status}</span> : null}

          <button onClick={refreshAll} disabled={loading} style={btnGhost}>
            새로고침
          </button>

          <button
            onClick={goCreateBooth}
            disabled={loading || !meId || !isVendorActive}
            title={!meId ? "로그인이 필요합니다" : !isVendorActive ? "업체 승인(active) 후 생성 가능합니다" : ""}
            style={{
              ...btnPrimary,
              opacity: loading || !meId || !isVendorActive ? 0.5 : 1,
              cursor: loading || !meId || !isVendorActive ? "not-allowed" : "pointer",
            }}
          >
            + 부스 만들기
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={() => setTab("public")} style={tabBtn(tab === "public")}>
          공개 부스
        </button>
        <button onClick={() => setTab("mine")} style={tabBtn(tab === "mine")}>
          내 부스
        </button>
      </div>

      {errMsg ? <div style={errorBox}>에러: {errMsg}</div> : null}

      {loading ? (
        <p style={{ marginTop: 16 }}>불러오는 중...</p>
      ) : !list.length ? (
        <p style={{ marginTop: 16, color: "#666" }}>
          {tab === "public" ? "아직 공개(active) 부스가 없습니다." : "아직 내 부스가 없습니다."}
        </p>
      ) : (
        <ul style={{ marginTop: 16, display: "grid", gap: 10, padding: 0, listStyle: "none" }}>
          {list.map((b) => (
            <li key={b.booth_id} style={row}>
              <a href={`/booth/${b.booth_id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 15 }}>{b.name || "이름 없음"}</div>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                      {b.region || "지역 미입력"} · status: {b.status || "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis" }}>
                      booth_id: {b.booth_id}
                    </div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
                      vendor_id: {b.vendor_id ?? "-"}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={pillMini}>{tab === "public" ? "공개" : "내 부스"}</span>
                    <span style={pillMini}>{new Date(b.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: active ? "#111" : "#fff",
  color: active ? "#fff" : "#111",
  fontWeight: 900,
  cursor: "pointer",
});

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