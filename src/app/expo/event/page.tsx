// src/app/expo/event/page.tsx
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import EventEntryForm from "./EventEntryForm";
import EventCounter from "@/components/EventCounter";

export const dynamic = "force-dynamic";

function toEmbedUrl(url: string | null | undefined) {
  if (!url) return "";

  if (url.includes("/embed/")) return url;

  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return "";
}

function safe(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

export default async function ExpoEventPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: expoEvent }, { data: eventRow }] = await Promise.all([
    supabase
      .from("expo_events")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("events")
      .select("*")
      .eq("id", 1)
      .limit(1)
      .maybeSingle(),
  ]);

  const eventId = Number(eventRow?.id || 1);

  const title =
    safe(expoEvent?.title) ||
    safe(eventRow?.title) ||
    "이벤트 준비중";

  const prizeText =
    safe(expoEvent?.prize_text) ||
    safe(eventRow?.price_text) ||
    "";

  const description =
    safe(expoEvent?.description) ||
    safe(eventRow?.description) ||
    "이벤트 설명이 아직 등록되지 않았습니다.";

  const heroImageUrl = safe(expoEvent?.hero_image_url) || "";
  const heroVideoUrl =
    safe(expoEvent?.hero_video_url) ||
    safe(eventRow?.video_url) ||
    "";

  const primaryButtonText =
    safe(expoEvent?.primary_button_text) || "EXPO 메인으로";
  const primaryButtonLink =
    safe(expoEvent?.primary_button_link) || "/expo";

  const secondaryButtonText =
    safe(expoEvent?.secondary_button_text) || "라이브 일정 보기";
  const secondaryButtonLink =
    safe(expoEvent?.secondary_button_link) || "/expo/live";

  const embedUrl = toEmbedUrl(heroVideoUrl);

  const noticeLines =
    safe(eventRow?.notice_lines)
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean) || [];

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.hero}>
          <div style={S.heroText}>
            <div style={S.badge}>🎁 K-Agri Expo 이달의 경품 이벤트</div>

            <h1 style={S.title}>{title}</h1>

            <div style={S.price}>{prizeText}</div>

            <p style={S.desc}>{description}</p>

            <div style={S.heroActions}>
              <Link href={primaryButtonLink} style={S.primaryBtn}>
                {primaryButtonText} →
              </Link>

              <Link href={secondaryButtonLink} style={S.ghostBtn}>
                {secondaryButtonText}
              </Link>
            </div>
          </div>

          <div style={S.videoSection}>
            {heroImageUrl ? (
              <div style={S.imageFrame}>
                <img src={heroImageUrl} alt={title} style={S.heroImage} />
              </div>
            ) : (
              <div style={S.videoFrame}>
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={title || "이벤트 영상"}
                    style={S.video}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div style={S.videoFallback}>
                    영상 링크가 아직 등록되지 않았습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <section style={S.section}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.eyebrow}>LIVE ENTRY STATUS</div>
              <h2 style={S.sectionTitle}>실시간 응모 현황</h2>
              <div style={S.sectionDesc}>
                라이브 방송 중에도 응모가 계속 들어오며, 참여 농가 수가 실시간으로 반영됩니다.
              </div>
            </div>
          </div>

          <EventCounter eventId={eventId} />
        </section>

        <section style={S.section}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.eyebrow}>EVENT ENTRY</div>
              <h2 style={S.sectionTitle}>이벤트 참여하기</h2>
              <div style={S.sectionDesc}>
                이름, 전화번호, 지역, 재배작물을 입력하면 이벤트 참여가 완료되며 참가번호가 즉시 발급됩니다.
              </div>
            </div>
          </div>

          <EventEntryForm />
        </section>

        <section style={S.section}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.eyebrow}>HOW IT WORKS</div>
              <h2 style={S.sectionTitle}>추첨 방식 안내</h2>
            </div>
          </div>

          <div style={S.stepsGrid}>
            <div style={S.stepCard}>
              <div style={S.stepNo}>01</div>
              <div style={S.stepTitle}>이벤트 참여</div>
              <div style={S.stepDesc}>
                이름, 전화번호, 지역, 재배작물을 입력하면 응모가 완료되고 참가번호가 발급됩니다.
              </div>
            </div>

            <div style={S.stepCard}>
              <div style={S.stepNo}>02</div>
              <div style={S.stepTitle}>라이브 응모 마감</div>
              <div style={S.stepDesc}>
                유튜브 라이브 방송 중 응모를 마감하고 총 응모자 수를 공개한 뒤 추첨을 시작합니다.
              </div>
            </div>

            <div style={S.stepCard}>
              <div style={S.stepNo}>03</div>
              <div style={S.stepTitle}>실시간 랜덤 추첨</div>
              <div style={S.stepDesc}>
                발급된 참가번호를 기준으로 공정하게 랜덤 추첨을 진행합니다.
              </div>
            </div>

            <div style={S.stepCard}>
              <div style={S.stepNo}>04</div>
              <div style={S.stepTitle}>2분 전화 확인</div>
              <div style={S.stepDesc}>
                당첨자는 발표 후 2분 안에 전화 연결이 되어야 최종 확정되며, 미응답 시 재추첨합니다.
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...S.section, paddingBottom: 70 }}>
          <div style={S.noticeBox}>
            <div style={S.noticeTitle}>안내사항</div>

            {noticeLines.length > 0 ? (
              <ul style={S.noticeList}>
                {noticeLines.map((line: string, index: number) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            ) : (
              <ul style={S.noticeList}>
                <li>안내사항이 아직 등록되지 않았습니다.</li>
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    color: "#0f172a",
  },

  wrap: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: "24px 24px 0",
  },

  hero: {
    borderRadius: 34,
    padding: 28,
    background: "linear-gradient(135deg, #111827 0%, #1f2937 55%, #9a3412 100%)",
    color: "#fff",
    boxShadow: "0 28px 70px rgba(15,23,42,0.16)",
  },

  heroText: {},

  badge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 12,
    fontWeight: 950,
  },

  title: {
    margin: "18px 0 0",
    fontSize: 56,
    lineHeight: 1.06,
    fontWeight: 950,
    letterSpacing: -1.2,
    whiteSpace: "pre-line",
  },

  price: {
    marginTop: 14,
    fontSize: 42,
    fontWeight: 950,
    color: "#fde68a",
  },

  desc: {
    marginTop: 18,
    fontSize: 17,
    lineHeight: 1.95,
    color: "rgba(255,255,255,0.92)",
    maxWidth: 980,
    whiteSpace: "pre-line",
  },

  heroActions: {
    marginTop: 24,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  primaryBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    padding: "14px 20px",
    borderRadius: 16,
    fontWeight: 950,
  },

  ghostBtn: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: "14px 20px",
    borderRadius: 16,
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.14)",
  },

  videoSection: {
    marginTop: 28,
  },

  imageFrame: {
    width: "100%",
    borderRadius: 26,
    overflow: "hidden",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  },

  heroImage: {
    width: "100%",
    display: "block",
    objectFit: "cover",
  },

  videoFrame: {
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: 26,
    overflow: "hidden",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  },

  video: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
  },

  videoFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.8)",
    fontSize: 24,
    fontWeight: 800,
    textAlign: "center",
    padding: 24,
  },

  section: {
    marginTop: 30,
  },

  sectionHead: {
    marginBottom: 16,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },

  sectionTitle: {
    margin: "8px 0 0",
    fontSize: 32,
    lineHeight: 1.1,
    fontWeight: 950,
    letterSpacing: -0.7,
  },

  sectionDesc: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.8,
  },

  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },

  stepCard: {
    borderRadius: 24,
    padding: 22,
    background: "#fff",
    border: "1px solid #e5e5e5",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },

  stepNo: {
    fontSize: 14,
    fontWeight: 950,
    color: "#16a34a",
  },

  stepTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1.25,
    wordBreak: "keep-all",
  },

  stepDesc: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.8,
    wordBreak: "keep-all",
  },

  noticeBox: {
    borderRadius: 24,
    padding: 22,
    background: "#fff",
    border: "1px solid #e5e5e5",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },

  noticeTitle: {
    fontSize: 22,
    fontWeight: 950,
  },

  noticeList: {
    marginTop: 14,
    paddingLeft: 18,
    color: "#475569",
    lineHeight: 1.9,
  },
};