"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type UserInfo = { id: string; email: string | null };

type VendorRow = {
  id: string;
  user_id: string;
  email: string | null;
  company_name: string | null;
  created_at: string;
};

type VerificationRow = {
  id: string;
  user_id: string;
  business_type: "개인" | "법인" | null;
  company_name: string | null;
  ceo_name: string | null;
  business_number: string | null;
  license_url: string | null;
  corp_doc_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type BoothRow = {
  booth_id: string;
  vendor_user_id: string | null;
  owner_user_id: string | null;

  name: string | null;
  category_primary: string | null;
  region: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  intro: string | null;
  description: string | null;

  status: string | null; // draft/active 등
  created_at: string;
};

type ProductRow = {
  product_id?: string;
  id?: string;

  booth_id: string;
  name: string | null;
  price_text: string | null;
  description: string | null;
  image_url: string | null;
  buy_url: string | null;

  is_live?: boolean | null;
  live_price_text?: string | null;
  live_end_at?: string | null;

  created_at?: string;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function isUuidLike(v: string) {
  return /^[0-9a-fA-F-]{36}$/.test(v);
}

const ui = {
  page: { padding: 28, maxWidth: 1120, margin: "0 auto" },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: 800, margin: 0 },
  subtitle: { margin: "6px 0 0", color: "#666", fontSize: 13 },

  chipRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 },
  chip: {
    border: "1px solid #eee",
    background: "#fafafa",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 13,
  },

  btnRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e8e8e8",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700 as const,
  },
  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800 as const,
  },
  btnDanger: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ffd0d0",
    background: "#fff",
    color: "#c60000",
    cursor: "pointer",
    fontWeight: 800 as const,
  },

  grid2: { display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, marginTop: 16 },
  card: {
    border: "1px solid #eee",
    borderRadius: 18,
    padding: 16,
    background: "#fff",
  },
  cardTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  cardTitle: { fontWeight: 900, margin: 0, fontSize: 16 },

  list: { display: "flex", flexDirection: "column" as const, gap: 10, marginTop: 12 },
  item: {
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 12,
    cursor: "pointer",
    background: "#fff",
  },
  itemActive: { borderColor: "#111" },

  label: { fontSize: 12, fontWeight: 800, marginBottom: 6, color: "#111" },
  input: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #e9e9e9",
    padding: "10px 12px",
    outline: "none",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #e9e9e9",
    padding: "10px 12px",
    outline: "none",
    fontSize: 14,
    minHeight: 100,
    resize: "vertical" as const,
  },

  hint: { marginTop: 8, color: "#777", fontSize: 12 },
  hr: { border: 0, borderTop: "1px solid #f0f0f0", margin: "16px 0" },

  badgeOk: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #d8f5d8",
    background: "#f2fff2",
    color: "#0a7a0a",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800 as const,
  },
  badgeWait: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #ffe3b5",
    background: "#fff7ea",
    color: "#8a5a00",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800 as const,
  },
  badgeNo: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #eee",
    background: "#fafafa",
    color: "#666",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800 as const,
  },
};

export default function VendorPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [msg, setMsg] = useState<string>("");

  const [me, setMe] = useState<UserInfo | null>(null);

  const [vendor, setVendor] = useState<VendorRow | null>(null);
  const [verification, setVerification] = useState<VerificationRow | null>(null);

  const [booths, setBooths] = useState<BoothRow[]>([]);
  const [activeBoothId, setActiveBoothId] = useState<string | null>(null);
  const activeBooth = booths.find((b) => b.booth_id === activeBoothId) || null;

  // booth form
  const [bName, setBName] = useState("");
  const [bRegion, setBRegion] = useState("");
  const [bCategory, setBCategory] = useState("");
  const [bStatus, setBStatus] = useState("draft");
  const [bContact, setBContact] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [bEmail, setBEmail] = useState("");
  const [bIntro, setBIntro] = useState("");
  const [bDesc, setBDesc] = useState("");

  // product form
  const [pName, setPName] = useState("");
  const [pPriceText, setPPriceText] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pImageUrl, setPImageUrl] = useState("");
  const [pBuyUrl, setPBuyUrl] = useState("");
  const [pIsLive, setPIsLive] = useState(false);
  const [pLivePriceText, setPLivePriceText] = useState("");
  const [pLiveEndAt, setPLiveEndAt] = useState("");

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  // verification form
  const [vBusinessType, setVBusinessType] = useState<"개인" | "법인">("개인");
  const [vCompanyName, setVCompanyName] = useState("");
  const [vCeoName, setVCeoName] = useState("");
  const [vBizNo, setVBizNo] = useState("");
  const [vLicenseFile, setVLicenseFile] = useState<File | null>(null);
  const [vCorpFile, setVCorpFile] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const { data: sess } = await supabase.auth.getSession();
        const user = sess?.session?.user;
        if (!user) {
          if (!cancelled) window.location.href = "/login?force=1";
          return;
        }

        const u: UserInfo = { id: user.id, email: user.email ?? null };
        if (!cancelled) setMe(u);

        // vendors row
        const vRes = await supabase
          .from("vendors")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (vRes.error) throw vRes.error;

        let vRow = vRes.data as VendorRow | null;
        if (!vRow) {
          const ins = await supabase
            .from("vendors")
            .insert({ user_id: user.id, email: user.email ?? null })
            .select("*")
            .single();
          if (ins.error) throw ins.error;
          vRow = ins.data as VendorRow;
        }

        if (!cancelled) setVendor(vRow);

        // verification row (latest)
        const ver = await supabase
          .from("vendor_verifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (ver.error) {
          // 테이블이 아직 없으면 여기서 에러날 수 있음 — 화면은 계속 진행
          console.warn("vendor_verifications load failed:", ver.error.message);
        } else {
          if (!cancelled) setVerification((ver.data as VerificationRow) ?? null);
        }

        // booths
        const bRes = await supabase
          .from("booths")
          .select("*")
          .eq("vendor_user_id", user.id)
          .order("created_at", { ascending: false });

        if (bRes.error) throw bRes.error;

        const bList = (bRes.data as BoothRow[]) ?? [];
        if (!cancelled) setBooths(bList);

        if (!cancelled) {
          const firstId = bList[0]?.booth_id ?? null;
          setActiveBoothId(firstId);
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setMsg(`오류: ${e?.message ?? "알 수 없는 오류"}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // booth selection -> fill form & load products
  useEffect(() => {
    (async () => {
      setMsg("");
      if (!activeBoothId) return;

      const b = booths.find((x) => x.booth_id === activeBoothId);
      if (!b) return;

      setBName(b.name ?? "");
      setBRegion(b.region ?? "");
      setBCategory(b.category_primary ?? "");
      setBStatus(b.status ?? "draft");
      setBContact(b.contact_name ?? "");
      setBPhone(b.phone ?? "");
      setBEmail(b.email ?? (me?.email ?? ""));
      setBIntro(b.intro ?? "");
      setBDesc(b.description ?? "");

      // load products for booth
      const pr = await supabase
        .from("products")
        .select("*")
        .eq("booth_id", activeBoothId)
        .order("created_at", { ascending: false });

      if (pr.error) {
        console.warn("products load failed:", pr.error.message);
        setProducts([]);
        return;
      }
      setProducts((pr.data as ProductRow[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBoothId]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login?force=1";
  }

  function goLogin() {
    window.location.href = "/login?force=1";
  }

  async function reloadSoft() {
    window.location.reload();
  }

  async function ensureVendorRow() {
    setMsg("");
    const { data: sess } = await supabase.auth.getSession();
    const user = sess?.session?.user;
    if (!user) {
      window.location.href = "/login?force=1";
      return;
    }

    const vRes = await supabase.from("vendors").select("*").eq("user_id", user.id).maybeSingle();
    if (vRes.error) throw vRes.error;

    let vRow = vRes.data as VendorRow | null;
    if (!vRow) {
      const ins = await supabase.from("vendors").insert({ user_id: user.id, email: user.email ?? null }).select("*").single();
      if (ins.error) throw ins.error;
      vRow = ins.data as VendorRow;
    }
    setVendor(vRow);
    setMsg("vendors 재확인 완료");
  }

  async function createBooth() {
    setMsg("");
    const { data: sess } = await supabase.auth.getSession();
    const user = sess?.session?.user;
    if (!user) return (window.location.href = "/login?force=1");

    const draftName = (user.email?.split("@")[0] || "mybooth").slice(0, 30);

    const ins = await supabase
      .from("booths")
      .insert({
        vendor_user_id: user.id,
        owner_user_id: user.id,
        name: draftName,
        status: "draft",
        email: user.email ?? null,
      })
      .select("*")
      .single();

    if (ins.error) {
      setMsg(`부스 생성 실패: ${ins.error.message}`);
      return;
    }

    const row = ins.data as BoothRow;
    const next = [row, ...booths];
    setBooths(next);
    setActiveBoothId(row.booth_id);
    setMsg("부스가 생성되었습니다. 내용을 입력하고 저장하세요.");
  }

  async function saveBooth() {
    setMsg("");
    if (!activeBoothId) return;

    const payload = {
      name: bName || null,
      region: bRegion || null,
      category_primary: bCategory || null,
      status: bStatus || null,
      contact_name: bContact || null,
      phone: bPhone || null,
      email: bEmail || null,
      intro: bIntro || null,
      description: bDesc || null,
    };

    const up = await supabase.from("booths").update(payload).eq("booth_id", activeBoothId).select("*").single();
    if (up.error) {
      setMsg(`저장 실패: ${up.error.message}`);
      return;
    }

    const updated = up.data as BoothRow;
    setBooths((prev) => prev.map((x) => (x.booth_id === updated.booth_id ? updated : x)));
    setMsg("저장 완료");
  }

  function previewBooth() {
    if (!activeBoothId) return;
    window.open(`/booth/${activeBoothId}`, "_blank", "noopener,noreferrer");
  }

  async function deleteBooth() {
    setMsg("");
    if (!activeBoothId) return;
    if (!confirm("정말 이 부스를 삭제하시겠습니까? (연결된 제품도 함께 정리해야 합니다)")) return;

    // products 먼저 삭제(필요할 수 있음)
    const delP = await supabase.from("products").delete().eq("booth_id", activeBoothId);
    if (delP.error) {
      setMsg(`제품 삭제 실패: ${delP.error.message}`);
      return;
    }

    const delB = await supabase.from("booths").delete().eq("booth_id", activeBoothId);
    if (delB.error) {
      setMsg(`부스 삭제 실패: ${delB.error.message}`);
      return;
    }

    setBooths((prev) => prev.filter((x) => x.booth_id !== activeBoothId));
    setActiveBoothId((prev) => {
      const rest = booths.filter((x) => x.booth_id !== prev);
      return rest[0]?.booth_id ?? null;
    });
    setProducts([]);
    setMsg("부스 삭제 완료");
  }

  async function createProduct() {
    setMsg("");
    if (!activeBoothId) return setMsg("부스를 먼저 선택하세요.");

    const payload: any = {
      booth_id: activeBoothId,
      name: pName || null,
      price_text: pPriceText || null,
      description: pDesc || null,
      image_url: pImageUrl || null,
      buy_url: pBuyUrl || null,
      is_live: pIsLive,
      live_price_text: pIsLive ? pLivePriceText || null : null,
      live_end_at: pIsLive && pLiveEndAt ? pLiveEndAt : null,
    };

    const ins = await supabase.from("products").insert(payload).select("*").single();
    if (ins.error) {
      setMsg(`제품 등록 실패: ${ins.error.message}`);
      return;
    }

    setProducts((prev) => [(ins.data as ProductRow), ...prev]);
    setPName("");
    setPPriceText("");
    setPDesc("");
    setPImageUrl("");
    setPBuyUrl("");
    setPIsLive(false);
    setPLivePriceText("");
    setPLiveEndAt("");

    setMsg("제품 등록 완료");
  }

  async function uploadToBucket(bucket: string, path: string, file: File) {
    // upsert true로 “덮어쓰기” 허용
    const up = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });
    if (up.error) throw up.error;

    // public bucket이면 publicUrl 사용 가능
    const pub = supabase.storage.from(bucket).getPublicUrl(path);
    return pub.data.publicUrl;
  }

  async function submitVerification() {
    setMsg("");

    const { data: sess } = await supabase.auth.getSession();
    const user = sess?.session?.user;
    if (!user) return (window.location.href = "/login?force=1");

    if (!vLicenseFile) {
      setMsg("사업자등록증 파일은 필수입니다.");
      return;
    }

    try {
      const bucket = "vendor-verifications"; // ✅ Supabase Storage에 이 이름으로 bucket 만들기
      const ts = Date.now();

      const licensePath = `${user.id}/${ts}_business_${sanitizeFileName(vLicenseFile.name)}`;
      const licenseUrl = await uploadToBucket(bucket, licensePath, vLicenseFile);

      let corpUrl: string | null = null;
      if (vBusinessType === "법인" && vCorpFile) {
        const corpPath = `${user.id}/${ts}_corp_${sanitizeFileName(vCorpFile.name)}`;
        corpUrl = await uploadToBucket(bucket, corpPath, vCorpFile);
      }

      const payload = {
        user_id: user.id,
        business_type: vBusinessType,
        company_name: vCompanyName || null,
        ceo_name: vCeoName || null,
        business_number: vBizNo || null,
        license_url: licenseUrl,
        corp_doc_url: corpUrl,
        status: "pending",
      };

      // 최신 1개만 유지하고 싶으면 upsert로 처리(선택)
      const ins = await supabase
        .from("vendor_verifications")
        .insert(payload)
        .select("*")
        .single();

      if (ins.error) throw ins.error;

      setVerification(ins.data as VerificationRow);
      setMsg("인증 서류가 접수되었습니다. (검토중)");
    } catch (e: any) {
      console.error(e);
      setMsg(`인증 업로드 실패: ${e?.message ?? "알 수 없는 오류"}`);
    }
  }

  const verBadge = (() => {
    if (!verification) return <span style={ui.badgeNo}>⚪ 미인증</span>;
    if (verification.status === "approved") return <span style={ui.badgeOk}>🟢 인증 업체</span>;
    if (verification.status === "pending") return <span style={ui.badgeWait}>🟡 인증 검토중</span>;
    return <span style={ui.badgeNo}>⚠️ 인증 반려</span>;
  })();

  if (loading) {
    return (
      <main style={ui.page}>
        <h1 style={ui.title}>업체 대시보드</h1>
        <p style={ui.subtitle}>불러오는 중…</p>
      </main>
    );
  }

  return (
    <main style={ui.page}>
      <div style={ui.topbar}>
        <div>
          <h1 style={ui.title}>업체 대시보드</h1>
          <p style={ui.subtitle}>
            여기서 내 부스/제품 등록을 하게 됩니다. (LIVE 특판 포함)
          </p>
          <div style={{ marginTop: 8 }}>{verBadge}</div>
        </div>

        <div style={ui.btnRow}>
          <button style={ui.btn} onClick={goLogin}>
            로그인 화면
          </button>
          <button style={ui.btn} onClick={ensureVendorRow}>
            vendors 재확인(강제 upsert)
          </button>
          <button style={ui.btn} onClick={reloadSoft}>
            새로고침(내부)
          </button>
          <button style={ui.btn} onClick={logout}>
            로그아웃
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ ...ui.card, borderColor: "#111", background: "#fafafa" }}>
          <strong>메시지:</strong> {msg}
        </div>
      )}

      <div style={{ ...ui.card, marginTop: 14 }}>
        <div style={ui.cardTitleRow}>
          <h2 style={ui.cardTitle}>현재 로그인 정보</h2>
        </div>

        <div style={ui.chipRow}>
          <span style={ui.chip}>user_id: {me?.id}</span>
          <span style={ui.chip}>email: {me?.email ?? "-"}</span>
          <span style={ui.chip}>
            vendors: {vendor?.email ?? "-"} / company_name {vendor?.company_name ?? "미입력"}
          </span>
        </div>
      </div>

      {/* ✅ 사업자 인증 */}
      <div style={{ ...ui.card, marginTop: 14 }}>
        <div style={ui.cardTitleRow}>
          <h2 style={ui.cardTitle}>사업자 인증(신뢰도)</h2>
          {verification?.status === "approved" ? (
            <span style={ui.badgeOk}>🟢 인증 완료</span>
          ) : verification?.status === "pending" ? (
            <span style={ui.badgeWait}>🟡 검토중</span>
          ) : verification ? (
            <span style={ui.badgeNo}>⚠️ 반려</span>
          ) : (
            <span style={ui.badgeNo}>⚪ 미인증</span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
          <Field label="사업자 유형">
            <select
              style={ui.input}
              value={vBusinessType}
              onChange={(e) => setVBusinessType(e.target.value as any)}
            >
              <option value="개인">개인사업자</option>
              <option value="법인">법인사업자</option>
            </select>
          </Field>

          <Field label="상호(회사명)">
            <input style={ui.input} value={vCompanyName} onChange={(e) => setVCompanyName(e.target.value)} placeholder="예) 한국농수산TV" />
          </Field>

          <Field label="대표자명">
            <input style={ui.input} value={vCeoName} onChange={(e) => setVCeoName(e.target.value)} placeholder="예) 조세환" />
          </Field>

          <Field label="사업자번호">
            <input style={ui.input} value={vBizNo} onChange={(e) => setVBizNo(e.target.value)} placeholder="예) 123-45-67890" />
          </Field>

          <Field label="사업자등록증(필수)">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setVLicenseFile(e.target.files?.[0] ?? null)}
            />
            <div style={ui.hint}>이미지 또는 PDF 권장</div>
          </Field>

          <Field label="법인사업자등록증 (법인만, 선택)">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setVCorpFile(e.target.files?.[0] ?? null)}
              disabled={vBusinessType !== "법인"}
            />
            <div style={ui.hint}>법인사업자만 업로드하세요</div>
          </Field>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={ui.btnPrimary} onClick={submitVerification}>
            인증 서류 제출(검토 요청)
          </button>

          {verification?.license_url && (
            <a href={verification.license_url} target="_blank" rel="noreferrer" style={{ ...ui.btn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              제출한 사업자등록증 보기 →
            </a>
          )}
        </div>

        <div style={ui.hint}>
          * 운영 흐름(권장): 미인증은 부스/제품 등록은 가능, <b>LIVE 특판/대량거래/바이어 전용 기능은 인증 완료 후</b> 활성화.
        </div>
      </div>

      <div style={ui.grid2}>
        {/* left: booth list */}
        <div style={ui.card}>
          <div style={ui.cardTitleRow}>
            <h2 style={ui.cardTitle}>내 부스</h2>
            <button style={ui.btnPrimary} onClick={createBooth}>
              + 내 부스 만들기
            </button>
          </div>

          <div style={ui.list}>
            {booths.length === 0 ? (
              <div style={{ color: "#777", fontSize: 13, marginTop: 12 }}>
                아직 부스가 없습니다. “내 부스 만들기”로 시작하세요.
              </div>
            ) : (
              booths.map((b) => (
                <div
                  key={b.booth_id}
                  style={{
                    ...ui.item,
                    ...(activeBoothId === b.booth_id ? ui.itemActive : null),
                  }}
                  onClick={() => setActiveBoothId(b.booth_id)}
                  role="button"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <strong>{b.name || "(이름 없음)"}</strong>
                    <span style={ui.badgeNo}>{b.status || "draft"}</span>
                  </div>
                  <div style={{ marginTop: 6, color: "#666", fontSize: 12 }}>
                    지역 {b.region || "미입력"} · 카테고리 {b.category_primary || "미입력"}
                  </div>
                  <div style={{ marginTop: 6, color: "#888", fontSize: 12 }}>
                    booth_id: {b.booth_id}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* right: booth editor + product */}
        <div style={ui.card}>
          <div style={ui.cardTitleRow}>
            <h2 style={ui.cardTitle}>부스 정보</h2>
            <div style={ui.btnRow}>
              <button style={ui.btnPrimary} onClick={saveBooth} disabled={!activeBoothId}>
                저장
              </button>
              <button style={ui.btn} onClick={previewBooth} disabled={!activeBoothId}>
                부스 미리보기 →
              </button>
              <button style={ui.btnDanger} onClick={deleteBooth} disabled={!activeBoothId}>
                부스 삭제
              </button>
            </div>
          </div>

          {!activeBoothId ? (
            <div style={{ marginTop: 14, color: "#666" }}>
              왼쪽에서 부스를 선택하거나 새로 만드세요.
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
                <Field label="부스명">
                  <input style={ui.input} value={bName} onChange={(e) => setBName(e.target.value)} placeholder="예) tourpd" />
                </Field>

                <Field label="지역">
                  <input style={ui.input} value={bRegion} onChange={(e) => setBRegion(e.target.value)} placeholder="예) 충남 홍성 / 경기 고양" />
                </Field>

                <Field label="카테고리(대표)">
                  <input style={ui.input} value={bCategory} onChange={(e) => setBCategory(e.target.value)} placeholder="예) 비료 / 농약 / 농기계 / 종자" />
                  <div style={ui.hint}>* 다음 단계에서 “탑다운 카테고리”로 드롭다운화합니다.</div>
                </Field>

                <Field label="상태">
                  <input style={ui.input} value={bStatus} onChange={(e) => setBStatus(e.target.value)} placeholder="draft" />
                </Field>

                <Field label="담당자명">
                  <input style={ui.input} value={bContact} onChange={(e) => setBContact(e.target.value)} placeholder="예) 김○○" />
                </Field>

                <Field label="연락처">
                  <input style={ui.input} value={bPhone} onChange={(e) => setBPhone(e.target.value)} placeholder="예) 010-0000-0000" />
                </Field>

                <Field label="이메일(부스 연락용)">
                  <input style={ui.input} value={bEmail} onChange={(e) => setBEmail(e.target.value)} placeholder="예) tourpd@naver.com" />
                </Field>
              </div>

              <div style={{ marginTop: 14 }}>
                <Field label="한 줄 소개(intro)">
                  <input style={ui.input} value={bIntro} onChange={(e) => setBIntro(e.target.value)} placeholder="예) 전국 농민 대상 특가/대량 견적 가능합니다." />
                </Field>
              </div>

              <div style={{ marginTop: 14 }}>
                <Field label="상세 설명(description)">
                  <textarea
                    style={ui.textarea}
                    value={bDesc}
                    onChange={(e) => setBDesc(e.target.value)}
                    placeholder="부스 소개, 대표 제품, 상담 방식, 특판 조건(예: 박람회가/대량구매/현장가) 등을 적어주세요."
                  />
                </Field>
              </div>

              <div style={ui.hr} />

              {/* ✅ 제품 등록 */}
              <div style={ui.cardTitleRow}>
                <h3 style={{ ...ui.cardTitle, fontSize: 15 }}>제품 등록</h3>
                <span style={ui.chip}>booth_id: {activeBoothId}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
                <Field label="제품명">
                  <input style={ui.input} value={pName} onChange={(e) => setPName(e.target.value)} placeholder="예) 멀티피드 / 싹쓰리충 / 트랙터 모델명" />
                </Field>

                <Field label="가격(텍스트)">
                  <input style={ui.input} value={pPriceText} onChange={(e) => setPPriceText(e.target.value)} placeholder="예) 2kg 19,800원 / 박람회가 별도" />
                </Field>

                <Field label="설명">
                  <textarea style={ui.textarea} value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="예) 작물/효과/사용법/주의사항/대량구매 조건" />
                </Field>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="이미지 URL">
                    <input style={ui.input} value={pImageUrl} onChange={(e) => setPImageUrl(e.target.value)} placeholder="https://..." />
                  </Field>

                  <Field label="구매/문의 링크">
                    <input style={ui.input} value={pBuyUrl} onChange={(e) => setPBuyUrl(e.target.value)} placeholder="카톡 오픈채팅/웹페이지/구매 링크 등" />
                  </Field>
                </div>
              </div>

              <div style={{ ...ui.card, marginTop: 14, background: "#fafafa" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>🔴 LIVE 특판 옵션</div>
                    <div style={{ color: "#666", fontSize: 12, marginTop: 6 }}>
                      한국농수산TV 라이브 연동(초기엔 수동 운영 → 안정되면 자동화)
                    </div>
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900 }}>
                    <input type="checkbox" checked={pIsLive} onChange={(e) => setPIsLive(e.target.checked)} />
                    LIVE 특판 참여
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
                  <Field label="LIVE 특판가" hint="* 쿠팡보다 싸게, 하지만 공개 노출은 최소(‘특판가’ 중심)">
                    <input
                      style={ui.input}
                      value={pLivePriceText}
                      onChange={(e) => setPLivePriceText(e.target.value)}
                      placeholder="예) 2kg 15,900원 (현장가)"
                      disabled={!pIsLive}
                    />
                  </Field>

                  <Field label="LIVE 종료 시간(선택)" hint="* 있으면 ‘오늘 LIVE 상품’ 필터에 활용 가능">
                    <input
                      style={ui.input}
                      value={pLiveEndAt}
                      onChange={(e) => setPLiveEndAt(e.target.value)}
                      placeholder="예) 2026-02-28T21:00:00+09:00"
                      disabled={!pIsLive}
                    />
                  </Field>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button style={ui.btnPrimary} onClick={createProduct}>
                    제품 등록하기
                  </button>
                  <div style={ui.hint}>
                    등록 후, LIVE 페이지(예: <b>/live</b>) 또는 조건 필터링으로 <b>is_live=true</b> 제품을 노출하면 됩니다.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>등록된 제품</h3>
                {products.length === 0 ? (
                  <div style={{ marginTop: 10, color: "#777" }}>등록된 제품이 없습니다.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 12 }}>
                    {products.map((p) => {
                      const id = (p.product_id || p.id || p.name || "").toString();
                      return (
                        <div key={id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 12, background: "#fff" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                            <strong>{p.name || "이름 없음"}</strong>
                            {p.is_live ? <span style={ui.badgeWait}>🔴 LIVE</span> : <span style={ui.badgeNo}>일반</span>}
                          </div>
                          {p.price_text && <div style={{ marginTop: 6, color: "#333" }}>{p.price_text}</div>}
                          {p.live_price_text && <div style={{ marginTop: 6, color: "#8a5a00" }}>LIVE: {p.live_price_text}</div>}
                          {p.description && <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>{p.description}</div>}
                          {p.buy_url && (
                            <div style={{ marginTop: 10 }}>
                              <a href={p.buy_url} target="_blank" rel="noreferrer">
                                구매/문의 →
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={ui.hr} />

              <div style={{ color: "#666", fontSize: 13 }}>
                <b>다음 단계(예고)</b>
                <div style={{ marginTop: 8, lineHeight: 1.7 }}>
                  - 카테고리 “탑다운” 드롭다운(대분류→중분류) 적용<br />
                  - 역할(농민/바이어/업체/기자/일반인) + 명찰 배지 UI<br />
                  - 바이어 대량문의/견적(인콰이어리) 테이블 + RLS<br />
                  - LIVE 특판 스케줄/고정 노출/푸시(밴드/알림) 연동
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: any;
}) {
  return (
    <div>
      <div style={ui.label}>{label}</div>
      {children}
      {hint ? <div style={ui.hint}>{hint}</div> : null}
    </div>
  );
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-()+\[\] ]+/g, "_").slice(0, 120);
}