"use client";

import React, { useEffect, useState } from "react";
import { formatKoreanPhone, normalizeKoreanPhone } from "@/lib/phone";

type FarmerProfile = {
  farmer_session_id: string | null;
  name: string;
  phone: string;
  region: string;
  crop: string;
  is_verified: boolean;
};

export default function InquiryForm({ boothId }: { boothId: string }) {
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [loadingFarmer, setLoadingFarmer] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cropName, setCropName] = useState("");
  const [region, setRegion] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    let mounted = true;

    async function loadFarmer() {
      try {
        const res = await fetch("/api/farmer/me", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!mounted) return;

        if (!res.ok || !json?.success || !json?.item) {
          setFarmer(null);
          return;
        }

        const item = json.item as FarmerProfile;
        setFarmer(item);

        setName((prev) => prev || item.name || "");
        setPhone((prev) => prev || formatKoreanPhone(item.phone || ""));
        setRegion((prev) => prev || item.region || "");
        setCropName((prev) => prev || item.crop || "");
      } catch {
        if (!mounted) return;
        setFarmer(null);
      } finally {
        if (!mounted) return;
        setLoadingFarmer(false);
      }
    }

    loadFarmer();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResultMessage("");
    setResultType("");

    try {
      const normalizedPhone = normalizeKoreanPhone(phone);

      if (!name.trim()) {
        throw new Error("이름을 입력해주세요.");
      }

      if (normalizedPhone.length < 10) {
        throw new Error("전화번호를 정확히 입력해주세요.");
      }

      if (!cropName.trim()) {
        throw new Error("작물을 입력해주세요.");
      }

      if (!message.trim()) {
        throw new Error("문의 내용을 입력해주세요.");
      }

      const res = await fetch("/api/booth-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booth_id: boothId,

          farmer_name: name.trim(),
          farmer_phone: normalizedPhone,
          farmer_email: email.trim(),

          crop_name: cropName.trim(),
          area_text: "",
          issue_type: "일반 상담",
          message: message.trim(),

          source_type: "booth_inquiry",
          source_ref_id: farmer?.farmer_session_id || "",

          region: region.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "상담 요청 접수에 실패했습니다.");
      }

      setResultType("success");
      setResultMessage("상담 요청이 접수되었습니다. 업체에서 확인 후 연락드릴 예정입니다.");
      setMessage("");
    } catch (error) {
      setResultType("error");
      setResultMessage(
        error instanceof Error ? error.message : "상담 요청 접수 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={S.wrap}>
      <div style={S.headerRow}>
        <div>
          <div style={S.eyebrow}>INQUIRY FORM</div>
          <h3 style={S.title}>상담 신청</h3>
          <p style={S.desc}>
            관심 있는 업체에 상담을 요청하세요.
            {loadingFarmer
              ? " 농민 정보를 불러오는 중입니다."
              : farmer
              ? " 입장한 농민 정보가 자동으로 채워졌습니다."
              : " 이름과 연락처를 입력하면 접수됩니다."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={S.form}>
        <div style={S.grid}>
          <label style={S.labelWrap}>
            <div style={S.label}>이름</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              style={S.input}
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>전화번호</div>
            <input
              value={phone}
              onChange={(e) => setPhone(formatKoreanPhone(e.target.value))}
              placeholder="010-1234-5678"
              inputMode="numeric"
              style={S.input}
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>이메일 (선택)</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              style={S.input}
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>지역 (선택)</div>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="예: 충남 홍성"
              style={S.input}
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>작물</div>
            <input
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="예: 마늘, 고추, 딸기"
              style={S.input}
            />
          </label>
        </div>

        <label style={{ ...S.labelWrap, marginTop: 16 }}>
          <div style={S.label}>문의 내용</div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="어떤 상담이 필요한지 적어주세요."
            style={S.textarea}
          />
        </label>

        <button type="submit" style={S.submitBtn} disabled={submitting}>
          {submitting ? "접수 중..." : "상담 요청 보내기"}
        </button>

        {resultMessage ? (
          <div
            style={
              resultType === "success" ? S.successMessage : S.errorMessage
            }
          >
            {resultMessage}
          </div>
        ) : null}
      </form>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    borderRadius: 24,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: 24,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#64748b",
  },
  form: {
    marginTop: 20,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  labelWrap: {
    display: "block",
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 900,
    color: "#111827",
  },
  input: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    padding: "0 14px",
    boxSizing: "border-box",
    fontSize: 15,
    background: "#fff",
  },
  textarea: {
    width: "100%",
    minHeight: 140,
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    padding: 14,
    boxSizing: "border-box",
    fontSize: 15,
    background: "#fff",
    resize: "vertical",
    fontFamily: "inherit",
  },
  submitBtn: {
    marginTop: 18,
    width: "100%",
    height: 56,
    borderRadius: 14,
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer",
  },
  successMessage: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 800,
  },
  errorMessage: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 800,
  },
};