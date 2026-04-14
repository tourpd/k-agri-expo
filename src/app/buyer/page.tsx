"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type BuyerProfile = {
  user_id: string;
  name?: string | null;
  contact_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  email?: string | null;
  country?: string | null;
  preferred_language?: string | null;
  is_foreign?: boolean | null;
  buyer_level?: string | null;
  verification_status?: string | null;
};

type FavoriteRow = {
  id: string;
  booth_id: string;
  created_at?: string | null;
};

type BoothRow = {
  id: string;
  slug?: string | null;
  title?: string | null;
  name?: string | null;
  company_name?: string | null;
  category_primary?: string | null;
  hall_code?: string | null;
};

type LeadRow = {
  id: string;
  booth_id?: string | null;
  deal_id?: string | null;
  contact_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  source_type?: string | null;
  lead_score?: number | null;
  priority_rank?: number | null;
  status?: string | null;
  lead_stage?: string | null;
  quote_status?: string | null;
  created_at?: string | null;
};

type DemandResult = {
  ok: boolean;
  demand_id?: string;
  lead_id?: string;
  match_count?: number;
  top_matches?: Array<{
    vendor_id: string;
    booth_id?: string | null;
    match_score: number;
    reasoning?: string;
  }>;
  detection?: {
    quantity_detected: boolean;
    price_detected: boolean;
    hot_lead: boolean;
    summary: string;
    score: number;
  };
  admin_alert?: {
    ok: boolean;
    error?: string;
  } | null;
  error?: string;
};

const CATEGORY_OPTIONS = [
  { value: "fertilizer", label: "비료" },
  { value: "nutrition", label: "영양제" },
  { value: "pesticide", label: "농약/방제" },
  { value: "eco", label: "친환경 자재" },
  { value: "seed", label: "종자" },
  { value: "seedling", label: "묘/육묘" },
  { value: "machinery", label: "농기계" },
  { value: "smartfarm", label: "스마트팜" },
  { value: "facility", label: "시설자재" },
  { value: "packaging", label: "포장/유통" },
];

const CROP_OPTIONS = [
  { value: "garlic", label: "마늘" },
  { value: "onion", label: "양파" },
  { value: "pepper", label: "고추" },
  { value: "strawberry", label: "딸기" },
  { value: "rice", label: "벼" },
  { value: "fruit", label: "과수" },
  { value: "cabbage", label: "배추" },
  { value: "vegetable", label: "채소류" },
];

const SOURCING_OPTIONS = [
  { value: "sample", label: "샘플 요청" },
  { value: "bulk_purchase", label: "대량 구매" },
  { value: "distribution", label: "유통 파트너" },
  { value: "oem_odm", label: "OEM / ODM" },
  { value: "export_import", label: "수출입 상담" },
  { value: "solution", label: "기술/재배 솔루션" },
];

const CHANNEL_OPTIONS = [
  { value: "email", label: "이메일" },
  { value: "phone", label: "전화" },
  { value: "kakao", label: "카카오톡/메신저" },
  { value: "video", label: "화상 상담" },
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function statusLabel(value?: string | null) {
  if (value === "new") return "신규";
  if (value === "contacted") return "연락완료";
  if (value === "closed") return "종결";
  if (value === "screening") return "검토중";
  if (value === "qualified") return "유효리드";
  if (value === "sent") return "벤더전달";
  if (value === "negotiating") return "협상중";
  if (value === "won") return "성사";
  if (value === "lost") return "실패";
  return value || "-";
}

function statusClass(value?: string | null) {
  if (value === "new") return { background: "#fef3c7", color: "#92400e" };
  if (value === "contacted") return { background: "#dbeafe", color: "#1d4ed8" };
  if (value === "closed") return { background: "#d1fae5", color: "#065f46" };
  if (value === "screening") return { background: "#e0f2fe", color: "#0369a1" };
  if (value === "qualified") return { background: "#ede9fe", color: "#6d28d9" };
  if (value === "sent") return { background: "#dbeafe", color: "#1d4ed8" };
  if (value === "negotiating") return { background: "#fae8ff", color: "#a21caf" };
  if (value === "won") return { background: "#d1fae5", color: "#065f46" };
  if (value === "lost") return { background: "#fee2e2", color: "#b91c1c" };
  return { background: "#f3f4f6", color: "#374151" };
}

function boothDisplayName(booth?: BoothRow | null) {
  if (!booth) return "알 수 없는 부스";
  return booth.company_name || booth.title || booth.name || booth.id;
}

function quoteStatusLabel(value?: string | null) {
  switch (value) {
    case "draft":
      return "초안";
    case "drafting":
      return "작성중";
    case "sent":
      return "발송완료";
    case "won":
      return "견적성사";
    case "lost":
      return "견적실패";
    default:
      return value || "-";
  }
}

export default function BuyerPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [userId, setUserId] = useState<string>("");
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [favoriteBoothMap, setFavoriteBoothMap] = useState<Map<string, BoothRow>>(new Map());
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [leadBoothMap, setLeadBoothMap] = useState<Map<string, BoothRow>>(new Map());

  const [savingDemand, setSavingDemand] = useState(false);
  const [lastResult, setLastResult] = useState<DemandResult | null>(null);

  const [categoryKey, setCategoryKey] = useState("");
  const [cropKey, setCropKey] = useState("");
  const [sourcingType, setSourcingType] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [consultationChannel, setConsultationChannel] = useState("");
  const [demandNote, setDemandNote] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    setMsg("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      const user = session?.user;
      if (!user) {
        router.replace("/buyer/login");
        return;
      }

      setUserId(user.id);

      const { data: buyer, error: buyerError } = await supabase
        .from("buyer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (buyerError) {
        throw new Error(`바이어 프로필 조회 실패: ${buyerError.message}`);
      }

      setBuyerProfile((buyer as BuyerProfile | null) || null);

      const { data: favoriteRows, error: favoriteError } = await supabase
        .from("buyer_favorites")
        .select("id, booth_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (favoriteError) {
        throw new Error(`찜 목록 조회 실패: ${favoriteError.message}`);
      }

      const favoriteList = (favoriteRows || []) as FavoriteRow[];
      setFavorites(favoriteList);

      const favoriteBoothIds = Array.from(
        new Set(favoriteList.map((x) => x.booth_id).filter(Boolean))
      );

      if (favoriteBoothIds.length > 0) {
        const { data: booths, error: boothsError } = await supabase
          .from("booths")
          .select("id, slug, title, name, company_name, category_primary, hall_code")
          .in("id", favoriteBoothIds);

        if (boothsError) {
          throw new Error(`찜 부스 조회 실패: ${boothsError.message}`);
        }

        const nextMap = new Map<string, BoothRow>();
        ((booths || []) as BoothRow[]).forEach((booth) => {
          nextMap.set(booth.id, booth);
        });
        setFavoriteBoothMap(nextMap);
      } else {
        setFavoriteBoothMap(new Map());
      }

      const { data: leadRows, error: leadError } = await supabase
        .from("deal_leads")
        .select(
          "id, booth_id, deal_id, contact_name, company_name, phone, email, message, source_type, lead_score, priority_rank, status, lead_stage, quote_status, created_at"
        )
        .eq("buyer_user_id", user.id)
        .order("created_at", { ascending: false });

      if (leadError) {
        throw new Error(`문의 내역 조회 실패: ${leadError.message}`);
      }

      const leadList = (leadRows || []) as LeadRow[];
      setLeads(leadList);

      const leadBoothIds = Array.from(
        new Set(leadList.map((x) => x.booth_id).filter(Boolean) as string[])
      );

      if (leadBoothIds.length > 0) {
        const { data: booths, error: boothsError } = await supabase
          .from("booths")
          .select("id, slug, title, name, company_name, category_primary, hall_code")
          .in("id", leadBoothIds);

        if (boothsError) {
          throw new Error(`문의 부스 조회 실패: ${boothsError.message}`);
        }

        const nextMap = new Map<string, BoothRow>();
        ((booths || []) as BoothRow[]).forEach((booth) => {
          nextMap.set(booth.id, booth);
        });
        setLeadBoothMap(nextMap);
      } else {
        setLeadBoothMap(new Map());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "대시보드 로딩 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function submitDemand() {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    if (!categoryKey && !cropKey && !demandNote.trim()) {
      setError("카테고리, 작물, 요청사항 중 하나 이상 입력해 주세요.");
      return;
    }

    setSavingDemand(true);
    setMsg("");
    setError("");
    setLastResult(null);

    try {
      const res = await fetch("/api/buyer/demand/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buyer_user_id: userId,
          category_key: categoryKey,
          crop_key: cropKey,
          sourcing_type: sourcingType,
          target_quantity: targetQuantity,
          consultation_channel: consultationChannel,
          demand_note: demandNote.trim(),
        }),
      });

      const json: DemandResult = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "수요 등록 실패");
      }

      setLastResult(json);

      const hotLeadText = json.detection?.hot_lead
        ? " · HOT 리드 감지"
        : "";

      setMsg(
        `수요 등록 완료 · 리드 생성 완료 · 추천 업체 ${json.match_count || 0}개${hotLeadText}`
      );

      setCategoryKey("");
      setCropKey("");
      setSourcingType("");
      setTargetQuantity("");
      setConsultationChannel("");
      setDemandNote("");

      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "수요 등록 실패");
    } finally {
      setSavingDemand(false);
    }
  }

  if (loading) {
    return (
      <main style={S.page}>
        <div style={S.wrap}>
          <section style={S.heroCard}>불러오는 중...</section>
        </div>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        {(msg || error) && (
          <section style={S.sectionCard}>
            {msg ? <div style={S.successBox}>{msg}</div> : null}
            {error ? <div style={S.errorBox}>{error}</div> : null}
          </section>
        )}

        <section style={S.heroCard}>
          <div style={S.kicker}>BUYER DASHBOARD</div>
          <h1 style={S.title}>바이어 대시보드</h1>

          {!buyerProfile ? (
            <div style={S.warn}>
              바이어 정보가 없습니다. 먼저 회원가입을 완료해 주세요.
              <div style={S.subNote}>현재 로그인 user_id: {userId || "-"}</div>
            </div>
          ) : (
            <>
              <div style={S.infoBox}>
                <div>
                  <b>담당자명:</b>{" "}
                  {buyerProfile.contact_name || buyerProfile.name || "-"}
                </div>
                <div>
                  <b>회사명:</b> {buyerProfile.company_name || "-"}
                </div>
                <div>
                  <b>연락처:</b> {buyerProfile.phone || "-"}
                </div>
                <div>
                  <b>이메일:</b> {buyerProfile.email || "-"}
                </div>
                <div>
                  <b>국가:</b> {buyerProfile.country || "-"}
                </div>
                <div>
                  <b>언어:</b> {buyerProfile.preferred_language || "-"}
                </div>
              </div>

              <div style={S.badgeRow}>
                <span style={S.grayPill}>
                  바이어 등급: {buyerProfile.buyer_level || "guest"}
                </span>
                <span style={S.grayPill}>
                  검증상태: {buyerProfile.verification_status || "none"}
                </span>
                <span style={S.grayPill}>
                  구분: {buyerProfile.is_foreign ? "해외 바이어" : "국내 바이어"}
                </span>
              </div>
            </>
          )}

          <div style={S.topActions}>
            <Link href="/expo" style={S.primaryAction}>
              엑스포 둘러보기
            </Link>
            <Link href="/buyer/login" style={S.secondaryAction}>
              계정 다시 확인
            </Link>
          </div>
        </section>

        <section style={S.sectionCard}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.sectionTitle}>구매 수요 등록</div>
              <div style={S.sectionDesc}>
                필요한 품목과 조건을 입력하면 운영팀 CRM에 자동 등록되고, 적합 업체가 추천됩니다.
              </div>
            </div>
          </div>

          <div style={S.formGrid}>
            <div>
              <div style={S.formLabel}>관심 카테고리</div>
              <select
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value)}
                style={S.input}
              >
                <option value="">선택하세요</option>
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={S.formLabel}>관심 작물</div>
              <select
                value={cropKey}
                onChange={(e) => setCropKey(e.target.value)}
                style={S.input}
              >
                <option value="">선택하세요</option>
                {CROP_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={S.formLabel}>요청 유형</div>
              <select
                value={sourcingType}
                onChange={(e) => setSourcingType(e.target.value)}
                style={S.input}
              >
                <option value="">선택하세요</option>
                {SOURCING_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={S.formLabel}>희망 물량</div>
              <input
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(e.target.value)}
                style={S.input}
                placeholder="예: 500kg / 월 2톤 / 1 container"
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={S.formLabel}>상담 희망 방식</div>
            <div style={S.channelRow}>
              {CHANNEL_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setConsultationChannel(item.value)}
                  style={{
                    ...S.channelButton,
                    ...(consultationChannel === item.value
                      ? S.channelButtonActive
                      : {}),
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={S.formLabel}>요청사항</div>
            <textarea
              value={demandNote}
              onChange={(e) => setDemandNote(e.target.value)}
              rows={6}
              style={S.textarea}
              placeholder="예: 마늘 비대용 영양제를 찾고 있습니다. 월 2톤 정도 가능 여부와 FOB 가격을 알고 싶습니다."
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={submitDemand}
              disabled={savingDemand}
              style={S.primaryAction}
            >
              {savingDemand ? "등록 중..." : "수요 등록하고 업체 추천 받기"}
            </button>
          </div>
        </section>

        <section style={S.sectionCard}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.sectionTitle}>최근 자동 추천 결과</div>
              <div style={S.sectionDesc}>
                마지막으로 등록한 수요에 대해 자동 추천된 업체 결과입니다.
              </div>
            </div>
            <div style={S.countBadge}>{lastResult?.match_count || 0}개</div>
          </div>

          {lastResult?.detection ? (
            <div style={S.analysisBox}>
              <div style={S.analysisTitle}>문의 자동 분석 결과</div>
              <div style={S.analysisGrid}>
                <div>
                  <b>분석 요약:</b> {lastResult.detection.summary}
                </div>
                <div>
                  <b>점수:</b> {lastResult.detection.score}
                </div>
                <div>
                  <b>수량 감지:</b>{" "}
                  {lastResult.detection.quantity_detected ? "예" : "아니오"}
                </div>
                <div>
                  <b>가격 감지:</b>{" "}
                  {lastResult.detection.price_detected ? "예" : "아니오"}
                </div>
                <div>
                  <b>HOT 리드:</b>{" "}
                  {lastResult.detection.hot_lead ? "예" : "아니오"}
                </div>
                <div>
                  <b>관리자 알림:</b>{" "}
                  {lastResult.admin_alert?.ok
                    ? "발송됨"
                    : lastResult.detection.hot_lead
                    ? "미발송 또는 실패"
                    : "일반 리드"}
                </div>
              </div>
            </div>
          ) : null}

          {!lastResult?.top_matches || lastResult.top_matches.length === 0 ? (
            <div style={S.emptyBox}>
              아직 추천 결과가 없습니다. 구매 수요를 등록하면 자동 추천 결과가 표시됩니다.
            </div>
          ) : (
            <div style={S.list}>
              {lastResult.top_matches.map((item, idx) => (
                <div key={`${item.vendor_id}-${idx}`} style={S.leadCard}>
                  <div style={S.leadHead}>
                    <div>
                      <div style={S.leadTitle}>추천 업체 {idx + 1}</div>
                      <div style={S.leadSub}>업체 ID: {item.vendor_id}</div>
                    </div>
                    <div style={{ ...S.statusPill, ...S.statusBlue }}>
                      점수 {item.match_score}
                    </div>
                  </div>

                  <div style={S.leadInfo}>
                    <div>부스 ID: {item.booth_id || "-"}</div>
                    <div>추천 이유: {item.reasoning || "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={S.sectionCard}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.sectionTitle}>찜한 부스</div>
              <div style={S.sectionDesc}>
                관심 있는 업체를 저장해두고 나중에 다시 볼 수 있습니다.
              </div>
            </div>
            <div style={S.countBadge}>{favorites.length}개</div>
          </div>

          {favorites.length === 0 ? (
            <div style={S.emptyBox}>
              아직 찜한 부스가 없습니다. 엑스포에서 마음에 드는 부스를 저장해보세요.
            </div>
          ) : (
            <div style={S.grid}>
              {favorites.map((fav) => {
                const booth = favoriteBoothMap.get(fav.booth_id);

                return (
                  <div key={fav.id} style={S.itemCard}>
                    <div style={S.itemTop}>
                      <div style={S.itemTitle}>{boothDisplayName(booth)}</div>
                      <div style={S.metaBadge}>찜</div>
                    </div>

                    <div style={S.itemMeta}>
                      <div>카테고리: {booth?.category_primary || "-"}</div>
                      <div>관: {booth?.hall_code || "-"}</div>
                      <div>저장일: {formatDate(fav.created_at)}</div>
                    </div>

                    {booth?.slug ? (
                      <Link
                        href={`/expo/booth/${booth.slug}`}
                        style={S.inlineAction}
                      >
                        부스 보러가기 →
                      </Link>
                    ) : (
                      <div style={S.inlineActionDisabled}>부스 링크 없음</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={S.sectionCard}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.sectionTitle}>내 문의 / 리드 내역</div>
              <div style={S.sectionDesc}>
                부스 상담 요청, 바이어 수요 등록, 특가 문의 등 내 리드 내역을 확인합니다.
              </div>
            </div>
            <div style={S.countBadge}>{leads.length}건</div>
          </div>

          {leads.length === 0 ? (
            <div style={S.emptyBox}>
              아직 보낸 문의가 없습니다. 부스 상세에서 상담 요청을 보내거나 구매 수요를 등록해보세요.
            </div>
          ) : (
            <div style={S.list}>
              {leads.map((lead) => {
                const booth = lead.booth_id
                  ? leadBoothMap.get(lead.booth_id)
                  : null;

                return (
                  <div key={lead.id} style={S.leadCard}>
                    <div style={S.leadHead}>
                      <div>
                        <div style={S.leadTitle}>
                          {boothDisplayName(booth) || lead.company_name || "문의"}
                        </div>
                        <div style={S.leadSub}>
                          접수일: {formatDate(lead.created_at)}
                        </div>
                      </div>

                      <div
                        style={{
                          ...S.statusPill,
                          ...statusClass(lead.lead_stage || lead.status),
                        }}
                      >
                        {statusLabel(lead.lead_stage || lead.status)}
                      </div>
                    </div>

                    <div style={S.leadInfo}>
                      <div>유입경로: {lead.source_type || "-"}</div>
                      <div>담당자명: {lead.contact_name || "-"}</div>
                      <div>연락처: {lead.phone || "-"}</div>
                      <div>이메일: {lead.email || "-"}</div>
                      <div>리드점수: {lead.lead_score ?? 0}</div>
                      <div>우선순위: {lead.priority_rank ?? 0}</div>
                      <div>견적상태: {quoteStatusLabel(lead.quote_status)}</div>
                    </div>

                    <div style={S.messageBox}>
                      {lead.message || "문의 내용이 없습니다."}
                    </div>

                    {booth?.slug ? (
                      <Link
                        href={`/expo/booth/${booth.slug}`}
                        style={S.inlineAction}
                      >
                        해당 부스 다시 보기 →
                      </Link>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #fffbeb 0%, #ffffff 100%)",
    padding: 24,
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gap: 20,
  },
  heroCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
  },
  sectionCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#d97706",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#111827",
  },
  infoBox: {
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    lineHeight: 2,
    color: "#111827",
  },
  analysisBox: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#7c2d12",
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 10,
  },
  analysisGrid: {
    display: "grid",
    gap: 8,
    lineHeight: 1.8,
    fontSize: 14,
  },
  warn: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    color: "#9a3412",
    lineHeight: 1.8,
    fontWeight: 800,
  },
  subNote: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#7c2d12",
    wordBreak: "break-all",
  },
  badgeRow: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  grayPill: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#f3f4f6",
    color: "#111827",
    fontWeight: 800,
    fontSize: 13,
  },
  topActions: {
    marginTop: 18,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryAction: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 16px",
    borderRadius: 14,
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 800,
    border: "1px solid #111827",
    cursor: "pointer",
  },
  secondaryAction: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 16px",
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 800,
  },
  successBox: {
    padding: 16,
    borderRadius: 16,
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#065f46",
    lineHeight: 1.8,
    fontWeight: 700,
  },
  errorBox: {
    padding: 16,
    borderRadius: 16,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    lineHeight: 1.8,
    fontWeight: 700,
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 900,
    color: "#111827",
  },
  sectionDesc: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
  },
  countBadge: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#f3f4f6",
    color: "#111827",
    fontWeight: 800,
    fontSize: 13,
  },
  formGrid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
  },
  formLabel: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 900,
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
  textarea: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 15,
    background: "#fff",
    lineHeight: 1.7,
    resize: "vertical",
  },
  channelRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  channelButton: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontWeight: 800,
    cursor: "pointer",
  },
  channelButtonActive: {
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
  },
  emptyBox: {
    marginTop: 18,
    padding: 18,
    borderRadius: 16,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#64748b",
    lineHeight: 1.8,
  },
  grid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },
  itemCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
    background: "#ffffff",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
  },
  metaBadge: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#ffe4e6",
    color: "#be123c",
    fontWeight: 800,
    fontSize: 12,
  },
  itemMeta: {
    marginTop: 12,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 1.8,
  },
  inlineAction: {
    marginTop: 14,
    display: "inline-flex",
    color: "#111827",
    fontWeight: 800,
    textDecoration: "none",
  },
  inlineActionDisabled: {
    marginTop: 14,
    display: "inline-flex",
    color: "#9ca3af",
    fontWeight: 800,
  },
  list: {
    marginTop: 18,
    display: "grid",
    gap: 16,
  },
  leadCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
    background: "#ffffff",
  },
  leadHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  leadTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
  },
  leadSub: {
    marginTop: 6,
    fontSize: 13,
    color: "#6b7280",
  },
  statusPill: {
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
  },
  statusBlue: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  leadInfo: {
    marginTop: 14,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 1.8,
  },
  messageBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#111827",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
  },
};