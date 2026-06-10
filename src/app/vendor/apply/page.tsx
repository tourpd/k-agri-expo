"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PlanType = "free" | "bronze" | "silver" | "gold" | "enterprise";
type BillingCycle = "monthly" | "yearly";
type BoothType = "free" | "basic" | "premium";
type DurationKey = "1m" | "3m";

type ProductCode =
  | "free_1m"
  | "basic_1m"
  | "basic_3m"
  | "premium_1m"
  | "premium_3m";

type HallCode =
  | "agri_inputs"
  | "machinery"
  | "seeds_seedlings"
  | "smart_farm"
  | "eco_friendly"
  | "future_insect";

type FormState = {
  company_name: string;
  representative_name: string;
  email: string;
  phone: string;
  tax_email: string;
  business_number: string;
  open_date: string;
  business_address: string;
  biz_type: string;
  biz_item: string;
  preferred_hall_1: HallCode | "";
  preferred_hall_2: HallCode | "";
  source_file_name: string;
  source_file_mime: string;
  source_extracted_json: Record<string, unknown> | null;
};

const OPERATIONS = {
  bankAccount: "기업은행 466-072683-04-011",
  phone: "010-8216-1253",
  email: "tourpd70@gmail.com",
};

const PLAN_OPTIONS: Record<
  PlanType,
  {
    title: string;
    badge: string;
    icon: string;
    desc: string;
    monthlyPrice: number;
    productLimit: string;
    booth_type: BoothType;
    product_code: ProductCode;
    colorClass: string;
    features: string[];
  }
> = {
  free: {
    title: "무료 체험",
    badge: "체험",
    icon: "🌱",
    desc: "처음 입점하는 업체",
    monthlyPrice: 0,
    productLimit: "제품 1개",
    booth_type: "free",
    product_code: "free_1m",
    colorClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
    features: ["제품 1개 등록", "기본 전시 기능", "상담 문의 수신"],
  },
  bronze: {
    title: "브론즈",
    badge: "기본",
    icon: "🥉",
    desc: "소규모 업체 기본 입점",
    monthlyPrice: 50000,
    productLimit: "제품 5개",
    booth_type: "basic",
    product_code: "basic_1m",
    colorClass: "border-blue-200 bg-blue-50 text-blue-800",
    features: ["제품 5개 등록", "전시관 노출", "기본 통계 제공"],
  },
  silver: {
    title: "실버",
    badge: "추천",
    icon: "🥈",
    desc: "제품군이 있는 성장 업체",
    monthlyPrice: 120000,
    productLimit: "제품 10개",
    booth_type: "basic",
    product_code: "basic_3m",
    colorClass: "border-violet-200 bg-violet-50 text-violet-800",
    features: ["제품 10개 등록", "상세 페이지 제공", "통계 분석 제공", "우선 상담 지원"],
  },
  gold: {
    title: "골드",
    badge: "강화",
    icon: "🏆",
    desc: "전국 홍보가 필요한 브랜드",
    monthlyPrice: 350000,
    productLimit: "제품 20개",
    booth_type: "premium",
    product_code: "premium_3m",
    colorClass: "border-amber-200 bg-amber-50 text-amber-800",
    features: ["제품 20개 등록", "프리미엄 전시관", "마케팅 배너 지원", "전용 매니저 배정"],
  },
  enterprise: {
    title: "엔터프라이즈",
    badge: "맞춤",
    icon: "🤝",
    desc: "대형 업체·해외 업체·특별관",
    monthlyPrice: 0,
    productLimit: "제품 무제한",
    booth_type: "premium",
    product_code: "premium_3m",
    colorClass: "border-cyan-200 bg-cyan-50 text-cyan-800",
    features: ["무제한 제품 등록", "맞춤형 전시관 구성", "전용 마케팅 지원", "데이터 연동 지원"],
  },
};

const HALL_OPTIONS: { value: HallCode; label: string; icon: string }[] = [
  { value: "agri_inputs", label: "농자재관", icon: "🌿" },
  { value: "machinery", label: "농기계관", icon: "🚜" },
  { value: "seeds_seedlings", label: "종자·묘종관", icon: "🌱" },
  { value: "smart_farm", label: "스마트팜관", icon: "📡" },
  { value: "eco_friendly", label: "친환경관", icon: "♻️" },
  { value: "future_insect", label: "미래식량·곤충관", icon: "🦗" },
];

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatKrw(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function yearlyMonthlyPrice(monthly: number) {
  return Math.round(monthly * 0.8);
}

function yearlyTotalPrice(monthly: number) {
  return yearlyMonthlyPrice(monthly) * 12;
}

function calcAmount(planType: PlanType, billingCycle: BillingCycle) {
  const plan = PLAN_OPTIONS[planType];
  if (planType === "free" || planType === "enterprise") return 0;
  if (billingCycle === "yearly") return yearlyTotalPrice(plan.monthlyPrice);
  return plan.monthlyPrice;
}

function getBillingLabel(planType: PlanType, billingCycle: BillingCycle) {
  if (planType === "free") return "30일 무료체험";
  if (planType === "enterprise") return "별도 협의";
  if (billingCycle === "yearly") return "1년 계약 일시불 · 20% 할인";
  return "월결제";
}

function formatBusinessNo(raw: string) {
  const digits = onlyDigits(raw).slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function normalizeBusinessNo(raw: string) {
  return onlyDigits(raw).slice(0, 10);
}

function formatPhone(raw: string) {
  const digits = onlyDigits(raw).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function normalizePhone(raw: string) {
  return onlyDigits(raw).slice(0, 11);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function hallLabel(value: string) {
  return HALL_OPTIONS.find((item) => item.value === value)?.label ?? "-";
}

export default function VendorApplyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [planType, setPlanType] = useState<PlanType>("free");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreviewUrl, setLicensePreviewUrl] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [businessLicenseBucket, setBusinessLicenseBucket] = useState("");
  const [businessLicensePath, setBusinessLicensePath] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const [form, setForm] = useState<FormState>({
    company_name: "",
    representative_name: "",
    email: "",
    phone: "",
    tax_email: "",
    business_number: "",
    open_date: "",
    business_address: "",
    biz_type: "",
    biz_item: "",
    preferred_hall_1: "agri_inputs",
    preferred_hall_2: "",
    source_file_name: "",
    source_file_mime: "",
    source_extracted_json: null,
  });

  useEffect(() => {
    return () => {
      if (licensePreviewUrl) URL.revokeObjectURL(licensePreviewUrl);
    };
  }, [licensePreviewUrl]);

  const selectedPlan = useMemo(() => PLAN_OPTIONS[planType], [planType]);
  const amountKrw = calcAmount(planType, billingCycle);
  const billingLabel = getBillingLabel(planType, billingCycle);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetBusinessLicenseUpload() {
    setLicenseFile(null);
    setBusinessLicenseBucket("");
    setBusinessLicensePath("");
    setUploadMessage("");
    setSubmitMessage("");
    updateForm("source_file_name", "");
    updateForm("source_file_mime", "");
    updateForm("source_extracted_json", null);

    if (licensePreviewUrl) URL.revokeObjectURL(licensePreviewUrl);

    setLicensePreviewUrl("");
    setFileInputKey((prev) => prev + 1);
  }

  function handleSelectLicenseFile(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setSubmitMessage("");
    setLicenseFile(file);
    setBusinessLicenseBucket("");
    setBusinessLicensePath("");
    setUploadMessage("");

    if (licensePreviewUrl) URL.revokeObjectURL(licensePreviewUrl);

    updateForm("source_file_name", file.name);
    updateForm("source_file_mime", file.type || "");
    updateForm("source_extracted_json", null);
    setLicensePreviewUrl(URL.createObjectURL(file));
  }

  async function handleUploadBusinessLicense() {
    if (!licenseFile) {
      alert("사업자등록증 파일을 먼저 선택해주세요.");
      return;
    }

    setIsUploadingLicense(true);
    setUploadMessage("");
    setSubmitMessage("");

    try {
      const fd = new FormData();
      fd.append("file", licenseFile);

      const res = await fetch("/api/vendor/upload-business-license", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(
          json?.detail || json?.error || "사업자등록증 업로드에 실패했습니다."
        );
      }

      setBusinessLicenseBucket(json.bucket || "");
      setBusinessLicensePath(json.path || "");
      updateForm("source_file_name", json.fileName || licenseFile.name);
      updateForm("source_file_mime", json.mimeType || licenseFile.type || "");

      const extracted = json.extracted;

      if (extracted) {
        if (extracted.company_name) updateForm("company_name", extracted.company_name);
        if (extracted.representative_name) updateForm("representative_name", extracted.representative_name);
        if (extracted.business_number) updateForm("business_number", formatBusinessNo(extracted.business_number));
        if (extracted.business_address) updateForm("business_address", extracted.business_address);
        if (extracted.biz_type) updateForm("biz_type", extracted.biz_type);
        if (extracted.biz_item) updateForm("biz_item", extracted.biz_item);
        if (extracted.open_date) updateForm("open_date", extracted.open_date);
        updateForm("source_extracted_json", extracted);
      }

      setUploadMessage(
        json.ocr_success
          ? "사업자등록증 업로드와 자동입력이 완료되었습니다. 내용을 확인해주세요."
          : "사업자등록증 업로드는 완료됐습니다. 자동입력 내용은 직접 확인해주세요."
      );
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "사업자등록증 업로드에 실패했습니다."
      );
    } finally {
      setIsUploadingLicense(false);
    }
  }

  function goNextFromStep2() {
    if (!form.preferred_hall_1) {
      alert("희망 전시관 1순위를 선택해주세요.");
      return;
    }

    if (form.preferred_hall_2 && form.preferred_hall_1 === form.preferred_hall_2) {
      alert("희망 전시관 1순위와 2순위는 다르게 선택해주세요.");
      return;
    }

    setStep(3);
  }

  function goNextFromStep3() {
    if (!licenseFile) {
      alert("사업자등록증 이미지를 선택해주세요.");
      return;
    }

    if (!businessLicenseBucket || !businessLicensePath) {
      alert("사업자등록증 업로드를 먼저 완료해주세요.");
      return;
    }

    if (!form.company_name.trim()) {
      alert("회사명은 필수입니다.");
      return;
    }

    if (!form.representative_name.trim()) {
      alert("대표자명은 필수입니다.");
      return;
    }

    if (normalizeBusinessNo(form.business_number).length !== 10) {
      alert("사업자등록번호를 정확히 입력해주세요.");
      return;
    }

    if (!form.business_address.trim()) {
      alert("사업장 주소는 필수입니다.");
      return;
    }

    if (!form.biz_type.trim()) {
      alert("업태는 필수입니다.");
      return;
    }

    if (!form.biz_item.trim()) {
      alert("종목은 필수입니다.");
      return;
    }

    if (!form.email.trim() || !isValidEmail(form.email)) {
      alert("담당자 이메일을 정확히 입력해주세요.");
      return;
    }

    if (form.tax_email.trim() && !isValidEmail(form.tax_email)) {
      alert("세금계산서 이메일 형식을 확인해주세요.");
      return;
    }

    if (normalizePhone(form.phone).length < 10) {
      alert("담당자 연락처를 정확히 입력해주세요.");
      return;
    }

    setStep(4);
  }

  async function handleSubmit() {
    if (!businessLicenseBucket || !businessLicensePath) {
      alert("사업자등록증 업로드 정보가 없습니다.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const normalizedPhone = normalizePhone(form.phone);

      const durationMonths =
        planType === "free" || planType === "enterprise"
          ? 1
          : billingCycle === "yearly"
          ? 12
          : 1;

      const durationKey: DurationKey = durationMonths > 1 ? "3m" : "1m";

      const payload = {
        apply_method: "agency",

        plan_type: planType,
        billing_cycle: billingCycle,
        billing_label: billingLabel,
        product_limit: selectedPlan.productLimit,

        booth_type: selectedPlan.booth_type,
        duration_key: durationKey,
        duration_months: durationMonths,
        amount_krw: amountKrw,
        product_code: selectedPlan.product_code,
        plan_code: selectedPlan.product_code,

        company_name: form.company_name.trim(),
        representative_name: form.representative_name.trim(),
        ceo_name: form.representative_name.trim(),
        contact_name: form.representative_name.trim(),

        email: form.email.trim(),
        contact_email: form.email.trim(),
        phone: normalizedPhone,
        contact_phone: normalizedPhone,
        tax_email: form.tax_email.trim() || form.email.trim(),

        business_number: normalizeBusinessNo(form.business_number),
        open_date: form.open_date.trim(),
        business_address: form.business_address.trim(),

        biz_type: form.biz_type.trim(),
        business_type: form.biz_type.trim(),
        biz_item: form.biz_item.trim(),
        business_item: form.biz_item.trim(),

        category_primary: "other",
        company_intro: "입점 신청 단계에서는 회사소개 미입력",

        website_url: null,
        youtube_url: null,
        brochure_url: null,

        preferred_hall_1: form.preferred_hall_1,
        preferred_hall_2: form.preferred_hall_2 || null,
        preferred_category: "other",

        placement_preference: "operator_recommended",
        promotion_preference: "standard",

        source_file_name: form.source_file_name,
        source_file_mime: form.source_file_mime,
        source_extracted_json: {
          ...(form.source_extracted_json || {}),
          plan_type: planType,
          plan_name: selectedPlan.title,
          product_limit: selectedPlan.productLimit,
          billing_cycle: billingCycle,
          billing_label: billingLabel,
        },

        business_license_bucket: businessLicenseBucket,
        business_license_path: businessLicensePath,
      };

      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !(json?.success || json?.ok)) {
        throw new Error(
          json?.detail || json?.error || "입점 신청 저장 중 오류가 발생했습니다."
        );
      }

      const params = new URLSearchParams({
        application_id: String(json.application_id ?? json.application?.application_id ?? ""),
        application_code: String(json.application_code ?? json.application?.application_code ?? ""),
        company_name: form.company_name.trim(),

        plan_type: planType,
        plan_name: selectedPlan.title,
        product_limit: selectedPlan.productLimit,
        billing_label: billingLabel,

        booth_type: selectedPlan.booth_type,
        duration_key: durationKey,
        amount_krw: String(json.amount_krw ?? amountKrw ?? 0),
        phone: normalizedPhone,
      });

      router.push(`/vendor/apply/complete?${params.toString()}`);
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : "신청 제출에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faf4] px-4 py-8 text-[#172117]">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-6 p-8 md:grid-cols-[1.3fr_0.7fr] md:p-10">
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                K-Agri Expo 입점 신청
              </h1>
              <p className="mt-4 text-lg font-bold text-emerald-700">
                먼저 플랜을 보고, 입점할지 바로 결정하세요.
              </p>
              <p className="mt-3 text-base font-semibold text-neutral-600">
                플랜 선택 → 희망 전시관 선택 → 사업자등록증 자동입력 → 최종 확인
              </p>
            </div>

            <div className="hidden items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 to-amber-50 md:flex">
              <div className="text-center">
                <div className="text-6xl">🏕️</div>
                <div className="mt-3 text-xl font-black text-emerald-800">
                  온라인 농업 전시관
                </div>
              </div>
            </div>
          </div>
        </section>

        <StepBar step={step} />

        <CurrentSelection
          planType={planType}
          selectedPlan={selectedPlan}
          billingCycle={billingCycle}
          amountKrw={amountKrw}
        />

        {step === 1 && (
          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white">
                1
              </div>
              <div>
                <h2 className="text-2xl font-black">입점 플랜을 선택해주세요</h2>
                <p className="mt-1 text-sm font-semibold text-neutral-500">
                  귀사에 맞는 최적의 플랜을 선택하고 비즈니스를 성장시켜보세요.
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-base font-black text-amber-800">
                    연 계약 할인 혜택
                  </div>
                  <div className="text-sm font-semibold text-amber-700">
                    1년 계약 일시불 선택 시 20% 할인 혜택을 드립니다.
                  </div>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-700">
                  20% 할인
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              {(Object.keys(PLAN_OPTIONS) as PlanType[]).map((key) => {
                const plan = PLAN_OPTIONS[key];
                const selected = planType === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setPlanType(key);
                      if (key === "free" || key === "enterprise") {
                        setBillingCycle("monthly");
                      }
                    }}
                    className={`rounded-3xl border p-5 text-left transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200"
                        : "border-neutral-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <div
                      className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-2xl ${plan.colorClass}`}
                    >
                      {plan.icon}
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-black">{plan.title}</div>
                      <div className="mt-2 text-xl font-black text-slate-800">
                        {key === "enterprise"
                          ? "별도 협의"
                          : key === "free"
                          ? "0원 / 30일"
                          : `월 ${formatKrw(plan.monthlyPrice)}`}
                      </div>
                      <div className="mt-2 text-base font-black text-emerald-700">
                        {plan.productLimit}
                      </div>

                      {key !== "free" && key !== "enterprise" && (
                        <div className="mt-4 rounded-2xl border border-neutral-100 bg-white/80 p-3">
                          <div className="text-sm font-black text-blue-700">
                            1년 계약 시
                          </div>
                          <div className="mt-1 text-base font-black text-blue-700">
                            월 {formatKrw(yearlyMonthlyPrice(plan.monthlyPrice))}
                          </div>
                          <div className="text-xs font-bold text-neutral-500">
                            일시불 {formatKrw(yearlyTotalPrice(plan.monthlyPrice))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 space-y-2 border-t border-neutral-100 pt-4">
                      {plan.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex gap-2 text-sm font-bold text-neutral-700"
                        >
                          <span className="text-emerald-600">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {planType !== "free" && planType !== "enterprise" && (
              <div className="mt-6">
                <SelectField
                  label="선택한 플랜 결제 방식"
                  value={billingCycle}
                  onChange={(v) => setBillingCycle(v as BillingCycle)}
                  options={[
                    { value: "monthly", label: "월결제" },
                    { value: "yearly", label: "1년 계약 일시불 · 20% 할인" },
                  ]}
                />
              </div>
            )}

            <BottomButtons
              prev={() => {}}
              hidePrev
              next={() => setStep(2)}
              nextLabel="다음 단계"
            />
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-black">2. 희망 전시관을 선택해주세요</h2>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black">희망 전시관 1순위</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {HALL_OPTIONS.map((hall) => {
                  const selected = form.preferred_hall_1 === hall.value;

                  return (
                    <button
                      key={hall.value}
                      type="button"
                      onClick={() => {
                        updateForm("preferred_hall_1", hall.value);
                        if (form.preferred_hall_2 === hall.value) {
                          updateForm("preferred_hall_2", "");
                        }
                      }}
                      className={`rounded-2xl border p-5 text-left text-lg font-black ${
                        selected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200"
                          : "border-neutral-200 bg-white text-black"
                      }`}
                    >
                      <span className="mr-2">{hall.icon}</span>
                      {hall.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <SelectField
              label="희망 전시관 2순위"
              value={form.preferred_hall_2}
              onChange={(v) => updateForm("preferred_hall_2", v as HallCode | "")}
              options={[
                { value: "", label: "선택 안 함" },
                ...HALL_OPTIONS.filter((item) => item.value !== form.preferred_hall_1),
              ]}
            />

            <BottomButtons
              prev={() => setStep(1)}
              next={goNextFromStep2}
              nextLabel="다음 단계"
            />
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-black">3. 사업자등록증 등록</h2>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-base font-bold leading-7 text-blue-900">
              사업자등록증을 업로드하면 회사명, 대표자, 사업자등록번호, 주소, 업태, 종목을 자동으로 입력합니다.
              틀린 내용만 수정해주세요.
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-3 text-base font-black">사업자등록증 파일 *</div>

              <input
                key={fileInputKey}
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  handleSelectLicenseFile(e.target.files?.[0] || null);
                }}
              />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl bg-emerald-700 px-6 py-4 text-lg font-black text-white shadow-sm"
                >
                  사업자등록증 파일 선택
                </button>

                <button
                  type="button"
                  onClick={handleUploadBusinessLicense}
                  disabled={!licenseFile || isUploadingLicense}
                  className="rounded-2xl bg-black px-6 py-4 text-lg font-black text-white disabled:bg-neutral-300 disabled:text-neutral-500"
                >
                  {isUploadingLicense ? "자동입력 중..." : "업로드하고 자동입력"}
                </button>

                <button
                  type="button"
                  onClick={resetBusinessLicenseUpload}
                  className="rounded-2xl border border-neutral-300 bg-white px-6 py-4 text-lg font-black text-black"
                >
                  다시 선택
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-base font-bold">
                {licenseFile ? (
                  <span className="text-neutral-800">선택 파일: {licenseFile.name}</span>
                ) : (
                  <span className="text-neutral-400">아직 파일을 선택하지 않았습니다.</span>
                )}
              </div>

              {uploadMessage && (
                <div className="mt-4 rounded-2xl bg-neutral-100 p-4 text-base font-bold whitespace-pre-wrap">
                  {uploadMessage}
                </div>
              )}

              {businessLicenseBucket && businessLicensePath && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-base font-black text-emerald-800">
                  사업자등록증 업로드 완료
                </div>
              )}

              {licensePreviewUrl && (
                <div className="mt-4 rounded-2xl border border-neutral-200 p-4">
                  <div className="mb-2 text-base font-black">업로드 미리보기</div>
                  <img
                    src={licensePreviewUrl}
                    alt="사업자등록증 미리보기"
                    className="max-h-[520px] w-auto rounded-xl border border-neutral-200"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputField label="회사명 *" value={form.company_name} onChange={(v) => updateForm("company_name", v)} />
              <InputField label="대표자명 *" value={form.representative_name} onChange={(v) => updateForm("representative_name", v)} />
              <InputField label="사업자등록번호 *" value={form.business_number} onChange={(v) => updateForm("business_number", formatBusinessNo(v))} />
              <InputField label="개업연월일" value={form.open_date} onChange={(v) => updateForm("open_date", v)} placeholder="예: 2025-07-10" />
              <InputField label="업태 *" value={form.biz_type} onChange={(v) => updateForm("biz_type", v)} />
              <InputField label="종목 *" value={form.biz_item} onChange={(v) => updateForm("biz_item", v)} />
              <InputField label="담당자 이메일 *" type="email" value={form.email} onChange={(v) => updateForm("email", v)} />
              <InputField label="담당자 연락처 *" value={form.phone} onChange={(v) => updateForm("phone", formatPhone(v))} />
              <InputField label="세금계산서 이메일" type="email" value={form.tax_email} onChange={(v) => updateForm("tax_email", v)} />
            </div>

            <TextAreaField
              label="사업장 주소 *"
              value={form.business_address}
              onChange={(v) => updateForm("business_address", v)}
              rows={3}
            />

            <BottomButtons
              prev={() => setStep(2)}
              next={goNextFromStep3}
              nextLabel="최종 확인"
            />
          </section>
        )}

        {step === 4 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-black">4. 최종 확인</h2>

            <SummaryCard
              title="신청 정보"
              rows={[
                ["선택 플랜", selectedPlan.title],
                ["제품 등록 수", selectedPlan.productLimit],
                ["결제 방식", billingLabel],
                ["결제 금액", planType === "enterprise" ? "별도 협의" : formatKrw(amountKrw)],
                ["희망 전시관 1순위", hallLabel(form.preferred_hall_1)],
                ["희망 전시관 2순위", form.preferred_hall_2 ? hallLabel(form.preferred_hall_2) : "선택 안 함"],
              ]}
            />

            <SummaryCard
              title="사업자 정보"
              rows={[
                ["회사명", form.company_name || "-"],
                ["대표자명", form.representative_name || "-"],
                ["사업자등록번호", form.business_number || "-"],
                ["개업연월일", form.open_date || "-"],
                ["업태", form.biz_type || "-"],
                ["종목", form.biz_item || "-"],
                ["사업장 주소", form.business_address || "-"],
              ]}
            />

            <SummaryCard
              title="담당자 / 운영 정보"
              rows={[
                ["담당자 이메일", form.email || "-"],
                ["담당자 연락처", form.phone || "-"],
                ["세금계산서 이메일", form.tax_email || form.email || "-"],
                ["사업자등록증 파일", form.source_file_name || "-"],
                ["운영 계좌", OPERATIONS.bankAccount],
                ["문의 전화", OPERATIONS.phone],
                ["문의 이메일", OPERATIONS.email],
              ]}
            />

            {submitMessage && (
              <div className="rounded-2xl bg-red-50 p-4 text-base font-bold text-red-700 whitespace-pre-wrap">
                {submitMessage}
              </div>
            )}

            <BottomButtons
              prev={() => setStep(3)}
              next={handleSubmit}
              nextLabel={isSubmitting ? "제출 중..." : "입점 신청 제출"}
              disabled={isSubmitting}
            />
          </section>
        )}
      </div>
    </main>
  );
}

function StepBar({ step }: { step: 1 | 2 | 3 | 4 }) {
  const labels = ["플랜 선택", "희망 전시관", "사업자 정보", "최종 확인"];

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-4">
      {labels.map((label, index) => {
        const n = (index + 1) as 1 | 2 | 3 | 4;
        const active = step === n;
        const done = step > n;

        return (
          <div
            key={label}
            className={`rounded-2xl border p-5 text-sm font-black shadow-sm ${
              active
                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                : done
                ? "border-emerald-200 bg-white text-emerald-700"
                : "border-neutral-200 bg-white text-neutral-500"
            }`}
          >
            STEP {n}
            <div className="mt-1 text-base">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function CurrentSelection({
  planType,
  selectedPlan,
  billingCycle,
  amountKrw,
}: {
  planType: PlanType;
  selectedPlan: (typeof PLAN_OPTIONS)[PlanType];
  billingCycle: BillingCycle;
  amountKrw: number;
}) {
  return (
    <div className="mb-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr] md:items-center">
        <div>
          <div className="text-sm font-black text-neutral-500">현재 선택</div>
          <div className="mt-1 text-2xl font-black">
            {selectedPlan.title} · {selectedPlan.productLimit}
          </div>
          <div className="mt-2 text-base font-bold text-neutral-700">
            결제 예정 금액:{" "}
            <span className="text-emerald-700">
              {planType === "enterprise" ? "별도 협의" : formatKrw(amountKrw)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">
          <div className="text-sm font-black text-emerald-700">혜택</div>
          <div className="mt-1 text-base font-bold text-neutral-700">
            {planType === "free"
              ? "30일 무료 체험"
              : planType === "enterprise"
              ? "맞춤형 전시관 구성"
              : billingCycle === "yearly"
              ? "1년 계약 일시불 20% 할인 적용"
              : "월 단위 입점"}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-base font-black">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-4 text-lg text-black placeholder:text-neutral-400 outline-none focus:border-emerald-600"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-base font-black">{label}</div>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-4 text-lg text-black placeholder:text-neutral-400 outline-none focus:border-emerald-600"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <div className="mb-2 text-base font-black">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-4 text-lg text-black outline-none focus:border-emerald-600"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryCard({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 text-xl font-black">{title}</div>
      <div className="space-y-3">
        {rows.map(([k, v], idx) => (
          <div
            key={`${k}-${idx}`}
            className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 text-base"
          >
            <div className="font-bold text-neutral-500">{k}</div>
            <div className="max-w-[70%] break-words text-right font-black text-black">
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BottomButtons({
  prev,
  next,
  nextLabel,
  disabled,
  hidePrev,
}: {
  prev: () => void;
  next: () => void;
  nextLabel: string;
  disabled?: boolean;
  hidePrev?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pt-6">
      {hidePrev ? (
        <div />
      ) : (
        <button
          type="button"
          onClick={prev}
          className="rounded-2xl border border-neutral-300 bg-white px-6 py-4 text-lg font-black text-black"
        >
          이전
        </button>
      )}

      <button
        type="button"
        onClick={next}
        disabled={disabled}
        className="rounded-2xl bg-emerald-700 px-7 py-4 text-lg font-black text-white shadow-md disabled:opacity-50"
      >
        {nextLabel} →
      </button>
    </div>
  );
}