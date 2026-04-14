"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type PreferredLanguage = "ko" | "en" | "vi" | "th" | "ja" | "zh";

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "").slice(0, 11);
}

function formatPhone(value: string) {
  const digits = digitsOnly(value);

  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getFileExt(fileName: string) {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : "";
}

export default function BuyerSignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("KR");
  const [preferredLanguage, setPreferredLanguage] =
    useState<PreferredLanguage>("ko");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [businessCardFile, setBusinessCardFile] = useState<File | null>(null);
  const [businessRegistrationFile, setBusinessRegistrationFile] =
    useState<File | null>(null);
  const [companyWebsite, setCompanyWebsite] = useState("");

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isForeign = country !== "KR";

  async function uploadVerificationFile(
    file: File,
    userId: string,
    kind: "business_card" | "business_registration"
  ) {
    const ext = getFileExt(file.name) || "bin";
    const fileName = `${kind}_${Date.now()}.${ext}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from("buyer-verifications")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || undefined,
      });

    if (error) {
      throw new Error(`${kind} 업로드 실패: ${error.message}`);
    }

    const { data } = supabase.storage
      .from("buyer-verifications")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const cleanName = name.trim();
      const cleanCompany = company.trim();
      const cleanEmail = email.trim();
      const cleanPhone = digitsOnly(phone);
      const cleanWebsite = companyWebsite.trim();

      if (cleanName.length < 2) {
        setMsg("담당자명은 2자 이상 입력해주세요.");
        return;
      }

      if (cleanCompany.length < 2) {
        setMsg("회사명은 2자 이상 입력해주세요.");
        return;
      }

      if (!cleanPhone || cleanPhone.length < 10) {
        setMsg("연락처를 정확히 입력해주세요.");
        return;
      }

      if (!cleanEmail) {
        setMsg("이메일을 입력해주세요.");
        return;
      }

      if (!isValidEmail(cleanEmail)) {
        setMsg("이메일 형식이 올바르지 않습니다.");
        return;
      }

      if (!password) {
        setMsg("비밀번호를 입력해주세요.");
        return;
      }

      if (password.length < 8) {
        setMsg("비밀번호는 8자 이상이어야 합니다.");
        return;
      }

      if (password !== passwordConfirm) {
        setMsg("비밀번호 확인이 일치하지 않습니다.");
        return;
      }

      if (isForeign && !businessCardFile) {
        setMsg("해외 바이어는 명함 업로드가 필요합니다.");
        return;
      }

      if (isForeign && !businessRegistrationFile) {
        setMsg("해외 바이어는 사업자등록증/회사등록증 업로드가 필요합니다.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            role: "buyer",
            name: cleanName,
            company: cleanCompany,
            phone: cleanPhone,
            country,
            is_foreign: isForeign,
            preferred_language: preferredLanguage,
          },
        },
      });

      if (error) {
        setMsg(`회원가입 실패: ${error.message}`);
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        setMsg("회원가입은 되었지만 사용자 ID를 확인할 수 없습니다.");
        return;
      }

      let businessCardUrl: string | null = null;
      let businessRegistrationUrl: string | null = null;

      if (isForeign && businessCardFile) {
        businessCardUrl = await uploadVerificationFile(
          businessCardFile,
          userId,
          "business_card"
        );
      }

      if (isForeign && businessRegistrationFile) {
        businessRegistrationUrl = await uploadVerificationFile(
          businessRegistrationFile,
          userId,
          "business_registration"
        );
      }

      const verificationStatus = isForeign ? "pending" : "none";
      const buyerLevel = "guest";
      const nowIso = new Date().toISOString();

      const { error: profileError } = await supabase
        .from("buyer_profiles")
        .upsert(
          {
            user_id: userId,
            name: cleanName,
            contact_name: cleanName,
            company_name: cleanCompany,
            phone: cleanPhone,
            email: cleanEmail,
            buyer_level: buyerLevel,
            verification_status: verificationStatus,
            is_foreign: isForeign,
            country,
            preferred_language: preferredLanguage,
            business_card_url: businessCardUrl,
            business_registration_url: businessRegistrationUrl,
            company_website: cleanWebsite || null,
            updated_at: nowIso,
          },
          { onConflict: "user_id" }
        );

      if (profileError) {
        setMsg(`회원가입은 되었지만 프로필 저장 실패: ${profileError.message}`);
        return;
      }

      if (isForeign) {
        const { error: verificationError } = await supabase
          .from("buyer_verifications")
          .insert({
            buyer_user_id: userId,
            verification_status: "pending",
            is_foreign: true,
            country,
            preferred_language: preferredLanguage,
            business_card_url: businessCardUrl,
            business_registration_url: businessRegistrationUrl,
            company_website: cleanWebsite || null,
            submitted_note: "해외 바이어 가입 시 제출",
            created_at: nowIso,
          });

        if (verificationError) {
          setMsg(
            `회원가입은 되었지만 검증 요청 저장 실패: ${verificationError.message}`
          );
          return;
        }
      }

      setMsg(
        isForeign
          ? "회원가입이 완료되었습니다. 해외 바이어 검증 서류가 접수되었으며, 검토 후 이용 범위가 확대됩니다."
          : "회원가입이 완료되었습니다. 잠시 후 바이어 페이지로 이동합니다."
      );

      setTimeout(() => {
        router.replace("/buyer");
        router.refresh();
      }, 1200);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setMsg(`오류: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.kicker}>BUYER SIGNUP</div>
        <h1 style={styles.title}>바이어 회원가입</h1>

        <p style={styles.desc}>
          바이어 계정을 만들고 K-Agri Expo에서 제품 문의와 상담을 진행할 수
          있습니다.
        </p>

        <form onSubmit={onSubmit} style={styles.form}>
          <label style={styles.label}>담당자명 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            placeholder="예: 홍길동"
            required
          />

          <label style={{ ...styles.label, marginTop: 12 }}>회사명 *</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={styles.input}
            placeholder="예: ABC Trading"
            required
          />

          <label style={{ ...styles.label, marginTop: 12 }}>연락처 *</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            style={styles.input}
            placeholder="예: 010-2828-3838"
            inputMode="numeric"
            required
          />

          <label style={{ ...styles.label, marginTop: 12 }}>이메일 *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            autoComplete="email"
            placeholder="예: buyer@company.com"
            required
          />

          <label style={{ ...styles.label, marginTop: 12 }}>국가 *</label>
          <select
            value={country}
            onChange={(e) => {
              const nextCountry = e.target.value;
              setCountry(nextCountry);
              setPreferredLanguage(nextCountry === "KR" ? "ko" : "en");
            }}
            style={styles.input}
            required
          >
            <option value="KR">대한민국</option>
            <option value="US">미국</option>
            <option value="VN">베트남</option>
            <option value="TH">태국</option>
            <option value="JP">일본</option>
            <option value="CN">중국</option>
            <option value="OTHER">기타 해외</option>
          </select>

          <label style={{ ...styles.label, marginTop: 12 }}>선호 언어 *</label>
          <select
            value={preferredLanguage}
            onChange={(e) =>
              setPreferredLanguage(e.target.value as PreferredLanguage)
            }
            style={styles.input}
            required
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
            <option value="th">ไทย</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
          </select>

          <label style={{ ...styles.label, marginTop: 12 }}>비밀번호 *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoComplete="new-password"
            placeholder="8자 이상 입력"
            required
          />

          <label style={{ ...styles.label, marginTop: 12 }}>
            비밀번호 확인 *
          </label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            style={styles.input}
            autoComplete="new-password"
            placeholder="비밀번호를 다시 입력"
            required
          />

          {isForeign && (
            <div style={styles.foreignBox}>
              <div style={styles.foreignTitle}>해외 바이어 검증 서류</div>
              <p style={styles.foreignDesc}>
                해외 바이어/해외 기업은 명함과 회사 등록 문서를 제출해 주세요.
                검토 후 상담 요청 및 업체 연결이 가능합니다.
              </p>

              <label style={{ ...styles.label, marginTop: 12 }}>
                회사 명함 업로드 *
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.webp"
                onChange={(e) => setBusinessCardFile(e.target.files?.[0] || null)}
                style={styles.fileInput}
                required={isForeign}
              />

              <label style={{ ...styles.label, marginTop: 12 }}>
                사업자등록증 / 회사등록증 업로드 *
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.webp"
                onChange={(e) =>
                  setBusinessRegistrationFile(e.target.files?.[0] || null)
                }
                style={styles.fileInput}
                required={isForeign}
              />

              <label style={{ ...styles.label, marginTop: 12 }}>
                회사 웹사이트
              </label>
              <input
                type="url"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                style={styles.input}
                placeholder="https://company.com"
              />
            </div>
          )}

          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        {msg ? <div style={styles.msg}>{msg}</div> : null}

        <div style={styles.bottomRow}>
          <Link href="/buyer/login" style={styles.secondaryBtn}>
            로그인으로
          </Link>

          <Link href="/login" style={styles.back}>
            ← 로그인 선택으로
          </Link>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%)",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 640,
    background: "#fff",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#ea580c",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 34,
    fontWeight: 950,
  },
  desc: {
    marginTop: 12,
    color: "#64748b",
    lineHeight: 1.7,
  },
  form: {
    marginTop: 20,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 900,
    marginBottom: 8,
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
  fileInput: {
    width: "100%",
    padding: "12px 0",
    boxSizing: "border-box",
    fontSize: 14,
  },
  foreignBox: {
    marginTop: 18,
    padding: 18,
    borderRadius: 16,
    border: "1px solid #fed7aa",
    background: "#fff7ed",
  },
  foreignTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#9a3412",
  },
  foreignDesc: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.7,
    color: "#7c2d12",
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
  },
  msg: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    background: "#f8fafc",
    color: "#334155",
    whiteSpace: "pre-wrap",
    lineHeight: 1.7,
  },
  bottomRow: {
    marginTop: 18,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    textDecoration: "none",
    fontWeight: 900,
    color: "#111",
  },
  back: {
    color: "#111",
    textDecoration: "none",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
  },
};