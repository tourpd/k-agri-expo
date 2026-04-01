"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PhotoDoctorLeadButton from "@/components/PhotoDoctorLeadButton";

type BoothItem = {
  booth_id: string;
  vendor_id?: string | null;
  hall_id?: string | null;
  slot_code?: string | null;
  name: string;
  category_primary?: string | null;
  company_type?: string | null;
  is_featured?: boolean | null;
  score?: number;
};

type Props = {
  cropName?: string | null;
  issueType?: string | null;
  diagnosisId?: string | null;
  defaultFarmerName?: string;
  defaultFarmerPhone?: string;
};

export default function PhotoDoctorRecommendedBooths({
  cropName,
  issueType,
  diagnosisId,
  defaultFarmerName = "",
  defaultFarmerPhone = "",
}: Props) {
  const [items, setItems] = useState<BoothItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!cropName && !issueType) return;

      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/photodoctor/recommend-booths", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            crop_name: cropName || "",
            issue_type: issueType || "",
          }),
        });

        const json = await res.json();

        if (!res.ok || !json?.success) {
          throw new Error(json?.error || "추천 부스를 불러오지 못했습니다.");
        }

        setItems(json.items || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "추천 부스를 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [cropName, issueType]);

  if (!cropName && !issueType) return null;

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      
      {/* 상단 메시지 (행동 유도형으로 변경) */}
      <div className="text-sm font-black text-emerald-700">
        AI 추천
      </div>

      <h2 className="mt-2 text-2xl font-black text-slate-900">
        지금 바로 상담 가능한 전문가 부스
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {cropName ? `${cropName} 관련 문제 해결을 도와줄 부스를 추천합니다.` : ""}
      </p>

      {/* 로딩 */}
      {loading && (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          전문가 부스를 찾는 중입니다...
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 없음 */}
      {!loading && !error && items.length === 0 && (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          현재 연결 가능한 부스를 찾지 못했습니다.
        </div>
      )}

      {/* 리스트 */}
      {!loading && !error && items.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((booth) => (
            <div
              key={booth.booth_id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              {/* 상단 */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-slate-900">
                    {booth.name}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {booth.category_primary || ""}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {booth.is_featured && (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-800">
                      추천
                    </span>
                  )}

                  {booth.company_type === "premium" && (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800">
                      프리미엄
                    </span>
                  )}
                </div>
              </div>

              {/* 🔥 핵심: 추천 이유 */}
              <div className="mt-3 text-sm text-slate-600">
                ✔ 해당 작물 문제 상담 경험이 많은 업체입니다
              </div>

              {/* 버튼 */}
              <div className="mt-5 flex gap-2">
                <Link
                  href={`/expo/booths/${booth.booth_id}`}
                  className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-black text-slate-800"
                >
                  부스 보기
                </Link>
              </div>

              {/* 🔥 핵심 CTA */}
              <div className="mt-4">
                <PhotoDoctorLeadButton
                  boothId={booth.booth_id}
                  vendorId={booth.vendor_id}
                  hallId={booth.hall_id}
                  slotCode={booth.slot_code}
                  cropName={cropName || ""}
                  issueType={issueType || ""}
                  diagnosisId={diagnosisId || ""}
                  defaultFarmerName={defaultFarmerName}
                  defaultFarmerPhone={defaultFarmerPhone}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}