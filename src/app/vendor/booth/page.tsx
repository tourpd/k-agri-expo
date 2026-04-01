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

  const loadBooth = async () => {
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
  };

  useEffect(() => {
    loadBooth();
  }, []);

  const uploadImage = async (file: File) => {
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
  };

  const handleImageUpload = async (
    type: "hero_image_url" | "logo_url",
    file?: File | null
  ) => {
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
        type === "logo_url" ? "로고 업로드 완료" : "대표 이미지 업로드 완료"
      );
    } catch (e: any) {
      setErrorText(e?.message || "이미지 업로드 실패");
    } finally {
      setSaving(false);
    }
  };

  const saveBooth = async () => {
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
      setMessage(data.message || "저장되었습니다.");
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-2xl">
          <div className="text-sm font-black text-emerald-300">MY BOOTH</div>
          <h1 className="mt-3 text-4xl font-black">업체 전용 부스 수정</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
            로그인된 업체의 부스를 자동으로 불러와 소개, 상세설명, 링크, 대표 이미지,
            로고를 직접 수정할 수 있습니다.
          </p>
        </section>

        {message ? (
          <div className="rounded-xl bg-emerald-100 px-4 py-3 font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorText ? (
          <div className="rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700">
            {errorText}
          </div>
        ) : null}

        {loading ? (
          <section className="rounded-3xl bg-white p-6 shadow-lg text-slate-500">
            내 부스를 불러오는 중...
          </section>
        ) : booth ? (
          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="mb-6 rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">로그인 업체</div>
              <div className="mt-1 text-xl font-black">
                {vendor?.company_name || "업체명 없음"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {vendor?.email || "-"}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                부스 ID: {booth.booth_id}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                    verified
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {verified ? "인증 완료 업체" : "미인증 / 수정 제한"}
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold">부스명</label>
                <input
                  value={booth.name || ""}
                  onChange={(e) =>
                    setBooth({ ...booth, name: e.target.value })
                  }
                  disabled={!verified}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">한줄 소개</label>
                <input
                  value={booth.intro || ""}
                  onChange={(e) =>
                    setBooth({ ...booth, intro: e.target.value })
                  }
                  disabled={!verified}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">상세 설명</label>
                <textarea
                  value={booth.description || ""}
                  onChange={(e) =>
                    setBooth({ ...booth, description: e.target.value })
                  }
                  disabled={!verified}
                  className="min-h-[140px] w-full rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">홈페이지 URL</label>
                  <input
                    value={booth.website_url || ""}
                    onChange={(e) =>
                      setBooth({ ...booth, website_url: e.target.value })
                    }
                    disabled={!verified}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">유튜브 URL</label>
                  <input
                    value={booth.youtube_url || ""}
                    onChange={(e) =>
                      setBooth({ ...booth, youtube_url: e.target.value })
                    }
                    disabled={!verified}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">대표 이미지 업로드</label>

                  {booth.hero_image_url ? (
                    <img
                      src={booth.hero_image_url}
                      alt="대표 이미지"
                      className="mb-3 h-40 w-full rounded-xl border object-cover"
                    />
                  ) : (
                    <div className="mb-3 flex h-40 items-center justify-center rounded-xl border bg-slate-50 text-sm text-slate-500">
                      대표 이미지 없음
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    disabled={!verified}
                    onChange={(e) =>
                      handleImageUpload(
                        "hero_image_url",
                        e.target.files?.[0] || null
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">로고 업로드</label>

                  {booth.logo_url ? (
                    <img
                      src={booth.logo_url}
                      alt="로고"
                      className="mb-3 h-40 w-full rounded-xl border bg-white object-contain"
                    />
                  ) : (
                    <div className="mb-3 flex h-40 items-center justify-center rounded-xl border bg-slate-50 text-sm text-slate-500">
                      로고 없음
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    disabled={!verified}
                    onChange={(e) =>
                      handleImageUpload(
                        "logo_url",
                        e.target.files?.[0] || null
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={saveBooth}
                  disabled={saving || !verified}
                  className="rounded-2xl bg-slate-950 px-6 py-4 text-lg font-black text-white disabled:opacity-60"
                >
                  {saving ? "저장 중..." : "내 부스 저장"}
                </button>

                <Link
                  href={`/expo/booths/${booth.booth_id}`}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-lg font-black text-slate-900"
                >
                  내 공개 부스 보기
                </Link>

                <Link
                  href="/vendor/dashboard"
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-lg font-black text-slate-900"
                >
                  대시보드로 이동
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-white p-6 shadow-lg text-slate-600">
            연결된 부스가 없습니다. 관리자에게 문의해 주세요.
          </section>
        )}
      </div>
    </main>
  );
}