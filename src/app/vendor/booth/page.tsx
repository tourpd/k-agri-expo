"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Booth = {
  booth_id: string;
  name: string | null;
  intro: string | null;
  description: string | null;
  website_url: string | null;
  youtube_url: string | null;
  hero_image_url: string | null;
  logo_url: string | null;
  is_public: boolean | null;
  status: string | null;
};

type Vendor = {
  id: string;
  email: string | null;
  company_name: string | null;
};

export const dynamic = "force-dynamic";

export default function VendorBoothPage() {
  const router = useRouter();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [booth, setBooth] = useState<Booth | null>(null);
  const [verified, setVerified] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  async function loadBooth() {
    setLoading(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch("/api/vendor/my-booth", {
        cache: "no-store",
      });
      const data = await res.json();

      if (res.status === 401) {
        router.replace("/login/vendor");
        return;
      }

      if (!data.success) {
        setErrorText(data.error || "내 부스를 불러오지 못했습니다.");
        return;
      }

      setVendor(data.vendor || null);
      setBooth(data.booth || null);
      setVerified(!!data.verified);
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooth();
  }, []);

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/vendor/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "업로드 실패");
    }

    return data.url as string;
  }

  async function handleImageUpload(
    type: "hero_image_url" | "logo_url",
    file?: File | null
  ) {
    if (!booth || !file) return;

    if (!verified) {
      setErrorText("인증된 업체만 이미지 업로드가 가능합니다.");
      return;
    }

    try {
      setSaving(true);
      setErrorText("");
      setMessage("");

      const url = await uploadImage(file);

      setBooth((prev) =>
        prev
          ? {
              ...prev,
              [type]: url,
            }
          : prev
      );

      setMessage(
        type === "logo_url"
          ? "로고 업로드가 완료되었습니다."
          : "대표 이미지 업로드가 완료되었습니다."
      );
    } catch (e: any) {
      setErrorText(e?.message || "이미지 업로드에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function saveBooth() {
    if (!booth) return;

    if (!verified) {
      setErrorText("인증된 업체만 부스 수정이 가능합니다.");
      return;
    }

    setSaving(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch("/api/vendor/my-booth", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(booth),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "저장에 실패했습니다.");
        return;
      }

      setBooth(data.booth);
      setMessage(data.message || "부스 정보가 저장되었습니다.");
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const readOnly = !verified || saving;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[28px] bg-slate-950 px-6 py-7 text-white shadow-2xl md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-black tracking-wide text-emerald-300">
                MY BOOTH
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                업체 전용 부스 관리
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                부스명, 한줄 소개, 상세 설명, 홈페이지, 유튜브, 대표 이미지,
                로고를 직접 수정할 수 있습니다. 부스 완성도가 높을수록 엑스포
                방문자에게 더 신뢰 있게 보입니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/vendor/dashboard"
                className="rounded-2xl border border-slate-600 px-4 py-3 text-sm font-black text-white"
              >
                대시보드로 이동
              </Link>

              {booth?.booth_id ? (
                <Link
                  href={`/expo/booths/${booth.booth_id}`}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900"
                >
                  내 공개 부스 보기
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorText ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {errorText}
          </div>
        ) : null}

        {loading ? (
          <section className="rounded-[28px] bg-white p-6 shadow-sm text-slate-500">
            내 부스를 불러오는 중...
          </section>
        ) : booth ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <InfoCard
                title="로그인 업체"
                value={vendor?.company_name || "업체명 없음"}
                subValue={vendor?.email || "-"}
              />
              <InfoCard
                title="부스 상태"
                value={booth.status || "-"}
                subValue={`부스 ID: ${booth.booth_id}`}
              />
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-slate-500">수정 권한</div>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                      verified
                        ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                        : "border border-amber-200 bg-amber-100 text-amber-700"
                    }`}
                  >
                    {verified ? "인증 완료 업체" : "미인증 / 수정 제한"}
                  </span>
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  {verified
                    ? "부스 정보와 이미지를 자유롭게 수정할 수 있습니다."
                    : "인증 전에는 저장과 이미지 업로드가 제한됩니다."}
                </div>
              </div>
            </section>

            {!verified ? (
              <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
                <div className="text-sm font-black text-amber-700">
                  EDIT NOTICE
                </div>
                <h2 className="mt-1 text-xl font-black text-amber-900">
                  현재는 수정 제한 상태입니다
                </h2>
                <div className="mt-3 text-sm leading-7 text-amber-900">
                  업체 인증이 완료되어야 부스 정보 저장과 이미지 업로드가 가능합니다.
                  승인 전에는 화면 확인만 가능하고, 실제 반영은 제한됩니다.
                </div>
              </section>
            ) : null}

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <div className="text-sm font-black text-emerald-700">
                  BASIC INFO
                </div>
                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  기본 정보
                </h2>
              </div>

              <div className="grid gap-4">
                <InputField
                  label="부스명"
                  value={booth.name || ""}
                  onChange={(value) =>
                    setBooth({ ...booth, name: value })
                  }
                  disabled={readOnly}
                  placeholder="예: 한국농수산TV 추천관"
                />

                <InputField
                  label="한줄 소개"
                  value={booth.intro || ""}
                  onChange={(value) =>
                    setBooth({ ...booth, intro: value })
                  }
                  disabled={readOnly}
                  placeholder="예: 농민에게 꼭 필요한 제품과 정보를 소개합니다."
                />

                <TextAreaField
                  label="상세 설명"
                  value={booth.description || ""}
                  onChange={(value) =>
                    setBooth({ ...booth, description: value })
                  }
                  disabled={readOnly}
                  rows={6}
                  placeholder="회사 소개, 강점, 주력 제품, 상담 유도 문구 등을 자세히 입력해 주세요."
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="홈페이지 URL"
                    value={booth.website_url || ""}
                    onChange={(value) =>
                      setBooth({ ...booth, website_url: value })
                    }
                    disabled={readOnly}
                    placeholder="https://"
                  />

                  <InputField
                    label="유튜브 URL"
                    value={booth.youtube_url || ""}
                    onChange={(value) =>
                      setBooth({ ...booth, youtube_url: value })
                    }
                    disabled={readOnly}
                    placeholder="https://"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <div className="text-sm font-black text-emerald-700">
                  IMAGE ASSETS
                </div>
                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  대표 이미지 / 로고
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  대표 이미지는 부스 첫인상에 큰 영향을 줍니다. 로고는 흰 배경 또는
                  투명 배경 이미지를 권장합니다.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <ImageUploadCard
                  title="대표 이미지"
                  imageUrl={booth.hero_image_url}
                  emptyText="대표 이미지 없음"
                  disabled={readOnly}
                  onFileChange={(file) =>
                    handleImageUpload("hero_image_url", file)
                  }
                  helpText="가로형 배너 이미지나 대표 제품 이미지가 좋습니다."
                />

                <ImageUploadCard
                  title="로고"
                  imageUrl={booth.logo_url}
                  emptyText="로고 없음"
                  disabled={readOnly}
                  onFileChange={(file) =>
                    handleImageUpload("logo_url", file)
                  }
                  contain
                  helpText="정사각형 또는 가로형 로고를 권장합니다."
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <div className="text-sm font-black text-emerald-700">
                  SAVE
                </div>
                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  저장 및 이동
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveBooth}
                  disabled={saving || !verified}
                  className="rounded-2xl bg-slate-950 px-6 py-4 text-base font-black text-white disabled:opacity-60"
                >
                  {saving ? "저장 중..." : "내 부스 저장"}
                </button>

                <Link
                  href="/vendor/dashboard"
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-base font-black text-slate-900"
                >
                  대시보드로 이동
                </Link>

                <Link
                  href={`/expo/booths/${booth.booth_id}`}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-base font-black text-slate-900"
                >
                  내 공개 부스 보기
                </Link>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-[28px] bg-white p-6 shadow-sm text-slate-600">
            연결된 부스가 없습니다. 관리자에게 문의해 주세요.
          </section>
        )}
      </div>
    </main>
  );
}

function InfoCard({
  title,
  value,
  subValue,
}: {
  title: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
      {subValue ? (
        <div className="mt-2 text-sm leading-7 text-slate-600">{subValue}</div>
      ) : null}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-black text-slate-800">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-black disabled:bg-slate-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  disabled,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-black text-slate-800">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows || 4}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-black disabled:bg-slate-100"
      />
    </label>
  );
}

function ImageUploadCard({
  title,
  imageUrl,
  emptyText,
  onFileChange,
  disabled,
  helpText,
  contain,
}: {
  title: string;
  imageUrl: string | null;
  emptyText: string;
  onFileChange: (file?: File | null) => void;
  disabled?: boolean;
  helpText?: string;
  contain?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 p-5">
      <div className="text-lg font-black text-slate-900">{title}</div>
      {helpText ? (
        <div className="mt-2 text-sm leading-7 text-slate-600">{helpText}</div>
      ) : null}

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className={`mt-4 h-48 w-full rounded-2xl border bg-white ${
            contain ? "object-contain" : "object-cover"
          }`}
        />
      ) : (
        <div className="mt-4 flex h-48 items-center justify-center rounded-2xl border bg-slate-50 text-sm text-slate-500">
          {emptyText}
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        disabled={disabled}
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        className="mt-4 w-full rounded-2xl border border-slate-300 px-3 py-3 disabled:bg-slate-100"
      />
    </div>
  );
}