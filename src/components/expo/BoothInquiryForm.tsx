"use client";

import React, { useEffect, useMemo, useState } from "react";

type BoothInquiryFormProps = {
  boothId: string;
  vendorId?: string;
  hallId?: string;
  slotCode?: string;
};

type InquiryPayload = {
  booth_id: string;
  vendor_id?: string;
  hall_id?: string;
  slot_code?: string;
  farmer_name: string;
  phone: string;
  region: string;
  crop: string;
  quantity_text: string;
  inquiry_type: string;
  message: string;
  agree_privacy: boolean;
  source_type: string;
};

type SubmitResponse = {
  ok?: boolean;
  success?: boolean;
  error?: string;
  inquiry_id?: string;
  notice?: string;
};

type ViewerProfileResponse = {
  ok?: boolean;
  success?: boolean;
  visitor?: {
    id?: string | null;
    name?: string | null;
    phone?: string | null;
    region?: string | null;
    main_crop?: string | null;
  } | null;
};

type SavedInquiryDraft = {
  farmerName?: string;
  phone?: string;
  region?: string;
  crop?: string;
};

function safe(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function trimmed(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatPhone(v: string) {
  const digits = onlyDigits(v);

  if (!digits) return "";
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length < 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

function isValidPhone(v: string) {
  const digits = onlyDigits(v);
  return digits.length >= 10 && digits.length <= 11;
}

const inquiryTypeOptions = [
  "가격 문의",
  "공동구매 문의",
  "사용법 문의",
  "대량 구매 문의",
  "도매 공급 문의",
  "기타 문의",
];

const DRAFT_STORAGE_KEY = "expo_booth_inquiry_basic_profile_v4";

const RESPONSIVE_CSS = `
.booth-inquiry-form * {
  box-sizing: border-box;
}
.booth-inquiry-form input,
.booth-inquiry-form select,
.booth-inquiry-form textarea,
.booth-inquiry-form button {
  font: inherit;
}
.booth-inquiry-form input,
.booth-inquiry-form textarea {
  -webkit-appearance: none;
  appearance: none;
}
.booth-inquiry-form textarea {
  white-space: pre-wrap;
  word-break: keep-all;
}
@media (max-width: 768px) {
  .booth-inquiry-grid2 {
    grid-template-columns: 1fr !important;
  }
  .booth-inquiry-topbar {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  .booth-inquiry-template-row {
    width: 100% !important;
  }
}
`;

export default function BoothInquiryForm({
  boothId,
  vendorId,
  hallId,
  slotCode,
}: BoothInquiryFormProps) {
  const [farmerName, setFarmerName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [crop, setCrop] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [inquiryType, setInquiryType] = useState("가격 문의");
  const [message, setMessage] = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const normalizedPhone = useMemo(() => formatPhone(phone), [phone]);

  useEffect(() => {
    let mounted = true;

    function loadDraftFromStorage() {
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw) as SavedInquiryDraft | null;
        if (!parsed) return;

        setFarmerName((prev) => prev || trimmed(parsed.farmerName, ""));
        setPhone((prev) => prev || formatPhone(trimmed(parsed.phone, "")));
        setRegion((prev) => prev || trimmed(parsed.region, ""));
        setCrop((prev) => prev || trimmed(parsed.crop, ""));
      } catch {
        // ignore
      }
    }

    async function loadProfile() {
      try {
        const res = await fetch("/api/expo/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json = (await res.json().catch(() => null)) as ViewerProfileResponse | null;

        if (!mounted) return;

        const visitor = json?.visitor;

        if (!res.ok || !(json?.ok || json?.success) || !visitor) {
          loadDraftFromStorage();
          setProfileLoaded(false);
          return;
        }

        setFarmerName((prev) => prev || trimmed(visitor.name, ""));
        setPhone((prev) => prev || formatPhone(trimmed(visitor.phone, "")));
        setRegion((prev) => prev || trimmed(visitor.region, ""));
        setCrop((prev) => prev || trimmed(visitor.main_crop, ""));
        setProfileLoaded(true);
      } catch {
        if (!mounted) return;
        loadDraftFromStorage();
        setProfileLoaded(false);
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const payload: SavedInquiryDraft = {
        farmerName: trimmed(farmerName, ""),
        phone: formatPhone(phone),
        region: trimmed(region, ""),
        crop: trimmed(crop, ""),
      };
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [farmerName, phone, region, crop]);

  function resetFormKeepBasicInfo() {
    setQuantityText("");
    setInquiryType("가격 문의");
    setMessage("");
    setAgreePrivacy(false);
  }

  function clearBasicInfo() {
    setFarmerName("");
    setPhone("");
    setRegion("");
    setCrop("");
    setNotice("");
    setError("");

    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function fillExampleMessage(type: string) {
    if (type === "공동구매 문의") {
      setInquiryType("공동구매 문의");
      setMessage("공동구매 가격과 최소 수량이 궁금합니다.");
      return;
    }

    setInquiryType("가격 문의");
    setMessage("가격과 지금 사용 가능한지 알려주십시오.");
  }

  function validate() {
    if (!trimmed(boothId, "")) {
      return "부스 정보가 올바르지 않습니다.";
    }

    if (!trimmed(farmerName, "")) {
      return "이름을 입력해주십시오.";
    }

    if (!isValidPhone(phone)) {
      return "휴대폰 번호를 정확히 입력해주십시오.";
    }

    if (!trimmed(region, "")) {
      return "지역을 입력해주십시오.";
    }

    if (!trimmed(crop, "")) {
      return "작물명을 입력해주십시오.";
    }

    if (!trimmed(message, "")) {
      return "문의 내용을 입력해주십시오.";
    }

    if (trimmed(message, "").length < 6) {
      return "문의 내용을 조금만 더 적어주십시오.";
    }

    if (!agreePrivacy) {
      return "개인정보 수집 및 이용에 동의해주십시오.";
    }

    return "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setNotice("");
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const payload: InquiryPayload = {
        booth_id: trimmed(boothId, ""),
        vendor_id: trimmed(vendorId, "") || undefined,
        hall_id: trimmed(hallId, "") || undefined,
        slot_code: trimmed(slotCode, "") || undefined,
        farmer_name: trimmed(farmerName, ""),
        phone: formatPhone(phone),
        region: trimmed(region, ""),
        crop: trimmed(crop, ""),
        quantity_text: safe(quantityText, "").trim(),
        inquiry_type: trimmed(inquiryType, "가격 문의"),
        message: safe(message, "").trim(),
        agree_privacy: true,
        source_type: "booth_inquiry",
      };

      const res = await fetch("/api/expo/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => null)) as SubmitResponse | null;

      if (!res.ok || !(json?.ok || json?.success)) {
        throw new Error(json?.error || "문의 접수에 실패했습니다.");
      }

      setNotice(json?.notice || "문의가 접수되었습니다. 확인 후 연락드리겠습니다.");
      setError("");
      resetFormKeepBasicInfo();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "문의 접수 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={S.wrap} className="booth-inquiry-form">
      <style>{RESPONSIVE_CSS}</style>

      <div style={S.heroBox}>
        <div style={S.eyebrow}>QUICK INQUIRY</div>
        <h3 style={S.title}>간단히 남겨주시면 됩니다</h3>
        <div style={S.desc}>이름, 연락처, 지역, 작물, 문의 내용만 입력해주십시오.</div>

        <div style={S.profileNotice}>
          {loadingProfile
            ? "기본정보를 불러오는 중입니다..."
            : profileLoaded
            ? "이전 정보가 있으면 자동으로 채워집니다."
            : "입력한 기본정보는 다음 문의 때 다시 불러옵니다."}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={S.form}>
        <div style={S.formTopBar} className="booth-inquiry-topbar">
          <div style={S.formTopTitle}>기본정보</div>
          <button type="button" style={S.smallGhostBtn} onClick={clearBasicInfo}>
            비우기
          </button>
        </div>

        <div style={S.grid2} className="booth-inquiry-grid2">
          <label style={S.labelWrap}>
            <div style={S.label}>이름</div>
            <input
              style={S.input}
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              placeholder="이름"
              autoComplete="name"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>휴대폰 번호</div>
            <input
              style={S.input}
              value={normalizedPhone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              inputMode="numeric"
              autoComplete="tel"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>지역</div>
            <input
              style={S.input}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="예: 충남 홍성"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>작물명</div>
            <input
              style={S.input}
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              placeholder="예: 마늘, 딸기, 고추"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </label>
        </div>

        <div style={S.divider} />

        <div style={S.formTopBar} className="booth-inquiry-topbar">
          <div style={S.formTopTitle}>문의 내용</div>
          <div style={S.templateRow} className="booth-inquiry-template-row">
            <button
              type="button"
              style={S.templateBtn}
              onClick={() => fillExampleMessage("가격 문의")}
            >
              가격 예시
            </button>
            <button
              type="button"
              style={S.templateBtn}
              onClick={() => fillExampleMessage("공동구매 문의")}
            >
              공동구매 예시
            </button>
          </div>
        </div>

        <div style={S.grid2} className="booth-inquiry-grid2">
          <label style={S.labelWrap}>
            <div style={S.label}>예상 수량 / 면적</div>
            <input
              style={S.input}
              value={quantityText}
              onChange={(e) => setQuantityText(e.target.value)}
              placeholder="예: 500병 / 200평"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>문의 유형</div>
            <select
              style={S.select}
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
            >
              {inquiryTypeOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={S.labelWrap}>
          <div style={S.label}>문의 내용</div>
          <textarea
            style={S.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`예:
가격이 궁금합니다.
지금 사용 가능한지 알려주십시오.
공동구매 가능 여부도 궁금합니다.`}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </label>

        <div style={S.guideBox}>
          작물 상태, 필요한 수량, 궁금한 가격을 함께 적어주시면 더 빠르게 확인됩니다.
        </div>

        <label style={S.checkRow}>
          <input
            type="checkbox"
            checked={agreePrivacy}
            onChange={(e) => setAgreePrivacy(e.target.checked)}
          />
          <span>개인정보 수집 및 이용에 동의합니다.</span>
        </label>

        {error ? <div style={S.error}>{error}</div> : null}
        {notice ? <div style={S.notice}>{notice}</div> : null}

        <div style={S.submitRow}>
          <button
            type="submit"
            disabled={submitting}
            style={submitting ? S.submitBtnDisabled : S.submitBtn}
          >
            {submitting ? "접수 중..." : "문의 접수하기"}
          </button>
        </div>
      </form>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 14,
  },
  heroBox: {
    borderRadius: 18,
    border: "1px solid #dcfce7",
    background: "#f0fdf4",
    padding: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#15803d",
    letterSpacing: 0.4,
  },
  title: {
    marginTop: 6,
    fontSize: 24,
    lineHeight: 1.35,
    fontWeight: 950,
    color: "#14532d",
  },
  desc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#166534",
  },
  profileNotice: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#ffffff",
    border: "1px solid #dcfce7",
    color: "#166534",
    fontSize: 13,
    lineHeight: 1.7,
    fontWeight: 800,
  },
  form: {
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    padding: 18,
  },
  formTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  formTopTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#111827",
  },
  smallGhostBtn: {
    height: 38,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    fontWeight: 800,
    cursor: "pointer",
  },
  templateRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  templateBtn: {
    height: 36,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 12,
  },
  divider: {
    height: 1,
    background: "#e5e7eb",
    margin: "8px 0 16px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  labelWrap: {
    display: "block",
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 900,
    color: "#111827",
  },
  input: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "0 14px",
    fontSize: 15,
    boxSizing: "border-box",
    outline: "none",
  },
  select: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "0 14px",
    fontSize: 15,
    boxSizing: "border-box",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 160,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: 14,
    fontSize: 15,
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
  },
  guideBox: {
    marginTop: 4,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.8,
  },
  checkRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 13,
    lineHeight: 1.7,
    color: "#334155",
  },
  error: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 800,
    lineHeight: 1.7,
  },
  notice: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontWeight: 800,
    lineHeight: 1.7,
  },
  submitRow: {
    marginTop: 16,
    display: "flex",
  },
  submitBtn: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer",
  },
  submitBtnDisabled: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    border: "none",
    background: "#94a3b8",
    color: "#fff",
    fontSize: 16,
    fontWeight: 950,
    cursor: "not-allowed",
  },
};