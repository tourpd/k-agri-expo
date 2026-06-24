import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ eventId: string }>;
};

type LiveEvent = {
  id: string;
  title?: string | null;
  status?: string | null;
  current_prize_id?: string | null;
  current_live_prize_id?: string | null;
};

type LivePrize = {
  id: string;
  title?: string | null;
  sponsor?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  media_mode?: string | null;
  event_label?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  quantity?: number | null;
  total_winners?: number | null;
  sort_order?: number | null;
  display_group?: string | null;
  draw_type?: string | null;
  category?: string | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
};

async function setCurrentPrize(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const eventId = String(formData.get("event_id") || "").trim();
  const prizeId = String(formData.get("prize_id") || "").trim();

  if (!eventId || !prizeId) {
    throw new Error("방송에 띄울 경품 정보가 없습니다.");
  }

  const { error } = await supabase
    .from("live_events")
    .update({ current_prize_id: prizeId })
    .eq("id", eventId);

  if (error) {
    throw new Error(
      `live_events에 current_prize_id 컬럼이 필요합니다: ${error.message}`
    );
  }

  revalidatePath(`/admin/live/events/${eventId}/prizes`);
  revalidatePath(`/admin/live-broadcast`);
  redirect(`/admin/live/events/${eventId}/prizes`);
}

async function deletePrize(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const eventId = String(formData.get("event_id") || "").trim();
  const prizeId = String(formData.get("prize_id") || "").trim();

  if (!eventId || !prizeId) {
    throw new Error("삭제할 경품 정보가 없습니다.");
  }

  const { error } = await supabase
    .from("live_prizes")
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", prizeId)
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/live/events/${eventId}/prizes`);
  revalidatePath(`/admin/live-broadcast`);
  redirect(`/admin/live/events/${eventId}/prizes`);
}

function statusText(status?: string | null) {
  if (status === "live") return "진행중";
  if (status === "ready") return "준비중";
  if (status === "ended") return "종료";
  return "미설정";
}

function mediaText(v?: string | null, videoUrl?: string | null) {
  if (v === "video") return "영상";
  if (v === "both") return "이미지+영상";
  if (v === "none") return "문구";
  if (videoUrl) return "이미지+영상";
  return "이미지";
}

function groupText(v?: string | null) {
  if (v === "big") return "대표 경품";
  if (v === "general") return "일반 경품";
  if (v === "small") return "소형 경품";
  if (v === "coupon") return "쿠폰/참가상";
  return "경품";
}

export default async function AdminLivePrizesPage({ params }: PageProps) {
  const { eventId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: event, error: eventError } = await supabase
    .from("live_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle<LiveEvent>();

  const { data: prizes, error: prizeError } = await supabase
    .from("live_prizes")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const prizeRows = (prizes || []) as LivePrize[];
  const currentPrizeId = event?.current_prize_id || event?.current_live_prize_id || "";

  return (
    <main style={wrap}>
      <section style={card}>
        <div style={top}>
          <div>
            <div style={eyebrow}>K-Agri Live Admin</div>
            <h1 style={title}>🎁 경품 목록 관리</h1>
            <p style={desc}>
              경품 이미지, 제품 영상 URL, 방송 노출 경품을 관리합니다.
              수정은 개별 경품 수정 페이지에서 합니다.
            </p>
          </div>

          <div style={topActions}>
            <Link href="/admin/live/events" style={darkButton}>
              ← 이벤트 목록
            </Link>
            <Link href={`/admin/live-broadcast?eventId=${eventId}`} style={greenButton}>
              방송화면 보기 →
            </Link>
          </div>
        </div>

        {eventError ? (
          <div style={errorBox}>이벤트 조회 오류: {eventError.message}</div>
        ) : null}

        <section style={eventBox}>
          <span style={statusBadge}>{statusText(event?.status)}</span>
          <h2 style={eventTitle}>{event?.title || "이벤트 제목 없음"}</h2>
          <p style={eventIdText}>event_id: {eventId}</p>
        </section>

        <div style={actionRow}>
          <Link href={`/admin/live/events/${eventId}/prizes/new`} style={addButton}>
            + 새 경품 등록
          </Link>
        </div>

        <section style={section}>
          <h2 style={sectionTitle}>등록된 경품</h2>

          {prizeError ? (
            <div style={errorBox}>경품 조회 오류: {prizeError.message}</div>
          ) : null}

          {prizeRows.length === 0 ? (
            <div style={emptyBox}>
              아직 등록된 경품이 없습니다.
              <br />
              새 경품 등록 버튼을 눌러 경품을 추가하세요.
            </div>
          ) : (
            <div style={prizeList}>
              {prizeRows.map((prize, index) => {
                const isCurrent = currentPrizeId === prize.id;
                const hasVideo = Boolean(String(prize.video_url || "").trim());

                return (
                  <article
                    key={prize.id}
                    style={{
                      ...prizeCard,
                      border: isCurrent ? "4px solid #16a34a" : "1px solid #e5e7eb",
                    }}
                  >
                    <div style={prizeMain}>
                      <div style={thumbBox}>
                        {prize.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prize.image_url}
                            alt={prize.title || "경품"}
                            style={thumb}
                          />
                        ) : (
                          <div style={noThumb}>이미지 없음</div>
                        )}
                      </div>

                      <div style={info}>
                        <div style={badgeRow}>
                          <span style={smallBadge}>{index + 1}번</span>
                          <span style={smallBadge}>{groupText(prize.display_group)}</span>
                          <span style={smallBadge}>
                            {mediaText(prize.media_mode, prize.video_url)}
                          </span>
                          {hasVideo ? <span style={videoBadge}>영상 있음</span> : null}
                          {isCurrent ? <span style={onAirBadge}>현재 방송중</span> : null}
                        </div>

                        <h3 style={prizeTitle}>{prize.title || "경품명 없음"}</h3>

                        <p style={prizeDesc}>
                          {prize.headline ||
                            prize.subheadline ||
                            prize.event_label ||
                            prize.sponsor ||
                            "방송 문구 없음"}
                        </p>

                        <div style={metaGrid}>
                          <div>
                            <span>협찬사</span>
                            <b>{prize.sponsor || "-"}</b>
                          </div>
                          <div>
                            <span>수량</span>
                            <b>{prize.quantity || prize.total_winners || 1}개</b>
                          </div>
                          <div>
                            <span>순서</span>
                            <b>{prize.sort_order || 1}</b>
                          </div>
                          <div>
                            <span>카테고리</span>
                            <b>{prize.category || "-"}</b>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={buttonRow}>
                      <form action={setCurrentPrize} style={buttonForm}>
                        <input type="hidden" name="event_id" value={eventId} />
                        <input type="hidden" name="prize_id" value={prize.id} />
                        <button
                          type="submit"
                          style={isCurrent ? currentButton : broadcastButton}
                        >
                          {isCurrent ? "방송중" : "방송에 띄우기"}
                        </button>
                      </form>

                      <Link
                        href={`/admin/live/events/${eventId}/prizes/${prize.id}/edit`}
                        style={editButton}
                      >
                        수정
                      </Link>

                      {hasVideo ? (
                        <a
                          href={prize.video_url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          style={videoButton}
                        >
                          영상보기
                        </a>
                      ) : (
                        <Link
                          href={`/admin/live/events/${eventId}/prizes/${prize.id}/edit`}
                          style={videoEmptyButton}
                        >
                          영상추가
                        </Link>
                      )}

                      <form action={deletePrize} style={buttonForm}>
                        <input type="hidden" name="event_id" value={eventId} />
                        <input type="hidden" name="prize_id" value={prize.id} />
                        <button type="submit" style={deleteButton}>
                          삭제
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f3f4f6",
  padding: 24,
  color: "#111827",
};

const card: React.CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: 28,
  padding: 28,
  boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
};

const top: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start",
};

const topActions: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const eyebrow: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 950,
  color: "#16a34a",
};

const title: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: 34,
  fontWeight: 950,
  letterSpacing: "-0.04em",
};

const desc: React.CSSProperties = {
  margin: "10px 0 0",
  fontSize: 16,
  lineHeight: 1.6,
  color: "#4b5563",
  fontWeight: 800,
};

const darkButton: React.CSSProperties = {
  padding: "13px 17px",
  borderRadius: 15,
  background: "#111827",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const greenButton: React.CSSProperties = {
  ...darkButton,
  background: "#16a34a",
};

const eventBox: React.CSSProperties = {
  marginTop: 22,
  padding: 20,
  borderRadius: 22,
  background: "#f9fafb",
};

const statusBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 12px",
  borderRadius: 999,
  background: "#dcfce7",
  color: "#166534",
  fontSize: 13,
  fontWeight: 950,
};

const eventTitle: React.CSSProperties = {
  margin: "12px 0 0",
  fontSize: 24,
  fontWeight: 950,
};

const eventIdText: React.CSSProperties = {
  marginTop: 10,
  fontSize: 12,
  color: "#6b7280",
};

const actionRow: React.CSSProperties = {
  marginTop: 20,
  display: "flex",
  justifyContent: "flex-end",
};

const addButton: React.CSSProperties = {
  minHeight: 54,
  padding: "0 24px",
  borderRadius: 18,
  background: "#16a34a",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: 18,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const section: React.CSSProperties = {
  marginTop: 20,
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 20,
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: 22,
  fontWeight: 950,
};

const errorBox: React.CSSProperties = {
  marginTop: 14,
  padding: 15,
  borderRadius: 16,
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 900,
};

const emptyBox: React.CSSProperties = {
  padding: 34,
  borderRadius: 18,
  background: "#f9fafb",
  textAlign: "center",
  fontSize: 16,
  lineHeight: 1.7,
  fontWeight: 900,
  color: "#4b5563",
};

const prizeList: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const prizeCard: React.CSSProperties = {
  borderRadius: 22,
  padding: 18,
  background: "#ffffff",
  boxShadow: "0 10px 28px rgba(0,0,0,0.05)",
};

const prizeMain: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  gap: 18,
  alignItems: "center",
};

const thumbBox: React.CSSProperties = {
  width: 180,
  height: 132,
};

const thumb: React.CSSProperties = {
  width: 180,
  height: 132,
  objectFit: "contain",
  borderRadius: 16,
  background: "#f9fafb",
};

const noThumb: React.CSSProperties = {
  width: 180,
  height: 132,
  borderRadius: 16,
  background: "#f3f4f6",
  color: "#6b7280",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
};

const info: React.CSSProperties = {
  minWidth: 0,
};

const badgeRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const smallBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 999,
  background: "#ecfdf5",
  color: "#166534",
  fontSize: 12,
  fontWeight: 950,
};

const videoBadge: React.CSSProperties = {
  ...smallBadge,
  background: "#dbeafe",
  color: "#1d4ed8",
};

const onAirBadge: React.CSSProperties = {
  ...smallBadge,
  background: "#dc2626",
  color: "#ffffff",
};

const prizeTitle: React.CSSProperties = {
  margin: "12px 0 0",
  fontSize: 26,
  fontWeight: 950,
  letterSpacing: "-0.04em",
};

const prizeDesc: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#4b5563",
  fontSize: 15,
  lineHeight: 1.5,
  fontWeight: 800,
};

const metaGrid: React.CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
};

const buttonRow: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "1.3fr 1fr 1fr 1fr",
  gap: 10,
};

const buttonForm: React.CSSProperties = {
  margin: 0,
};

const broadcastButton: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  border: "none",
  borderRadius: 16,
  background: "#16a34a",
  color: "#ffffff",
  fontSize: 17,
  fontWeight: 950,
  cursor: "pointer",
};

const currentButton: React.CSSProperties = {
  ...broadcastButton,
  background: "#dc2626",
};

const editButton: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  borderRadius: 16,
  background: "#2563eb",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: 17,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const videoButton: React.CSSProperties = {
  ...editButton,
  background: "#7c3aed",
};

const videoEmptyButton: React.CSSProperties = {
  ...editButton,
  background: "#64748b",
};

const deleteButton: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  border: "none",
  borderRadius: 16,
  background: "#fee2e2",
  color: "#991b1b",
  fontSize: 17,
  fontWeight: 950,
  cursor: "pointer",
};