"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

// ✅ 업로드 유틸 (이 파일은 이미 만들어 둔 것으로 가정)
import { submitBoothImage, getBoothPublicUrl } from "@/app/booth/uploadBoothImage";

type VendorMe = {
  id: string; // vendors.id
  user_id: string;
  status: string | null;
  email: string | null;
  company_name: string | null;
};

type Booth = {
  booth_id: string;
  owner_user_id: string | null;
  vendor_id: string | null;
  vendor_user_id: string | null; // legacy
  name: string | null;
  region: string | null;
  category_primary: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  intro: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
};

type BoothImageRow = {
  id: string;
  booth_id: string;
  file_path: string;
  created_at: string;
};

export default function BoothDetailPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const params = useParams();
  const boothId = String(params?.id ?? "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [meId, setMeId] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);

  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const isVendorActive = !!vendor?.id && (vendor.status ?? "active") === "active";

  const [booth, setBooth] = useState<Booth | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [categoryPrimary, setCategoryPrimary] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [intro, setIntro] = useState("");
  const [description, setDescription] = useState("");

  // ✅ images UI
  const [images, setImages] = useState<BoothImageRow[]>([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function loadMeAndVendor() {
    const { data } = await supabase.auth.getUser();
    const u = data.user ?? null;
    setMeId(u?.id ?? null);
    setMeEmail(u?.email ?? null);

    if (!u?.id) return { user: null as any, vendor: null as any };

    const { data: v, error: vErr } = await supabase
      .from("vendors")
      .select("id, user_id, status, email, company_name")
      .eq("user_id", u.id)
      .maybeSingle();

    if (vErr) {
      console.warn("[vendor me] blocked:", vErr.message);
      setVendor(null);
      return { user: u, vendor: null };
    }

    const vv = (v as VendorMe) ?? null;
    setVendor(vv);
    return { user: u, vendor: vv };
  }

  async function loadBooth() {
    if (!boothId) return;

    const { data, error } = await supabase
      .from("booths")
      .select(
        "booth_id, owner_user_id, vendor_id, vendor_user_id, name, region, category_primary, contact_name, phone, email, intro, description, status, created_at"
      )
      .eq("booth_id", boothId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("부스를 찾을 수 없습니다.");

    const b = data as Booth;
    setBooth(b);

    // form에 주입
    setName(b.name ?? "");
    setRegion(b.region ?? "");
    setCategoryPrimary(b.category_primary ?? "");
    setContactName(b.contact_name ?? "");
    setPhone(b.phone ?? "");
    setEmail(b.email ?? "");
    setIntro(b.intro ?? "");
    setDescription(b.description ?? "");
  }

  async function loadBoothImages() {
    if (!boothId) return;
    setImgLoading(true);
    try {
      const { data, error } = await supabase
        .from("booth_images")
        .select("id, booth_id, file_path, created_at")
        .eq("booth_id", boothId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImages((data ?? []) as BoothImageRow[]);
    } finally {
      setImgLoading(false);
    }
  }

  async function refreshAll() {
    setLoading(true);
    setErrMsg(null);

    try {
      await loadMeAndVendor();
      await loadBooth();
      await loadBoothImages();
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
  }, [boothId]);

  // ✅ 파일 선택 → 미리보기 URL 생성
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const isOwner = !!meId && !!booth?.owner_user_id && booth.owner_user_id === meId;

  async function saveDraft() {
    if (!meId) {
      alert("로그인이 필요합니다.");
      router.push(`/login?next=/booth/${boothId}`);
      return;
    }
    if (!booth) return;

    setSaving(true);
    setErrMsg(null);

    try {
      // ✅ 방어적 보정:
      // - owner_user_id가 NULL이면 meId로 채움
      // - vendor_id가 NULL이면 내 vendor.id로 채움(있을 때)
      const patch: any = {
        name: name.trim() || null,
        region: region.trim() || null,
        category_primary: categoryPrimary.trim() || null,
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        intro: intro.trim() || null,
        description: description.trim() || null,
        status: booth.status ?? "draft",
      };

      if (!booth.owner_user_id) patch.owner_user_id = meId;
      if (!booth.vendor_id && vendor?.id) patch.vendor_id = vendor.id;

      const { error } = await supabase.from("booths").update(patch).eq("booth_id", boothId);
      if (error) throw error;

      alert("저장 완료");
      await refreshAll();
    } catch (e: any) {
      console.error(e);
      alert(`저장 실패: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function publishActive() {
    if (!meId) {
      alert("로그인이 필요합니다.");
      router.push(`/login?next=/booth/${boothId}`);
      return;
    }
    if (!booth) return;

    if (!vendor?.id) {
      alert("업체(vendor) 등록이 필요합니다.");
      return;
    }
    if (!isVendorActive) {
      alert(`업체 상태가 active가 아닙니다. (status=${vendor.status ?? "null"})`);
      return;
    }

    setSaving(true);
    setErrMsg(null);

    try {
      const patch: any = {
        name: name.trim() || null,
        region: region.trim() || null,
        category_primary: categoryPrimary.trim() || null,
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        intro: intro.trim() || null,
        description: description.trim() || null,
        status: "active",
        owner_user_id: booth.owner_user_id ?? meId,
        vendor_id: booth.vendor_id ?? vendor.id,
      };

      const { error } = await supabase.from("booths").update(patch).eq("booth_id", boothId);
      if (error) throw error;

      alert("공개(active)로 전환되었습니다.");
      await refreshAll();
    } catch (e: any) {
      console.error(e);
      alert(`공개 전환 실패: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  // ✅ 이미지 업로드(스토리지 업로드 + booth_images insert)
  async function handleUploadImage() {
    if (!meId) {
      alert("로그인이 필요합니다.");
      router.push(`/login?next=/booth/${boothId}`);
      return;
    }
    if (!boothId) return;

    if (!selectedFile) {
      alert("업로드할 파일을 선택해 주세요.");
      return;
    }

    setImgUploading(true);
    try {
      const path = await submitBoothImage({
        supabase,
        boothId,
        file: selectedFile,
      });

      // 업로드 성공 → 입력 초기화 + 목록 갱신
      setSelectedFile(null);
      await loadBoothImages();

      alert("이미지 업로드 완료");
      console.log("[uploaded]", path);
    } catch (e: any) {
      console.error(e);
      alert(`업로드 실패: ${e?.message ?? String(e)}`);
    } finally {
      setImgUploading(false);
    }
  }

  // ✅ 이미지 삭제 (DB row 삭제 + storage 파일 삭제)
  async function handleDeleteImage(row: BoothImageRow) {
    if (!confirm("이 이미지를 삭제할까요?")) return;

    try {
      // 1) storage delete (실패해도 DB는 지울지 정책 선택 가능)
      const { error: stErr } = await supabase.storage.from("booth-assets").remove([row.file_path]);
      if (stErr) throw stErr;

      // 2) db delete
      const { error: dbErr } = await supabase.from("booth_images").delete().eq("id", row.id);
      if (dbErr) throw dbErr;

      await loadBoothImages();
      alert("삭제 완료");
    } catch (e: any) {
      console.error(e);
      alert(`삭제 실패: ${e?.message ?? String(e)}`);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>불러오는 중...</div>;

  if (errMsg) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900 }}>부스 상세</h1>
        <div style={errorBox}>에러: {errMsg}</div>
        <button onClick={refreshAll} style={btnGhost}>
          새로고침
        </button>
      </div>
    );
  }

  if (!booth) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        <div>부스를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>부스 상세</h1>
          <div style={{ fontSize: 13, color: "#666" }}>
            booth_id: <span style={{ color: "#111" }}>{booth.booth_id}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={pill}>me: {meEmail ?? "not logged in"}</span>
          <span style={pillMini}>status: {booth.status ?? "-"}</span>
          <span style={{ ...pill, background: isOwner ? "#e7ffef" : "#fff7e6" }}>
            owner: {isOwner ? "YES" : "NO"}
          </span>
          <button onClick={() => router.push("/dashboard")} style={btnGhost}>
            목록
          </button>
        </div>
      </div>

      {!isOwner ? (
        <div style={{ ...warningBox, marginTop: 14 }}>
          이 부스의 owner가 아닙니다(또는 owner_user_id가 아직 NULL이었습니다).
          <br />
          저장/공개 버튼을 누르면 owner_user_id를 본인으로 자동 보정하도록 만들어 두었습니다.
        </div>
      ) : null}

      {/* 부스 정보 폼 */}
      <section style={{ ...card, marginTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="부스명(name) *">
            <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
          </Field>

          <Field label="지역(region)">
            <input value={region} onChange={(e) => setRegion(e.target.value)} style={input} placeholder="예) 충남 홍성" />
          </Field>

          <Field label="카테고리(category_primary)">
            <input
              value={categoryPrimary}
              onChange={(e) => setCategoryPrimary(e.target.value)}
              style={input}
              placeholder="예) 비료/영양제"
            />
          </Field>

          <Field label="담당자(contact_name)">
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} style={input} />
          </Field>

          <Field label="전화(phone)">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={input} />
          </Field>

          <Field label="이메일(email)">
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="한 줄 소개(intro)">
              <input value={intro} onChange={(e) => setIntro(e.target.value)} style={input} placeholder="예) 농민 곁에 언제나" />
            </Field>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="상세 설명(description)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...input, minHeight: 120, resize: "vertical" }}
                placeholder="부스 소개/주력 제품/연락 방법 등을 적어 주세요."
              />
            </Field>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button onClick={saveDraft} disabled={saving} style={btnGhost}>
            {saving ? "저장 중..." : "저장(draft 유지)"}
          </button>

          <button
            onClick={publishActive}
            disabled={saving || !meId || !isVendorActive}
            style={{
              ...btnPrimary,
              opacity: saving || !meId || !isVendorActive ? 0.5 : 1,
              cursor: saving || !meId || !isVendorActive ? "not-allowed" : "pointer",
            }}
            title={!meId ? "로그인이 필요합니다" : !isVendorActive ? "업체 승인(active) 후 공개 가능합니다" : ""}
          >
            {saving ? "처리 중..." : "공개하기(active)"}
          </button>

          <button onClick={refreshAll} disabled={saving} style={btnGhost}>
            새로고침
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
          공개(active) 전환 후에는 대시보드의 “공개 부스” 탭에서 노출됩니다.
        </div>
      </section>

      {/* ✅ 이미지 업로드/미리보기/목록 */}
      <section style={{ ...card, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>부스 이미지</div>
            <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
              저장 경로 규칙: <b>booths/{boothId}/images/&lt;timestamp&gt;_파일명</b>
            </div>
          </div>

          <button onClick={loadBoothImages} style={btnGhost} disabled={imgLoading}>
            {imgLoading ? "불러오는 중..." : "이미지 새로고침"}
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>업로드</div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              style={{ width: "100%" }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button
                onClick={handleUploadImage}
                disabled={!selectedFile || imgUploading}
                style={{
                  ...btnPrimary,
                  opacity: !selectedFile || imgUploading ? 0.5 : 1,
                  cursor: !selectedFile || imgUploading ? "not-allowed" : "pointer",
                }}
              >
                {imgUploading ? "업로드 중..." : "업로드 + 저장"}
              </button>

              <button
                onClick={() => setSelectedFile(null)}
                disabled={!selectedFile || imgUploading}
                style={btnGhost}
              >
                선택 취소
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
              팁: 업로드 후 목록에 바로 표시됩니다.
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>미리보기</div>
            <div style={{ border: "1px dashed #ddd", borderRadius: 12, padding: 10, minHeight: 160, background: "#fafafa" }}>
              {!previewUrl ? (
                <div style={{ fontSize: 13, color: "#777" }}>파일을 선택하면 미리보기가 뜹니다.</div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 10, background: "#fff" }}
                />
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
            업로드된 이미지 ({images.length})
          </div>

          {imgLoading ? (
            <div style={{ fontSize: 13, color: "#777" }}>불러오는 중...</div>
          ) : images.length === 0 ? (
            <div style={{ fontSize: 13, color: "#777" }}>아직 업로드된 이미지가 없습니다.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {images.map((row) => {
                const url = getBoothPublicUrl(supabase, row.file_path);
                return (
                  <div key={row.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 10, background: "#fff" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={row.file_path}
                      style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, background: "#fafafa" }}
                      onError={(e) => {
                        // 이미지가 안 뜰 때(404/정책 문제) 원인 추적이 쉽게 콘솔에 남김
                        console.warn("[image load failed]", row.file_path, url);
                        (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
                      }}
                    />
                    <div style={{ marginTop: 8, fontSize: 11, color: "#666", wordBreak: "break-all" }}>
                      {row.file_path}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ ...btnLink }}
                        title="새 탭에서 열기"
                      >
                        보기
                      </a>

                      <button onClick={() => handleDeleteImage(row)} style={btnDanger}>
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

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

const btnDanger: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #ffd2d2",
  background: "#fff5f5",
  color: "#b00020",
  fontWeight: 900,
  cursor: "pointer",
};

const btnLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 900,
  textDecoration: "none",
};

const errorBox: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #ffd2d2",
  background: "#fff5f5",
  whiteSpace: "pre-wrap",
};

const warningBox: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #ffe2a8",
  background: "#fff7e6",
  whiteSpace: "pre-wrap",
};