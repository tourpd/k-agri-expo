import React from "react";
import Link from "next/link";
import BoothVisitTracker from "@/components/expo/BoothVisitTracker";
import LeadCaptureTracker from "@/components/expo/LeadCaptureTracker";
import BoothInquiryForm from "@/components/expo/BoothInquiryForm";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RecentInquiry = {
  inquiry_id: string;
  farmer_name: string | null;
  phone: string | null;
  message: string | null;
  created_at: string | null;
};

type AdminBoothOps = {
  inquiryCount: number;
  leadCount: number;
  recentInquiries: RecentInquiry[];
};

type BoothRow = {
  booth_id?: string | null;
  vendor_id?: string | null;
  vendor_user_id?: string | null;

  name?: string | null;
  title?: string | null;
  intro?: string | null;
  description?: string | null;

  region?: string | null;
  category_primary?: string | null;
  category_secondary?: string | null;

  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;

  hall_id?: string | null;
  hall_code?: string | null;
  assigned_hall?: string | null;

  slot_code?: string | null;
  assigned_slot_code?: string | null;

  logo_url?: string | null;
  thumbnail_url?: string | null;
  cover_image_url?: string | null;
  banner_url?: string | null;

  youtube_url?: string | null;
  video_url?: string | null;
  youtube_link?: string | null;

  website_url?: string | null;
  kakao_url?: string | null;
  open_kakao_url?: string | null;

  booth_type?: string | null;
  plan_type?: string | null;

  consult_enabled?: boolean | null;
  kakao_enabled?: boolean | null;
  phone_bridge_enabled?: boolean | null;

  status?: string | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
  is_published?: boolean | null;
};

type SlotRow = {
  hall_id?: string | null;
  slot_id?: string | null;
  booth_id?: string | null;
};

type ProductRow = {
  id?: string | number | null;
  product_id?: string | number | null;
  booth_id?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  price_krw?: number | null;
  sale_price_krw?: number | null;
  is_active?: boolean | null;
  status?: string | null;
};

type DealRow = {
  id?: string | number | null;
  deal_id?: string | number | null;
  booth_id?: string | null;
  title?: string | null;
  description?: string | null;
  expo_price_text?: string | null;
  stock_text?: string | null;
  deadline_at?: string | null;
  price_original_krw?: number | null;
  price_sale_krw?: number | null;
  image_url?: string | null;
  is_active?: boolean | null;
  status?: string | null;
};

function isUuid(v: string) {
  return /^[0-9a-f-]{36}$/i.test(v);
}

function safe(v: unknown, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}

function boolLabel(v: unknown) {
  return v ? "예" : "아니오";
}

function fmtDeadline(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;

  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")} 마감`;
}

function fmtDateTime(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR");
}

function shortText(v: string | null | undefined, max = 72) {
  const s = safe(v, "");
  if (!s) return "내용 없음";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function toYoutubeEmbedUrl(url?: string | null) {
  const value = safe(url, "");
  if (!value) return "";

  if (value.includes("/embed/")) return value;

  const watchMatch = value.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return "";
}

function resolveBoothName(booth: BoothRow) {
  return safe(booth.name ?? booth.title, "부스");
}

function resolveBoothId(booth: BoothRow) {
  return safe(booth.booth_id, "");
}

function resolveVendorUserId(booth: BoothRow) {
  return safe(booth.vendor_user_id ?? booth.vendor_id, "");
}

function normalizeHallId(v?: string | null) {
  const hall = safe(v, "");
  if (!hall) return "";

  if (hall === "agri_inputs") return "agri-inputs";
  if (hall === "smart_farm") return "smartfarm";
  if (hall === "eco_friendly") return "eco-friendly";
  if (hall === "future_insect") return "future-insect";

  return hall;
}

function normalizeHallLabel(hallId?: string | null) {
  const hall = normalizeHallId(hallId);
  if (!hall) return "-";

  if (hall === "agri-inputs") return "농자재관";
  if (hall === "machines" || hall === "agri-machinery") return "농기계관";
  if (hall === "seeds") return "종자관";
  if (hall === "smartfarm") return "스마트팜관";
  if (hall === "eco-friendly" || hall === "eco") return "친환경관";
  if (hall === "future-insect" || hall === "future-food") return "미래식량관";

  return hall;
}

function normalizeSlotCode(v?: string | null) {
  const slot = safe(v, "");
  if (!slot) return "-";

  const raw = slot.toUpperCase().replace(/\s+/g, "");
  const m = raw.match(/^([A-Z])[-_]?0*([0-9]+)$/);
  if (!m) return raw;

  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

function resolveImageUrl(booth: BoothRow) {
  return (
    booth.banner_url ??
    booth.cover_image_url ??
    booth.thumbnail_url ??
    booth.logo_url ??
    ""
  );
}

function resolvePriceText(deal: DealRow) {
  if (safe(deal.expo_price_text, "")) return safe(deal.expo_price_text, "");
  if (typeof deal.price_sale_krw === "number") {
    return `${deal.price_sale_krw.toLocaleString("ko-KR")}원`;
  }
  return "특가";
}

function boothTypeLabel(v?: string | null) {
  const value = safe(v, "").toLowerCase();
  if (value === "brand") return "브랜드형";
  if (value === "promo") return "특가형";
  return "대표상품형";
}

function boothPlanLabel(v?: string | null) {
  const value = safe(v, "").toLowerCase();
  if (value === "premium") return "고급 부스";
  if (value === "general" || value === "basic") return "일반 부스";
  return "무료 부스";
}

async function loadAdminBoothOps(boothId: string, isAdmin: boolean): Promise<AdminBoothOps> {
  if (!isAdmin || !boothId) {
    return {
      inquiryCount: 0,
      leadCount: 0,
      recentInquiries: [],
    };
  }

  try {
    const supabase = createSupabaseAdminClient();

    let inquiryCount = 0;
    let recentInquiries: RecentInquiry[] = [];

    try {
      const [{ count }, recent] = await Promise.all([
        supabase
          .from("expo_inquiries")
          .select("*", { count: "exact", head: true })
          .eq("booth_id", boothId),
        supabase
          .from("expo_inquiries")
          .select("inquiry_id,farmer_name,phone,message,created_at")
          .eq("booth_id", boothId)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      inquiryCount = count ?? 0;

      if (!recent.error) {
        recentInquiries = (recent.data ?? []) as RecentInquiry[];
      } else {
        console.error("[admin-booth-ops] recent inquiries error:", recent.error);
      }
    } catch (e) {
      console.error("[admin-booth-ops] expo_inquiries error:", e);
    }

    let leadCount = 0;
    try {
      const { count, error } = await supabase
        .from("booth_leads")
        .select("*", { count: "exact", head: true })
        .eq("booth_id", boothId);

      if (error) {
        console.error("[admin-booth-ops] booth_leads count error:", error);
      } else {
        leadCount = count ?? 0;
      }
    } catch (e) {
      console.error("[admin-booth-ops] booth_leads error:", e);
    }

    return {
      inquiryCount,
      leadCount,
      recentInquiries,
    };
  } catch (e) {
    console.error("[admin-booth-ops] createSupabaseAdminClient error:", e);
    return {
      inquiryCount: 0,
      leadCount: 0,
      recentInquiries: [],
    };
  }
}

async function loadSlotInfo(boothId: string) {
  if (!boothId) return null;

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("hall_booth_slots")
      .select("hall_id, slot_id, booth_id")
      .eq("booth_id", boothId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[booth-detail] hall_booth_slots error:", error);
      return null;
    }

    return (data ?? null) as SlotRow | null;
  } catch (e) {
    console.error("[booth-detail] hall_booth_slots fetch error:", e);
    return null;
  }
}

async function loadBoothByAnyId(rawId: string): Promise<BoothRow | null> {
  if (!rawId) return null;

  const supabase = createSupabaseAdminClient();

  try {
    const result = await supabase
      .from("booths")
      .select("*")
      .eq("booth_id", rawId)
      .maybeSingle();

    if (!result.error && result.data) {
      return result.data as BoothRow;
    }
  } catch (e) {
    console.error("[booth-detail] booth_id query exception:", e);
  }

  if (!isUuid(rawId)) {
    return null;
  }

  try {
    const result = await supabase
      .from("booths")
      .select("*")
      .eq("vendor_id", rawId)
      .limit(1)
      .maybeSingle();

    if (!result.error && result.data) {
      return result.data as BoothRow;
    }
  } catch (e) {
    console.error("[booth-detail] vendor_id query exception:", e);
  }

  try {
    const result = await supabase
      .from("booths")
      .select("*")
      .eq("vendor_user_id", rawId)
      .limit(1)
      .maybeSingle();

    if (!result.error && result.data) {
      return result.data as BoothRow;
    }
  } catch (e) {
    console.error("[booth-detail] vendor_user_id query exception:", e);
  }

  return null;
}

export default async function ExpoBoothDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rawId = decodeURIComponent(id ?? "").trim();

  if (!rawId) {
    return (
      <main style={pageWrap}>
        <h1 style={titleStyle}>잘못된 부스 주소입니다.</h1>
        <Link href="/expo" style={btnGhost}>
          엑스포 홈
        </Link>
      </main>
    );
  }

  const isAdmin = await isAdminAuthenticated();
  const booth = await loadBoothByAnyId(rawId);

  if (!booth) {
    return (
      <main style={pageWrap}>
        <h1 style={titleStyle}>부스를 찾을 수 없습니다.</h1>
        <div style={meta}>입력값: {rawId}</div>
        <div style={{ marginTop: 16 }}>
          <Link href="/expo" style={btnGhost}>
            엑스포 홈
          </Link>
        </div>
      </main>
    );
  }

  const resolvedBoothId = resolveBoothId(booth);
  const slotRow = await loadSlotInfo(resolvedBoothId);
  const supabase = createSupabaseAdminClient();

  const hallId =
    normalizeHallId(slotRow?.hall_id) ||
    normalizeHallId(booth.hall_id) ||
    normalizeHallId(booth.hall_code) ||
    normalizeHallId(booth.assigned_hall) ||
    "";

  const normalizedSlotCodeFromSlot = normalizeSlotCode(slotRow?.slot_id);
  const normalizedSlotCodeFromBooth =
    normalizeSlotCode(booth.slot_code) || normalizeSlotCode(booth.assigned_slot_code);

  const slotCode =
    normalizedSlotCodeFromSlot !== "-"
      ? normalizedSlotCodeFromSlot
      : normalizedSlotCodeFromBooth !== "-"
      ? normalizedSlotCodeFromBooth
      : "-";

  let products: ProductRow[] = [];

  try {
    const { data, error } = await supabase
      .from("expo_products")
      .select("*")
      .eq("booth_id", resolvedBoothId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[booth-detail] expo_products error:", error);

      const fallback = await supabase
        .from("products")
        .select("*")
        .eq("booth_id", resolvedBoothId)
        .order("created_at", { ascending: false });

      if (fallback.error) {
        console.error("[booth-detail] products fallback error:", fallback.error);
      } else {
        products = ((fallback.data ?? []) as ProductRow[]).filter(
          (p) => p.is_active == null || p.is_active === true
        );
      }
    } else {
      products = ((data ?? []) as ProductRow[]).filter(
        (p) => p.is_active == null || p.is_active === true
      );
    }
  } catch (e) {
    console.error("[booth-detail] products fetch error:", e);
  }

  let deals: DealRow[] = [];

  try {
    const { data, error } = await supabase
      .from("expo_deals")
      .select("*")
      .eq("booth_id", resolvedBoothId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[booth-detail] expo_deals error:", error);

      const fallback = await supabase
        .from("booth_deals")
        .select("*")
        .eq("booth_id", resolvedBoothId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (fallback.error) {
        console.error("[booth-detail] booth_deals fallback error:", fallback.error);
      } else {
        deals = ((fallback.data ?? []) as DealRow[]).filter(
          (d) => d.is_active == null || d.is_active === true
        );
      }
    } else {
      deals = ((data ?? []) as DealRow[]).filter(
        (d) => d.is_active == null || d.is_active === true
      );
    }
  } catch (e) {
    console.error("[booth-detail] deals fetch error:", e);
  }

  const adminOps = await loadAdminBoothOps(resolvedBoothId, isAdmin);

  const description = booth.description;
  const youtubeUrl =
    booth.youtube_url ??
    booth.video_url ??
    booth.youtube_link ??
    null;

  const embedUrl = toYoutubeEmbedUrl(youtubeUrl);
  const heroImageUrl = resolveImageUrl(booth);

  const publicKakaoUrl =
    booth.kakao_enabled !== false
      ? safe(booth.kakao_url ?? booth.open_kakao_url, "")
      : "";

  const adminBoothManageHref = `/admin/booths?q=${encodeURIComponent(resolvedBoothId)}`;
  const adminInquiryHref = `/vendor/inquiries?booth_id=${encodeURIComponent(resolvedBoothId)}`;
  const adminLeadsHref = `/admin/leads`;
  const adminBoothEditHref = `/expo/vendor/booth-editor?booth_id=${encodeURIComponent(
    resolvedBoothId
  )}`;

  return (
    <main style={pageWrap}>
      <BoothVisitTracker boothId={resolvedBoothId} />
      <LeadCaptureTracker boothId={resolvedBoothId} landingType="booth" />

      {isAdmin ? (
        <section style={adminBar}>
          <div style={adminTopRow}>
            <div>
              <div style={adminEyebrow}>ADMIN MODE</div>
              <div style={adminTitle}>운영자 부스 검수/운영 바</div>
              <div style={adminDesc}>
                이 화면은 고객이 보는 공개 부스 페이지입니다. 여기서 검수하고, 아래 버튼으로
                문의/리드/편집/부스관리로 즉시 이동합니다.
              </div>
            </div>

            <div style={adminBtnWrap}>
              <Link href={adminBoothManageHref} style={adminPrimaryBtn}>
                관리자 부스관리
              </Link>

              <Link href={adminBoothEditHref} style={adminGhostBtn}>
                부스 편집
              </Link>

              <Link href={adminInquiryHref} style={adminGhostBtn}>
                문의 보기
              </Link>

              <Link href={adminLeadsHref} style={adminGhostBtn}>
                리드 보기
              </Link>

              <Link href="/expo/admin" style={adminGhostBtn}>
                엑스포 관리자
              </Link>
            </div>
          </div>

          <div style={adminMetaGrid}>
            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>booth_id</div>
              <div style={adminMetaValueMono}>{resolvedBoothId}</div>
            </div>

            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>부스 상태</div>
              <div style={adminMetaValue}>{safe(booth.status, "미설정")}</div>
            </div>

            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>부스 타입</div>
              <div style={adminMetaValue}>{boothTypeLabel(booth.booth_type)}</div>
            </div>

            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>부스 등급</div>
              <div style={adminMetaValue}>{boothPlanLabel(booth.plan_type)}</div>
            </div>

            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>대표명</div>
              <div style={adminMetaValue}>{safe(booth.contact_name, "미입력")}</div>
            </div>

            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>전시장</div>
              <div style={adminMetaValue}>{normalizeHallLabel(hallId)}</div>
            </div>

            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>슬롯</div>
              <div style={adminMetaValue}>{slotCode}</div>
            </div>

            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>전화 등록</div>
              <div style={adminMetaValue}>{boolLabel(!!safe(booth.phone, ""))}</div>
            </div>

            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>이메일 등록</div>
              <div style={adminMetaValue}>{boolLabel(!!safe(booth.email, ""))}</div>
            </div>

            <div style={adminMetaCardStrong}>
              <div style={adminMetaLabel}>문의 수</div>
              <div style={adminMetaValueBig}>{adminOps.inquiryCount}건</div>
            </div>

            <div style={adminMetaCardStrong}>
              <div style={adminMetaLabel}>리드 수</div>
              <div style={adminMetaValueBig}>{adminOps.leadCount}건</div>
            </div>
          </div>

          <div style={adminQuickGrid}>
            <div style={adminQuickCard}>
              <div style={adminQuickTitle}>운영 체크</div>
              <div style={adminQuickText}>
                공개 문구, 특가, 제품, 상담 전환 흐름을 실제 사용자 시점으로 검수합니다.
              </div>
            </div>

            <div style={adminQuickCard}>
              <div style={adminQuickTitle}>문의 관리</div>
              <div style={adminQuickText}>
                고객 문의는 <b>문의 보기</b>에서 상태 변경, 응대 완료, 메모 관리로 이어집니다.
              </div>
            </div>

            <div style={adminQuickCard}>
              <div style={adminQuickTitle}>리드 관리</div>
              <div style={adminQuickText}>
                리드는 <b>리드 보기</b>에서 확인하고 상담 → 견적 → 거래 → 수수료까지 관리합니다.
              </div>
            </div>
          </div>

          <div style={recentWrap}>
            <div style={recentHeaderRow}>
              <div style={recentTitle}>최근 문의 3건</div>
              <Link href={adminInquiryHref} style={miniLinkBtn}>
                전체 문의 보기
              </Link>
            </div>

            {adminOps.recentInquiries.length === 0 ? (
              <div style={recentEmpty}>아직 접수된 문의가 없습니다.</div>
            ) : (
              <div style={recentGrid}>
                {adminOps.recentInquiries.map((item) => (
                  <div key={String(item.inquiry_id)} style={recentCard}>
                    <div style={recentMeta}>
                      <span style={recentName}>{safe(item.farmer_name, "이름 없음")}</span>
                      <span>{safe(item.phone, "연락처 없음")}</span>
                    </div>
                    <div style={recentBody}>{shortText(item.message, 90)}</div>
                    <div style={recentTime}>{fmtDateTime(item.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={adminNote}>
            운영 팁: 공개 화면에서는 직접 연락처 노출보다 문의 브릿지 구조를 유지하는 것이 데이터 축적과 운영 통제에 유리합니다.
          </div>
        </section>
      ) : null}

      <header style={header}>
        <div>
          <div style={boothBadge}>EXPO BOOTH</div>
          <h1 style={titleStyle}>{resolveBoothName(booth)}</h1>
          <div style={meta}>
            {normalizeHallLabel(hallId)} · {slotCode} · {safe(booth.category_primary, "카테고리")}
          </div>
          <div style={metaPillsRow}>
            <span style={metaPill}>{boothTypeLabel(booth.booth_type)}</span>
            <span style={metaPill}>{boothPlanLabel(booth.plan_type)}</span>
          </div>
        </div>

        <div style={headerActions}>
          {hallId ? (
            <Link href={`/expo/hall/${hallId}`} style={btnGhost}>
              전시장으로
            </Link>
          ) : (
            <Link href="/expo" style={btnGhost}>
              엑스포 홈
            </Link>
          )}
        </div>
      </header>

      {heroImageUrl ? (
        <section style={heroImageSection}>
          <img
            src={heroImageUrl}
            alt={resolveBoothName(booth)}
            style={heroImage}
          />
        </section>
      ) : null}

      {embedUrl ? (
        <section style={videoSection}>
          <div style={sectionHeadRow}>
            <div>
              <div style={sectionEyebrow}>FEATURED VIDEO</div>
              <h2 style={sectionMainTitle}>제품 소개 영상</h2>
            </div>
          </div>

          <div style={videoFrameWrap}>
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title={`${resolveBoothName(booth)} 영상`}
              style={videoFrame}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}

      <section style={ctaWrap}>
        <div style={ctaBox}>
          <div style={ctaTop}>
            <div>
              <div style={ctaEyebrow}>QUICK ACTION</div>
              <div style={ctaTitle}>상담과 제품 확인을 한 번에 진행하세요</div>
              <div style={ctaDesc}>
                공개 부스에서는 직접 전화번호를 노출하지 않고, 문의 접수 후 업체가 확인해 연결하는 브릿지 방식을 기본으로 사용합니다.
              </div>
            </div>

            <div style={ctaButtons}>
              <a href="#inquiry-request" style={ctaPrimary}>
                ✍ 문의 남기기
              </a>

              {publicKakaoUrl ? (
                <a
                  href={publicKakaoUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={ctaSecondary}
                >
                  카카오 상담
                </a>
              ) : null}

              {booth.website_url ? (
                <a
                  href={booth.website_url}
                  target="_blank"
                  rel="noreferrer"
                  style={ctaGhost}
                >
                  홈페이지
                </a>
              ) : null}

              {booth.phone_bridge_enabled !== false ? (
                <a href="#inquiry-request" style={ctaGhost}>
                  전화 연결 요청
                </a>
              ) : null}
            </div>
          </div>

          <div style={ctaMetaGrid}>
            <div style={ctaMetaCard}>
              <div style={ctaMetaLabel}>대표명</div>
              <div style={ctaMetaValue}>{safe(booth.contact_name, "미입력")}</div>
            </div>

            <div style={ctaMetaCard}>
              <div style={ctaMetaLabel}>전시장</div>
              <div style={ctaMetaValue}>{normalizeHallLabel(hallId)}</div>
            </div>

            <div style={ctaMetaCard}>
              <div style={ctaMetaLabel}>부스 위치</div>
              <div style={ctaMetaValue}>{slotCode}</div>
            </div>

            <div style={ctaMetaCard}>
              <div style={ctaMetaLabel}>부스 타입</div>
              <div style={ctaMetaValue}>{boothTypeLabel(booth.booth_type)}</div>
            </div>

            <div style={ctaMetaCard}>
              <div style={ctaMetaLabel}>부스 등급</div>
              <div style={ctaMetaValue}>{boothPlanLabel(booth.plan_type)}</div>
            </div>
          </div>
        </div>
      </section>

      {deals.length > 0 && (
        <section style={{ marginTop: 30 }}>
          <div style={sectionHeadRow}>
            <div>
              <div style={sectionEyebrow}>EXPO DEALS</div>
              <h2 style={sectionMainTitle}>🔥 EXPO 특가</h2>
            </div>
          </div>

          <div style={productGrid}>
            {deals.map((d, idx) => (
              <Link
                key={String(d.deal_id ?? d.id ?? idx)}
                href={d.deal_id ? `/expo/deals/${d.deal_id}` : "#"}
                style={dealCard}
              >
                <div style={dealBadge}>특가</div>

                <div style={dealTitle}>{safe(d.title, "EXPO 특가")}</div>

                <div style={dealDescription}>
                  {safe(d.description, "행사 특가 상품")}
                </div>

                <div style={price}>{resolvePriceText(d)}</div>

                <div style={dealMeta}>
                  {safe(d.stock_text, "수량 한정")}
                  {fmtDeadline(d.deadline_at) ? ` · ${fmtDeadline(d.deadline_at)}` : ""}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 30 }}>
        <div style={sectionHeadRow}>
          <div>
            <div style={sectionEyebrow}>PRODUCTS</div>
            <h2 style={sectionMainTitle}>추천 제품</h2>
          </div>
        </div>

        {!products || products.length === 0 ? (
          <div style={emptyBox}>등록된 제품이 없습니다.</div>
        ) : (
          <div style={productGrid}>
            {products.map((p, idx) => (
              <Link
                key={String(p.product_id ?? p.id ?? idx)}
                href={p.product_id ? `/expo/product/${p.product_id}` : "#"}
                style={productCard}
              >
                <div style={productName}>{safe(p.name ?? p.title, "제품명 없음")}</div>
                <div style={productDesc}>{safe(p.description, "설명 없음")}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section id="inquiry-request" style={{ marginTop: 30 }}>
        <div style={sectionHeadRow}>
          <div>
            <div style={sectionEyebrow}>BRIDGE INQUIRY</div>
            <h2 style={sectionMainTitle}>상담 / 연결 요청</h2>
          </div>
        </div>

        <div style={leadIntroBox}>
          이름과 연락처, 작물과 문의 내용을 남기면 플랫폼을 통해 먼저 접수되고,
          업체가 확인 후 연락드립니다. 직접 번호 노출 없이 안전하게 상담을 시작할 수 있습니다.
        </div>

        <div style={{ marginTop: 14 }}>
          <BoothInquiryForm
            boothId={resolvedBoothId}
            vendorId={resolveVendorUserId(booth)}
            hallId={safe(hallId, "")}
            slotCode={slotCode}
          />
        </div>
      </section>

      <section style={{ marginTop: 30 }}>
        <div style={sectionHeadRow}>
          <div>
            <div style={sectionEyebrow}>BOOTH INFO</div>
            <h2 style={sectionMainTitle}>부스 소개</h2>
          </div>
        </div>

        <section style={hero}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={sectionTitle}>한 줄 소개</div>
            <div style={introText}>{safe(booth.intro, "업체 소개가 없습니다.")}</div>
          </div>

          <div style={descWrap}>
            <div style={sectionTitle}>상세 소개</div>
            <div style={descBox}>{safe(description, "업체 설명이 없습니다.")}</div>
          </div>
        </section>
      </section>
    </main>
  );
}

/* 스타일 */

const pageWrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: 30,
  background: "#fff",
  minHeight: "100vh",
};

const adminBar: React.CSSProperties = {
  marginBottom: 22,
  border: "1px solid #dbeafe",
  background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
};

const adminTopRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const adminEyebrow: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#2563eb",
  letterSpacing: 0.4,
};

const adminTitle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 22,
  fontWeight: 950,
  color: "#0f172a",
};

const adminDesc: React.CSSProperties = {
  marginTop: 10,
  fontSize: 14,
  lineHeight: 1.7,
  color: "#475569",
  maxWidth: 720,
};

const adminBtnWrap: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const adminPrimaryBtn: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  background: "#0f172a",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
};

const adminGhostBtn: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 900,
};

const adminMetaGrid: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const adminMetaCard: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid #dbeafe",
  background: "#fff",
  padding: 14,
};

const adminMetaCardStrong: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid #bfdbfe",
  background: "#dbeafe",
  padding: 14,
};

const adminMetaLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#64748b",
};

const adminMetaValue: React.CSSProperties = {
  marginTop: 6,
  fontSize: 16,
  fontWeight: 900,
  color: "#0f172a",
};

const adminMetaValueBig: React.CSSProperties = {
  marginTop: 6,
  fontSize: 24,
  fontWeight: 950,
  color: "#0f172a",
};

const adminMetaValueMono: React.CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  fontWeight: 800,
  color: "#0f172a",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  wordBreak: "break-all",
  lineHeight: 1.6,
};

const adminQuickGrid: React.CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const adminQuickCard: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid #dbeafe",
  background: "#fff",
  padding: 14,
};

const adminQuickTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: "#0f172a",
};

const adminQuickText: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.7,
  color: "#475569",
};

const recentWrap: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 14,
  border: "1px solid #dbeafe",
  background: "#fff",
  padding: 14,
};

const recentHeaderRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const recentTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 950,
  color: "#0f172a",
};

const miniLinkBtn: React.CSSProperties = {
  textDecoration: "none",
  color: "#1d4ed8",
  fontWeight: 900,
  fontSize: 13,
};

const recentEmpty: React.CSSProperties = {
  marginTop: 10,
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#64748b",
  padding: 14,
  fontSize: 13,
};

const recentGrid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gap: 10,
};

const recentCard: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: 12,
};

const recentMeta: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  fontSize: 13,
  color: "#475569",
  fontWeight: 700,
};

const recentName: React.CSSProperties = {
  color: "#0f172a",
  fontWeight: 900,
};

const recentBody: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.7,
  color: "#334155",
};

const recentTime: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: "#64748b",
};

const adminNote: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 12,
  background: "#eff6ff",
  color: "#1e40af",
  padding: "12px 14px",
  fontSize: 13,
  lineHeight: 1.7,
  fontWeight: 700,
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  marginBottom: 20,
  flexWrap: "wrap",
};

const headerActions: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const boothBadge: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#ef4444",
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  margin: "4px 0",
  color: "#111",
};

const meta: React.CSSProperties = {
  fontSize: 13,
  color: "#666",
};

const metaPillsRow: React.CSSProperties = {
  marginTop: 10,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const metaPill: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: 12,
  fontWeight: 900,
};

const sectionHeadRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  flexWrap: "wrap",
};

const sectionEyebrow: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#16a34a",
  letterSpacing: 0.4,
};

const sectionMainTitle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 24,
  fontWeight: 950,
  color: "#0f172a",
};

const heroImageSection: React.CSSProperties = {
  marginBottom: 24,
};

const heroImage: React.CSSProperties = {
  width: "100%",
  height: 320,
  objectFit: "cover",
  borderRadius: 18,
  display: "block",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const videoSection: React.CSSProperties = {
  marginBottom: 24,
};

const videoFrameWrap: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 18,
  overflow: "hidden",
  background: "#0f172a",
  boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
  aspectRatio: "16 / 9",
};

const videoFrame: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: "none",
  display: "block",
};

const ctaWrap: React.CSSProperties = {
  marginTop: 20,
};

const ctaBox: React.CSSProperties = {
  border: "2px solid #16a34a",
  padding: 22,
  borderRadius: 18,
  background: "#f0fdf4",
  boxShadow: "0 10px 24px rgba(22,163,74,0.08)",
};

const ctaTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const ctaEyebrow: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#15803d",
  letterSpacing: 0.4,
};

const ctaTitle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 24,
  fontWeight: 950,
  color: "#14532d",
};

const ctaDesc: React.CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  lineHeight: 1.8,
  color: "#166534",
  maxWidth: 620,
};

const ctaButtons: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const ctaPrimary: React.CSSProperties = {
  padding: "12px 14px",
  background: "#15803d",
  color: "#fff",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 900,
};

const ctaSecondary: React.CSSProperties = {
  padding: "12px 14px",
  border: "1px solid #16a34a",
  borderRadius: 10,
  textDecoration: "none",
  color: "#15803d",
  background: "#fff",
  fontWeight: 900,
};

const ctaGhost: React.CSSProperties = {
  padding: "12px 14px",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  textDecoration: "none",
  color: "#166534",
  background: "#fff",
  fontWeight: 900,
};

const ctaMetaGrid: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const ctaMetaCard: React.CSSProperties = {
  borderRadius: 12,
  background: "#fff",
  border: "1px solid #dcfce7",
  padding: 12,
};

const ctaMetaLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#15803d",
};

const ctaMetaValue: React.CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  fontWeight: 800,
  color: "#0f172a",
  wordBreak: "break-all",
};

const leadIntroBox: React.CSSProperties = {
  marginTop: 12,
  padding: 14,
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.8,
};

const hero: React.CSSProperties = {
  border: "1px solid #eee",
  padding: 20,
  borderRadius: 16,
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
  background: "#fafafa",
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 800,
  marginBottom: 8,
  color: "#111",
};

const introText: React.CSSProperties = {
  lineHeight: 1.8,
  color: "#111",
};

const descWrap: React.CSSProperties = {
  width: 350,
  maxWidth: "100%",
};

const descBox: React.CSSProperties = {
  border: "1px solid #eee",
  padding: 12,
  borderRadius: 8,
  background: "#fff",
  lineHeight: 1.8,
  color: "#111",
};

const btnGhost: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #ddd",
  borderRadius: 8,
  textDecoration: "none",
  color: "#111",
  background: "#fff",
  fontWeight: 900,
};

const productGrid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
  gap: 14,
};

const productCard: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: 18,
  borderRadius: 14,
  textDecoration: "none",
  color: "#111",
  background: "#fff",
  display: "block",
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const dealCard: React.CSSProperties = {
  border: "1px solid #fde68a",
  padding: 18,
  borderRadius: 14,
  textDecoration: "none",
  color: "#111",
  background: "#fff7ed",
  display: "block",
  boxShadow: "0 10px 24px rgba(249,115,22,0.08)",
};

const dealBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 999,
  background: "#f97316",
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
};

const dealTitle: React.CSSProperties = {
  marginTop: 12,
  fontWeight: 950,
  fontSize: 18,
  lineHeight: 1.4,
};

const dealDescription: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  color: "#444",
  lineHeight: 1.7,
};

const productName: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 18,
  color: "#111",
};

const productDesc: React.CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  color: "#444",
  lineHeight: 1.7,
};

const price: React.CSSProperties = {
  marginTop: 12,
  fontWeight: 950,
  fontSize: 20,
  color: "#dc2626",
};

const dealMeta: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: "#666",
  lineHeight: 1.6,
};

const emptyBox: React.CSSProperties = {
  marginTop: 12,
  padding: 16,
  borderRadius: 12,
  background: "#f8fafc",
  color: "#64748b",
  border: "1px solid #e5e7eb",
};