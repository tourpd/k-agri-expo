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
        setMsg("이름을 입력해 주세요.");
        return;
      }

      if (normalizedPhone.length < 10) {
        setMsg("전화번호를 정확히 입력해 주세요.");
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
        setMsg(data?.error ?? "입장 처리에 실패했습니다.");
        return;
      }

      sessionStorage.setItem("farmer_entry_name", name.trim());
      sessionStorage.setItem("farmer_entry_phone", normalizedPhone);
      sessionStorage.setItem("farmer_entry_region", region.trim());
      sessionStorage.setItem("farmer_entry_crop", crop.trim());

      router.replace("/expo");
      router.refresh();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>K-AGRI EXPO FARMER ENTRY</div>

        <h1 style={S.title}>농민 간편입장</h1>

        <p style={S.desc}>
          이름과 전화번호만 입력하면 바로 입장합니다.
          <br />
          경품·샘플·특가 참여 시에만 추가 인증을 붙이면 됩니다.
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

          <label style={S.labelWithMargin}>전화번호</label>
          <input
            value={phone}
            onChange={(e) => setPhone(formatKoreanPhone(e.target.value))}
            placeholder="예: 010-1234-5678"
            inputMode="numeric"
            style={S.input}
            required
          />

          <label style={S.labelWithMargin}>지역 선택</label>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="예: 충남 홍성"
            style={S.input}
          />

          <label style={S.labelWithMargin}>주 작물 선택</label>
          <input
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder="예: 마늘, 고추, 양파"
            style={S.input}
          />

          <button
            type="submit"
            style={{
              ...S.primaryBtn,
              opacity: loading ? 0.65 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "입장 중..." : "농민 입장하기"}
          </button>
        </form>

        {msg ? <div style={S.msg}>{msg}</div> : null}

        <div style={S.bottom}>
          <Link href="/login" style={S.back}>
            ← 로그인 선택으로 돌아가기
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
    color: "#111827",
  },

  card: {
    width: "100%",
    maxWidth: 720,
    background: "#ffffff",
    borderRadius: 32,
    padding: 42,
    boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
    border: "1px solid #d1d5db",
    color: "#111827",
  },

  kicker: {
    fontSize: 15,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },

  title: {
    margin: "12px 0 0",
    fontSize: 48,
    lineHeight: 1.12,
    fontWeight: 950,
    color: "#111827",
  },

  desc: {
    marginTop: 16,
    color: "#374151",
    lineHeight: 1.8,
    fontSize: 20,
    fontWeight: 800,
  },

  form: {
    marginTop: 28,
  },

  label: {
    display: "block",
    fontSize: 21,
    fontWeight: 950,
    marginBottom: 10,
    color: "#111827",
  },

  labelWithMargin: {
    display: "block",
    fontSize: 21,
    fontWeight: 950,
    marginTop: 18,
    marginBottom: 10,
    color: "#111827",
  },

  input: {
    width: "100%",
    padding: "20px 22px",
    borderRadius: 18,
    border: "2px solid #cbd5e1",
    boxSizing: "border-box",
    fontSize: 22,
    fontWeight: 900,
    background: "#ffffff",
    color: "#111827",
    outline: "none",
  },

  primaryBtn: {
    width: "100%",
    marginTop: 28,
    padding: "24px 20px",
    borderRadius: 20,
    border: 0,
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 950,
    fontSize: 28,
  },

  msg: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    background: "#fff7ed",
    color: "#9a3412",
    lineHeight: 1.7,
    fontSize: 18,
    fontWeight: 900,
    border: "1px solid #fed7aa",
  },

  bottom: {
    marginTop: 24,
  },

  back: {
    color: "#111827",
    textDecoration: "none",
    fontWeight: 950,
    fontSize: 18,
  },
} satisfies Record<string, React.CSSProperties>;