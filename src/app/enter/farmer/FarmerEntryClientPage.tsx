"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatKoreanPhone, normalizeKoreanPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export default function FarmerEntryClientPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [crop, setCrop] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedName = sessionStorage.getItem("farmer_entry_name") || "";
    const savedPhone = sessionStorage.getItem("farmer_entry_phone") || "";
    const savedRegion = sessionStorage.getItem("farmer_entry_region") || "";
    const savedCrop = sessionStorage.getItem("farmer_entry_crop") || "";

    if (savedName) setName(savedName);
    if (savedPhone) setPhone(formatKoreanPhone(savedPhone));
    if (savedRegion) setRegion(savedRegion);
    if (savedCrop) setCrop(savedCrop);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const normalizedPhone = normalizeKoreanPhone(phone);

      if (!name.trim()) {
        setMsg("이름을 입력해주세요.");
        return;
      }

      if (normalizedPhone.length < 10) {
        setMsg("전화번호를 정확히 입력해주세요.");
        return;
      }

      const res = await fetch("/api/farmer/enter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: normalizedPhone,
          region: region.trim(),
          crop: crop.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setMsg(data?.error ?? "입장 처리 실패");
        return;
      }

      sessionStorage.setItem("farmer_entry_name", name.trim());
      sessionStorage.setItem("farmer_entry_phone", normalizedPhone);
      sessionStorage.setItem("farmer_entry_region", region.trim());
      sessionStorage.setItem("farmer_entry_crop", crop.trim());

      router.replace("/expo");
      router.refresh();
    } catch (err: any) {
      setMsg(err?.message ?? "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>FARMER ENTRY</div>
        <h1 style={S.title}>농민 간편입장</h1>
        <p style={S.desc}>
          이름과 전화번호만 입력하면 바로 입장합니다.
          <br />
          경품·이벤트 참여 시에만 추가 인증을 붙이면 됩니다.
        </p>

        <form onSubmit={onSubmit} style={S.form}>
          <label style={S.label}>이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 홍길동"
            style={S.input}
            required
          />

          <label style={{ ...S.label, marginTop: 14 }}>전화번호</label>
          <input
            value={phone}
            onChange={(e) => setPhone(formatKoreanPhone(e.target.value))}
            placeholder="예: 010-1234-5678"
            inputMode="numeric"
            style={S.input}
            required
          />

          <label style={{ ...S.label, marginTop: 14 }}>지역 (선택)</label>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="예: 충남 홍성"
            style={S.input}
          />

          <label style={{ ...S.label, marginTop: 14 }}>주 작물 (선택)</label>
          <input
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder="예: 마늘, 고추, 양파"
            style={S.input}
          />

          <button type="submit" style={S.primaryBtn} disabled={loading}>
            {loading ? "입장 중..." : "농민 입장"}
          </button>
        </form>

        {msg ? <div style={S.msg}>{msg}</div> : null}

        <div style={S.bottom}>
          <Link href="/login" style={S.back}>
            ← 로그인 선택으로
          </Link>
        </div>
      </div>
    </main>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    background: "#fff",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 12,
    color: "#64748b",
    lineHeight: 1.7,
    fontSize: 15,
  },
  form: {
    marginTop: 20,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 900,
    marginBottom: 8,
    color: "#111827",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 15,
    background: "#fff",
  },
  primaryBtn: {
    width: "100%",
    marginTop: 18,
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
    fontSize: 16,
  },
  msg: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    background: "#f8fafc",
    color: "#334155",
    lineHeight: 1.7,
    fontSize: 14,
    border: "1px solid #e2e8f0",
  },
  bottom: {
    marginTop: 18,
  },
  back: {
    color: "#111",
    textDecoration: "none",
    fontWeight: 900,
  },
} satisfies Record<string, React.CSSProperties>;