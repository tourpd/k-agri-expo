import React from "react";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import VendorLogoutButton from "@/components/vendor/VendorLogoutButton";
import { getCurrentVendor } from "@/lib/vendor/getCurrentVendor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VENDOR_STATUS_HREF = "/vendor";
const VENDOR_MANAGE_HREF = "/vendor/manage";
const VENDOR_APPLICATION_STATUS_HREF = "/vendor/application-status";
const BOOTH_EDITOR_BASE_HREF = "/expo/vendor/booth-editor";

type VendorRow = {
  vendor_id?: string | null;
  user_id?: string | null;
  company_name?: string | null;
  email?: string | null;
  tier?: string | null;
  verify_status?: string | null;
  approved_at?: string | null;
};

type BoothRow = {
  booth_id?: string | null;
  vendor_id?: string | null;
  vendor_user_id?: string | null;
  name?: string | null;
  intro?: string | null;
  description?: string | null;
  category_primary?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  hall_id?: string | null;
  slot_code?: string | null;
  logo_url?: string | null;
  thumbnail_url?: string | null;
  cover_image_url?: string | null;
  banner_url?: string | null;
  booth_type?: string | null;
  plan_type?: string | null;
  consult_enabled?: boolean | null;
  kakao_enabled?: boolean | null;
  phone_bridge_enabled?: boolean | null;
  status?: string | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
  is_published?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SlotRow = {
  hall_id?: string | null;
  slot_id?: string | null;
  booth_id?: string | null;
};

type ApplicationRow = {
  application_code?: string | null;
  status?: string | null;
  admin_note?: string | null;
  booth_type?: string | null;
  duration_key?: string | null;
  amount_krw?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function safe(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s.trim() : fallback;
}

function yesNo(v: unknown) {
  return v ? "예" : "아니오";
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR");
}

function formatKrw(value?: number | null) {
  if (typeof value !== "number") return "-";
  return `${value.toLocaleString("ko-KR")}원`;
}

function normalizeHallId(v?: string | null) {
  const raw = safe(v, "");
  if (!raw) return "";

  if (raw === "agri_inputs") return "agri-inputs";
  if (raw === "smart_farm") return "smartfarm";
  if (raw === "eco_friendly") return "eco-friendly";
  if (raw === "future_insect") return "future-insect";

  return raw;
}

function hallLabel(value?: string | null) {
  const v = normalizeHallId(value).toLowerCase();

  if (v === "agri-inputs") return "농자재관";
  if (v === "machines" || v === "machinery" || v === "agri-machinery") return "농기계관";
  if (v === "seeds" || v === "seed") return "종자관";
  if (v === "smartfarm" || v === "smart-farm") return "스마트팜관";
  if (v === "eco-friendly") return "친환경관";
  if (v === "future-insect") return "미래 곤충관";

  return value ? String(value) : "-";
}

function normalizeSlotCode(v?: string | null) {
  const slot = safe(v, "");
  if (!slot) return "-";

  const raw = slot.toUpperCase().replace(/\s+/g, "");
  const m = raw.match(/^([A-Z])[-_]?0*([0-9]+)$/);
  if (!m) return raw;

  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

function boothTypeLabel(value?: string | null) {
  const v = safe(value, "").toLowerCase();

  if (v === "product") return "대표상품형";
  if (v === "brand") return "브랜드형";
  if (v === "promo") return "특가형";
  if (v === "free") return "무료 체험";
  if (v === "basic" || v === "general") return "일반형";
  if (v === "premium") return "프리미엄형";

  return value ? value : "-";
}

function planLabel(value?: string | null) {
  const v = safe(value, "").toLowerCase();

  if (v === "premium") return "프리미엄";
  if (v === "basic" || v === "general") return "일반";
  if (v === "free") return "무료 체험";

  return value ? value : "-";
}

function durationLabel(value?: string | null) {
  const v = safe(value, "").toLowerCase();

  if (v === "1m") return "1개월";
  if (v === "3m") return "3개월";
  if (v === "6m") return "6개월";
  if (v === "12m") return "12개월";

  return value ? value : "-";
}

function publicStatusLabel(booth: BoothRow | null) {
  if (!booth) return "-";

  if (booth.is_public === true && booth.is_active === true && booth.is_published === true) {
    return "공개 중";
  }

  if (safe(booth.status, "").toLowerCase() === "draft") {
    return "초안";
  }

  return "비공개 또는 준비 중";
}

function resolveBoothName(booth: BoothRow | null, vendor: VendorRow | null) {
  return safe(booth?.name, "") || safe(vendor?.company_name, "") || "내 부스";
}

function resolveBoothImage(booth: BoothRow | null) {
  return (
    safe(booth?.banner_url, "") ||
    safe(booth?.cover_image_url, "") ||
    safe(booth?.thumbnail_url, "") ||
    safe(booth?.logo_url, "")
  );
}

function applicationStatusLabel(value?: string | null) {
  const v = safe(value, "").toLowerCase();

  if (v === "approved") return "승인 완료";
  if (v === "pending") return "검토 중";
  if (v === "submitted") return "접수 완료";
  if (v === "rejected") return "반려";
  if (v === "revision_requested") return "보완 요청";
  if (v === "needs_revision") return "보완 필요";

  return value ? value : "-";
}

export default async function VendorManagePage() {
  const { user, vendor } = await getCurrentVendor();

  const userId = user.id;
  const vendorId = safe(vendor?.vendor_id, "");

  const supabase = createSupabaseAdminClient();

  const vendorRes = await supabase
    .from("vendors")
    .select("vendor_id,user_id,company_name,email,tier,verify_status,approved_at")
    .eq("vendor_id", vendorId)
    .maybeSingle();

  const applicationRes = await supabase
    .from("vendor_applications_v2")
    .select(`
      application_code,
      status,
      admin_note,
      booth_type,
      duration_key,
      amount_krw,
      created_at,
      updated_at
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const vendorRow = ((vendorRes.data ?? vendor) as VendorRow | null) ?? null;
  const appRows = (applicationRes.data ?? []) as ApplicationRow[];
  const appRow = appRows.length > 0 ? appRows[0] : null;

  let boothRow: BoothRow | null = null;

  const boothSelect = `
    booth_id,
    vendor_id,
    vendor_user_id,
    name,
    intro,
    description,
    category_primary,
    contact_name,
    phone,
    email,
    hall_id,
    slot_code,
    logo_url,
    thumbnail_url,
    cover_image_url,
    banner_url,
    booth_type,
    plan_type,
    consult_enabled,
    kakao_enabled,
    phone_bridge_enabled,
    status,
    is_public,
    is_active,
    is_published,
    created_at,
    updated_at
  `;

  const boothByVendorRes = await supabase
    .from("booths")
    .select(boothSelect)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!boothByVendorRes.error) {
    const rows = (boothByVendorRes.data ?? []) as BoothRow[];
    if (rows.length > 0) {
      boothRow = rows[0];
    }
  }

  if (!boothRow?.booth_id) {
    const boothByUserRes = await supabase
      .from("booths")
      .select(boothSelect)
      .eq("vendor_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!boothByUserRes.error) {
      const rows = (boothByUserRes.data ?? []) as BoothRow[];
      if (rows.length > 0) {
        boothRow = rows[0];
      }
    }
  }

  if (!boothRow?.booth_id) {
    return (
      <main style={S.page}>
        <div style={S.wrap}>
          <section style={S.card}>
            <div style={S.sectionEyebrow}>VENDOR MANAGE</div>
            <h2 style={S.sectionTitle}>부스 연결을 확인 중입니다</h2>

            <div style={S.emptyBox}>
              업체 계정과 승인 상태는 확인되었지만, 관리 화면에서 연결된 부스를 아직 읽지 못했습니다.
            </div>

            <div style={S.detailGrid}>
              <DetailCard
                title="세션 / 업체 정보"
                rows={[
                  ["user_id", userId || "-"],
                  ["vendor_id", safe(vendorRow?.vendor_id, "-")],
                  ["회사명", safe(vendorRow?.company_name, "-")],
                  ["이메일", safe(vendorRow?.email, "-")],
                  ["업체 승인 상태", applicationStatusLabel(vendorRow?.verify_status)],
                ]}
              />

              <DetailCard
                title="최근 신청 정보"
                rows={[
                  ["신청 코드", safe(appRow?.application_code, "-")],
                  ["신청 상태", applicationStatusLabel(appRow?.status)],
                  ["신청 시각", formatDateTime(appRow?.created_at)],
                  ["최근 수정 시각", formatDateTime(appRow?.updated_at)],
                  ["신청 금액", formatKrw(appRow?.amount_krw)],
                ]}
              />

              <DetailCard
                title="관리 메모"
                rows={[
                  ["안내", safe(appRow?.admin_note, "등록된 관리자 메모가 없습니다.")],
                  ["승인 시각", formatDateTime(vendorRow?.approved_at)],
                  ["요금제", planLabel(vendorRow?.tier)],
                  ["신청 부스 유형", boothTypeLabel(appRow?.booth_type)],
                  ["신청 기간", durationLabel(appRow?.duration_key)],
                ]}
              />
            </div>

            <div style={S.actionRow}>
              <Link href={VENDOR_STATUS_HREF} style={S.primaryBtn}>
                상태 다시 확인
              </Link>
              <Link href={VENDOR_APPLICATION_STATUS_HREF} style={S.secondaryBtn}>
                신청서 상세 보기
              </Link>
              <VendorLogoutButton />
            </div>
          </section>
        </div>
      </main>
    );
  }

  const boothId = safe(boothRow.booth_id, "");
  const boothName = resolveBoothName(boothRow, vendorRow);
  const boothImage = resolveBoothImage(boothRow);

  let slotInfo: SlotRow | null = null;

  try {
    const slotRes = await supabase
      .from("hall_booth_slots")
      .select("hall_id,slot_id,booth_id")
      .eq("booth_id", boothId)
      .limit(1)
      .maybeSingle();

    slotInfo = (slotRes.data ?? null) as SlotRow | null;
  } catch {
    slotInfo = null;
  }

  const hallId =
    normalizeHallId(slotInfo?.hall_id) || normalizeHallId(boothRow.hall_id) || "";

  const normalizedSlotFromSlot = normalizeSlotCode(slotInfo?.slot_id);
  const normalizedSlotFromBooth = normalizeSlotCode(boothRow.slot_code);

  const slotCode =
    normalizedSlotFromSlot !== "-" ? normalizedSlotFromSlot : normalizedSlotFromBooth;

  const publicBoothHref = `/expo/booths/${encodeURIComponent(boothId)}`;
  const boothEditorHref = `${BOOTH_EDITOR_BASE_HREF}?booth_id=${encodeURIComponent(boothId)}`;
  const applicationStatusHref = VENDOR_APPLICATION_STATUS_HREF;
  const hallHref = hallId ? `/expo/hall/${hallId}` : "/expo";

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <section style={S.hero}>
          <div style={S.heroTopRow}>
            <div style={S.heroLeft}>
              <div style={S.eyebrow}>VENDOR MANAGE</div>
              <h1 style={S.heroTitle}>부스 운영 관리</h1>
              <p style={S.heroDesc}>
                내 부스의 공개 상태, 전시장 위치, 편집 진입, 신청 상태를 여기서 확인하고 바로 다음 작업으로 이어갈 수 있습니다.
              </p>
            </div>

            <div style={S.heroActions}>
              <Link href={VENDOR_STATUS_HREF} style={S.secondaryBtn}>
                상태 다시 확인
              </Link>
              <Link href={applicationStatusHref} style={S.secondaryBtn}>
                신청서 상세 보기
              </Link>
              <VendorLogoutButton />
            </div>
          </div>
        </section>

        <section style={S.boothHeroCard}>
          <div style={S.boothHeroLeft}>
            <div style={S.sectionEyebrow}>MY BOOTH</div>
            <div style={S.boothTitle}>{boothName}</div>
            <div style={S.boothMeta}>
              {hallLabel(hallId)} · {slotCode || "-"} ·{" "}
              {safe(boothRow.category_primary, "카테고리 미지정")}
            </div>

            <div style={S.pillRow}>
              <span style={S.pill}>{boothTypeLabel(boothRow.booth_type)}</span>
              <span style={S.pill}>{planLabel(boothRow.plan_type || vendorRow?.tier)}</span>
              <span style={S.pillStrong}>{publicStatusLabel(boothRow)}</span>
            </div>

            <div style={S.actionRow}>
              <Link href={boothEditorHref} style={S.primaryBtn}>
                부스 편집하기 →
              </Link>
              <Link href={publicBoothHref} style={S.secondaryBtn}>
                공개 부스 보기
              </Link>
              <Link href={hallHref} style={S.secondaryBtn}>
                전시장 보기
              </Link>
            </div>
          </div>

          <div style={S.boothHeroRight}>
            {boothImage ? (
              <img src={boothImage} alt={boothName} style={S.heroImage} />
            ) : (
              <div style={S.heroImageFallback}>
                <div style={S.heroImageFallbackTitle}>대표 이미지 없음</div>
                <div style={S.heroImageFallbackDesc}>
                  배너, 대표 이미지, 로고를 등록하면 여기에서 바로 확인할 수 있습니다.
                </div>
              </div>
            )}
          </div>
        </section>

        <section style={S.topGrid}>
          <InfoCard title="부스 ID" value={boothId} sub="현재 연결된 실제 부스 ID" mono />
          <InfoCard
            title="공개 상태"
            value={publicStatusLabel(boothRow)}
            sub="사용자에게 보이는 공개 여부 기준"
          />
          <InfoCard
            title="업체 승인 상태"
            value={applicationStatusLabel(vendorRow?.verify_status)}
            sub="vendors 테이블 승인 상태"
          />
          <InfoCard
            title="최근 수정 시각"
            value={formatDateTime(boothRow.updated_at)}
            sub="부스 정보 마지막 업데이트 시각"
          />
        </section>

        <section style={S.statusGrid}>
          <StatusCard
            title="부스 노출 상태"
            label={publicStatusLabel(boothRow)}
            desc="is_public, is_active, is_published 기준으로 공개 상태를 판단합니다."
            tone={
              publicStatusLabel(boothRow) === "공개 중"
                ? { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" }
                : { bg: "#fffbeb", border: "#fde68a", text: "#92400e" }
            }
          />

          <StatusCard
            title="상담 연결 상태"
            label={boothRow.consult_enabled !== false ? "상담 요청 사용" : "상담 요청 꺼짐"}
            desc="고객 문의 폼과 연결되는 기본 브릿지 설정입니다."
            tone={
              boothRow.consult_enabled !== false
                ? { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" }
                : { bg: "#f8fafc", border: "#e2e8f0", text: "#475569" }
            }
          />

          <StatusCard
            title="연락 옵션 상태"
            label={
              boothRow.kakao_enabled !== false || boothRow.phone_bridge_enabled !== false
                ? "브릿지 연결 사용"
                : "직접 연결 비활성"
            }
            desc="카카오 상담 및 전화 연결 요청 노출 여부를 점검합니다."
            tone={
              boothRow.kakao_enabled !== false || boothRow.phone_bridge_enabled !== false
                ? { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" }
                : { bg: "#f8fafc", border: "#e2e8f0", text: "#475569" }
            }
          />
        </section>

        <section style={S.card}>
          <div style={S.sectionEyebrow}>BOOTH INFO</div>
          <h2 style={S.sectionTitle}>부스 기본 정보</h2>

          <div style={S.detailGrid}>
            <DetailCard
              title="기본 정보"
              rows={[
                ["부스명", boothName],
                ["담당자명", safe(boothRow.contact_name, "-")],
                ["연락 이메일", safe(boothRow.email, "") || safe(vendorRow?.email, "-")],
                ["연락처", safe(boothRow.phone, "-")],
                ["카테고리", safe(boothRow.category_primary, "-")],
              ]}
            />

            <DetailCard
              title="전시장 정보"
              rows={[
                ["전시장", hallLabel(hallId)],
                ["슬롯 위치", slotCode || "-"],
                ["부스 유형", boothTypeLabel(boothRow.booth_type)],
                ["요금제", planLabel(boothRow.plan_type || vendorRow?.tier)],
                ["생성 시각", formatDateTime(boothRow.created_at)],
              ]}
            />

            <DetailCard
              title="공개 / 연결 설정"
              rows={[
                ["공개 여부", yesNo(boothRow.is_public === true)],
                ["활성 여부", yesNo(boothRow.is_active === true)],
                ["발행 여부", yesNo(boothRow.is_published === true)],
                ["상담 요청 사용", yesNo(boothRow.consult_enabled !== false)],
                ["카카오 상담 사용", yesNo(boothRow.kakao_enabled !== false)],
              ]}
            />
          </div>

          <div style={S.longInfoBox}>
            <div style={S.longInfoTitle}>한 줄 소개</div>
            <div style={S.longInfoBody}>
              {safe(boothRow.intro, "아직 한 줄 소개가 등록되지 않았습니다.")}
            </div>
          </div>

          <div style={S.longInfoBox}>
            <div style={S.longInfoTitle}>상세 소개</div>
            <div style={S.longInfoBody}>
              {safe(boothRow.description, "상세 설명이 아직 등록되지 않았습니다.")}
            </div>
          </div>
        </section>

        <section style={S.card}>
          <div style={S.sectionEyebrow}>APPLICATION SNAPSHOT</div>
          <h2 style={S.sectionTitle}>최근 신청 정보 요약</h2>

          {appRow ? (
            <div style={S.detailGrid}>
              <DetailCard
                title="신청 정보"
                rows={[
                  ["신청 코드", safe(appRow.application_code, "-")],
                  ["신청 상태", applicationStatusLabel(appRow.status)],
                  ["신청 부스 유형", boothTypeLabel(appRow.booth_type)],
                  ["이용 기간", durationLabel(appRow.duration_key)],
                  ["신청 금액", formatKrw(appRow.amount_krw)],
                ]}
              />

              <DetailCard
                title="신청 일정"
                rows={[
                  ["신청 시각", formatDateTime(appRow.created_at)],
                  ["최근 수정 시각", formatDateTime(appRow.updated_at)],
                  ["승인 시각", formatDateTime(vendorRow?.approved_at)],
                  ["요금제", planLabel(vendorRow?.tier)],
                  ["회사명", safe(vendorRow?.company_name, "-")],
                ]}
              />

              <DetailCard
                title="관리 메모"
                rows={[["안내", safe(appRow.admin_note, "등록된 관리자 메모가 없습니다.")]]}
              />
            </div>
          ) : (
            <div style={S.emptyBox}>최근 신청 정보가 없습니다.</div>
          )}
        </section>

        <section style={S.card}>
          <div style={S.sectionEyebrow}>NEXT ACTION</div>
          <h2 style={S.sectionTitle}>다음 추천 작업</h2>

          <div style={S.todoBox}>
            <ul style={S.todoList}>
              <li>부스 편집 페이지에서 대표 이미지와 로고를 먼저 등록하십시오.</li>
              <li>한 줄 소개와 상세 소개를 채워 공개 페이지 완성도를 높이십시오.</li>
              <li>상담 요청, 카카오 상담, 전화 브릿지 노출 여부를 점검하십시오.</li>
              <li>공개 부스 페이지를 직접 열어 실제 고객 화면을 확인하십시오.</li>
            </ul>
          </div>

          <div style={S.actionRow}>
            <Link href={boothEditorHref} style={S.primaryBtn}>
              부스 편집하기 →
            </Link>

            <Link href={publicBoothHref} style={S.secondaryBtn}>
              공개 부스 보기
            </Link>

            <Link href={VENDOR_STATUS_HREF} style={S.ghostBtn}>
              상태 다시 확인
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  value,
  sub,
  mono = false,
}: {
  title: string;
  value: string;
  sub: string;
  mono?: boolean;
}) {
  return (
    <div style={S.infoCard}>
      <div style={S.infoTitle}>{title}</div>
      <div style={mono ? S.infoValueMono : S.infoValue}>{value}</div>
      <div style={S.infoSub}>{sub}</div>
    </div>
  );
}

function StatusCard({
  title,
  label,
  desc,
  tone,
}: {
  title: string;
  label: string;
  desc: string;
  tone: { bg: string; border: string; text: string };
}) {
  return (
    <div style={S.statusCard}>
      <div style={S.statusTitle}>{title}</div>
      <div
        style={{
          ...S.badge,
          background: tone.bg,
          borderColor: tone.border,
          color: tone.text,
        }}
      >
        {label}
      </div>
      <div style={S.statusDesc}>{desc}</div>
    </div>
  );
}

function DetailCard({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div style={S.detailCard}>
      <div style={S.detailTitle}>{title}</div>
      <div style={S.detailList}>
        {rows.map(([k, v]) => (
          <div key={`${title}-${k}-${v}`} style={S.detailRow}>
            <div style={S.detailKey}>{k}</div>
            <div style={S.detailValue}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px",
  },
  wrap: {
    maxWidth: 1280,
    margin: "0 auto",
    display: "grid",
    gap: 24,
  },
  hero: {
    borderRadius: 32,
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#fff",
    padding: 32,
    boxShadow: "0 20px 60px rgba(15,23,42,0.15)",
  },
  heroTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  heroLeft: {
    flex: 1,
    minWidth: 300,
  },
  heroActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 1,
    color: "#86efac",
  },
  heroTitle: {
    margin: "10px 0 0",
    fontSize: 40,
    lineHeight: 1.1,
    fontWeight: 950,
  },
  heroDesc: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 1.9,
    color: "#cbd5e1",
    maxWidth: 920,
  },
  boothHeroCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 28,
    padding: 24,
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 18,
  },
  boothHeroLeft: {
    minWidth: 0,
  },
  boothHeroRight: {
    minWidth: 0,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.8,
    color: "#16a34a",
  },
  boothTitle: {
    marginTop: 10,
    fontSize: 34,
    lineHeight: 1.15,
    fontWeight: 950,
    color: "#0f172a",
  },
  boothMeta: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.8,
  },
  pillRow: {
    marginTop: 14,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#334155",
    fontSize: 12,
    fontWeight: 900,
  },
  pillStrong: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: 12,
    fontWeight: 900,
  },
  heroImage: {
    width: "100%",
    height: 260,
    objectFit: "cover",
    borderRadius: 18,
    display: "block",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  heroImageFallback: {
    height: 260,
    borderRadius: 18,
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    padding: 20,
    textAlign: "center",
  },
  heroImageFallbackTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
  },
  heroImageFallbackDesc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#64748b",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 16,
  },
  infoCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: "#64748b",
  },
  infoValue: {
    marginTop: 10,
    fontSize: 24,
    lineHeight: 1.3,
    fontWeight: 900,
    color: "#0f172a",
    wordBreak: "break-word",
  },
  infoValueMono: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 900,
    color: "#0f172a",
    wordBreak: "break-all",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  infoSub: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 1.7,
    color: "#64748b",
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  statusCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#475569",
  },
  badge: {
    display: "inline-block",
    marginTop: 14,
    border: "1px solid",
    borderRadius: 999,
    padding: "9px 14px",
    fontSize: 14,
    fontWeight: 900,
  },
  statusDesc: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#475569",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
  },
  sectionTitle: {
    margin: "10px 0 0",
    fontSize: 30,
    lineHeight: 1.2,
    fontWeight: 950,
    color: "#0f172a",
  },
  detailGrid: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  detailCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 22,
    padding: 20,
    background: "#fff",
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 14,
  },
  detailList: {
    display: "grid",
    gap: 12,
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: 10,
  },
  detailKey: {
    fontSize: 14,
    fontWeight: 800,
    color: "#64748b",
    minWidth: 88,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
    textAlign: "right",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  longInfoBox: {
    marginTop: 18,
    borderRadius: 20,
    border: "1px solid #e2e8f0",
    background: "#fff",
    padding: 18,
  },
  longInfoTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
  },
  longInfoBody: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 1.9,
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  todoBox: {
    borderRadius: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    padding: 18,
  },
  todoList: {
    margin: 0,
    paddingLeft: 18,
    color: "#475569",
    lineHeight: 1.95,
    fontSize: 15,
  },
  emptyBox: {
    marginTop: 18,
    borderRadius: 18,
    padding: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.8,
  },
  actionRow: {
    marginTop: 22,
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    background: "#111827",
    color: "#fff",
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 900,
    textDecoration: "none",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 900,
    textDecoration: "none",
  },
  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    background: "#f8fafc",
    color: "#0f172a",
    border: "1px solid #e5e7eb",
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 900,
    textDecoration: "none",
  },
};