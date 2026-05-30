import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type LiveEventRow = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string | null;
  locked_at: string | null;
  ended_at: string | null;
};

async function setEventStatus(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const event_id = String(formData.get("event_id") || "").trim();
  const next_status = String(formData.get("next_status") || "").trim();

  if (!event_id) throw new Error("event_id가 없습니다.");
  if (!["ready", "live", "ended"].includes(next_status)) {
    throw new Error("잘못된 상태값입니다.");
  }

  const patch: Record<string, any> = {
    status: next_status,
  };

  if (next_status === "live") {
    patch.locked_at = new Date().toISOString();
    patch.ended_at = null;
  }

  if (next_status === "ready") {
    patch.locked_at = null;
    patch.ended_at = null;
  }

  if (next_status === "ended") {
    patch.ended_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("live_events")
    .update(patch)
    .eq("id", event_id);

  if (error) throw new Error(error.message);

  redirect("/admin/live/events");
}

async function deleteEvent(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const event_id = String(formData.get("event_id") || "").trim();

  if (!event_id) throw new Error("event_id가 없습니다.");

  await supabase.from("live_draw_logs").delete().eq("event_id", event_id);
  await supabase.from("live_prize_winners").delete().eq("event_id", event_id);
  await supabase.from("live_winners").delete().eq("event_id", event_id);
  await supabase.from("live_product_leads").delete().eq("event_id", event_id);
  await supabase.from("live_sessions").delete().eq("event_id", event_id);
  await supabase.from("live_participants").delete().eq("event_id", event_id);
  await supabase.from("live_prizes").delete().eq("event_id", event_id);

  const { error } = await supabase
    .from("live_events")
    .delete()
    .eq("id", event_id);

  if (error) throw new Error(error.message);

  redirect("/admin/live/events");
}

function statusLabel(status?: string | null) {
  if (status === "live") return "진행중";
  if (status === "ready") return "준비중";
  if (status === "ended") return "종료";
  return "미설정";
}

function statusStyle(status?: string | null) {
  if (status === "live") return { background: "#dcfce7", color: "#166534" };
  if (status === "ready") return { background: "#fef3c7", color: "#92400e" };
  if (status === "ended") return { background: "#e5e7eb", color: "#374151" };
  return { background: "#fee2e2", color: "#991b1b" };
}

function formatDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminLiveEventsPage() {
  const supabase = createSupabaseAdminClient();

  const { data: events, error } = await supabase
    .from("live_events")
    .select("*")
    .order("created_at", { ascending: false });

  const eventRows = (events || []) as LiveEventRow[];
  const activeRows = eventRows.filter((e) => e.status !== "ended");
  const endedRows = eventRows.filter((e) => e.status === "ended");

  return (
    <main style={wrap}>
      <section style={header}>
        <div>
          <div style={eyebrow}>K-Agri Live Admin</div>
          <h1 style={title}>🔥 라이브 이벤트 관리센터</h1>
          <p style={desc}>
            여러 개의 라이브 경품 이벤트를 만들고, 진행중/준비중/종료 상태를 관리합니다.
          </p>
        </div>

        <Link href="/admin/live/events/new" style={newButton}>
          + 새 이벤트 만들기
        </Link>
      </section>

      {error ? (
        <section style={errorBox}>
          <b>이벤트 목록을 불러오지 못했습니다.</b>
          <span>{error.message}</span>
        </section>
      ) : null}

      <section style={summaryGrid}>
        <div style={summaryCard}>
          <span>전체 이벤트</span>
          <strong>{eventRows.length}</strong>
        </div>
        <div style={summaryCard}>
          <span>진행중</span>
          <strong>{eventRows.filter((e) => e.status === "live").length}</strong>
        </div>
        <div style={summaryCard}>
          <span>준비중</span>
          <strong>{eventRows.filter((e) => e.status === "ready").length}</strong>
        </div>
        <div style={summaryCard}>
          <span>종료</span>
          <strong>{endedRows.length}</strong>
        </div>
      </section>

      <section style={card}>
        <div style={cardHead}>
          <h2 style={cardTitle}>운영 중 이벤트 목록</h2>
          <Link href="/admin/live" style={oldAdminButton}>
            기존 라이브 관리자 →
          </Link>
        </div>

        {activeRows.length === 0 ? (
          <div style={emptyBox}>
            현재 운영 중인 이벤트가 없습니다.
            <br />
            “새 이벤트 만들기”를 눌러 이벤트를 만드세요.
          </div>
        ) : (
          <div style={list}>
            {activeRows.map((event) => (
              <article key={event.id} style={eventCard}>
                <div style={eventTop}>
                  <div>
                    <div style={{ ...statusBadge, ...statusStyle(event.status) }}>
                      {statusLabel(event.status)}
                    </div>

                    <h3 style={eventTitle}>
                      {event.title || "제목 없는 이벤트"}
                    </h3>

                    <p style={eventDesc}>{event.description || "설명 없음"}</p>
                  </div>

                  <div style={dateBox}>
                    <span>생성일</span>
                    <b>{formatDate(event.created_at)}</b>
                  </div>
                </div>

                <div style={metaGrid}>
                  <div>
                    <span>시작</span>
                    <b>{formatDate(event.start_at)}</b>
                  </div>
                  <div>
                    <span>종료</span>
                    <b>{formatDate(event.end_at || event.ended_at)}</b>
                  </div>
                  <div>
                    <span>잠금/진행 기준</span>
                    <b>{formatDate(event.locked_at)}</b>
                  </div>
                </div>

                <div style={actions}>
                  <Link href={`/admin/live/events/${event.id}/edit`} style={actionButton}>
                    문구 수정
                  </Link>

                  <Link href={`/admin/live/events/${event.id}/prizes`} style={actionButtonGreen}>
                    경품 관리
                  </Link>

                  <Link href={`/admin/live/events/${event.id}/participants`} style={actionButtonBlue}>
                    참여자 보기
                  </Link>

                  <Link href={`/admin/live/events/${event.id}/draw`} style={actionButtonDark}>
                    추첨하기
                  </Link>
                </div>

                <div style={statusActions}>
                  {event.status !== "live" ? (
                    <form action={setEventStatus}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <input type="hidden" name="next_status" value="live" />
                      <button type="submit" style={liveButton}>
                        진행중으로 전환
                      </button>
                    </form>
                  ) : null}

                  {event.status !== "ready" ? (
                    <form action={setEventStatus}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <input type="hidden" name="next_status" value="ready" />
                      <button type="submit" style={readyButton}>
                        준비중으로 전환
                      </button>
                    </form>
                  ) : null}

                  <form action={setEventStatus}>
                    <input type="hidden" name="event_id" value={event.id} />
                    <input type="hidden" name="next_status" value="ended" />
                    <button type="submit" style={endButton}>
                      종료/목록 숨김
                    </button>
                  </form>
                </div>

                <div style={debugText}>event_id: {event.id}</div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={card}>
        <div style={cardHead}>
          <h2 style={cardTitle}>종료된 이벤트</h2>
          <span style={mutedText}>종료/숨김 처리된 이벤트입니다.</span>
        </div>

        {endedRows.length === 0 ? (
          <div style={emptyBox}>종료된 이벤트가 없습니다.</div>
        ) : (
          <div style={list}>
            {endedRows.map((event) => (
              <article key={event.id} style={endedCard}>
                <div style={{ ...statusBadge, ...statusStyle(event.status) }}>
                  {statusLabel(event.status)}
                </div>

                <h3 style={eventTitle}>{event.title || "제목 없는 이벤트"}</h3>
                <p style={eventDesc}>{event.description || "설명 없음"}</p>

                <div style={metaGrid}>
                  <div>
                    <span>생성</span>
                    <b>{formatDate(event.created_at)}</b>
                  </div>
                  <div>
                    <span>종료</span>
                    <b>{formatDate(event.ended_at || event.end_at)}</b>
                  </div>
                  <div>
                    <span>event_id</span>
                    <b>{event.id}</b>
                  </div>
                </div>

                <div style={endedActions}>
                  <form action={setEventStatus}>
                    <input type="hidden" name="event_id" value={event.id} />
                    <input type="hidden" name="next_status" value="ready" />
                    <button type="submit" style={readyButton}>
                      다시 준비중으로 복구
                    </button>
                  </form>

                  <form action={deleteEvent}>
                    <input type="hidden" name="event_id" value={event.id} />
                    <button type="submit" style={deleteButton}>
                      🗑 완전삭제
                    </button>
                  </form>
                </div>

                <div style={warningText}>
                  완전삭제를 누르면 해당 이벤트의 경품, 참여자, 당첨자, 추첨 기록이 함께 삭제됩니다.
                </div>
              </article>
            ))}
          </div>
        )}
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

const header: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: 28,
  padding: 28,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
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
  fontWeight: 800,
  color: "#4b5563",
};

const newButton: React.CSSProperties = {
  flex: "0 0 auto",
  padding: "16px 22px",
  background: "#16a34a",
  color: "#ffffff",
  borderRadius: 16,
  textDecoration: "none",
  fontSize: 17,
  fontWeight: 950,
};

const errorBox: React.CSSProperties = {
  maxWidth: 1120,
  margin: "18px auto 0",
  background: "#fee2e2",
  color: "#991b1b",
  borderRadius: 18,
  padding: 18,
  display: "grid",
  gap: 6,
  fontWeight: 800,
};

const summaryGrid: React.CSSProperties = {
  maxWidth: 1120,
  margin: "18px auto 0",
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 14,
};

const summaryCard: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 20,
  padding: 20,
  display: "grid",
  gap: 8,
  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
};

const card: React.CSSProperties = {
  maxWidth: 1120,
  margin: "18px auto 0",
  background: "#ffffff",
  borderRadius: 28,
  padding: 24,
  boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
};

const cardHead: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 18,
};

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 950,
};

const oldAdminButton: React.CSSProperties = {
  padding: "12px 15px",
  background: "#111827",
  color: "#ffffff",
  borderRadius: 14,
  textDecoration: "none",
  fontWeight: 900,
};

const emptyBox: React.CSSProperties = {
  padding: 40,
  borderRadius: 20,
  background: "#f9fafb",
  textAlign: "center",
  fontSize: 17,
  lineHeight: 1.7,
  fontWeight: 900,
  color: "#4b5563",
};

const list: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const eventCard: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 20,
  background: "#ffffff",
};

const endedCard: React.CSSProperties = {
  ...eventCard,
  background: "#f9fafb",
};

const eventTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
};

const statusBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 950,
};

const eventTitle: React.CSSProperties = {
  margin: "12px 0 0",
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: "-0.03em",
};

const eventDesc: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: 15,
  lineHeight: 1.6,
  color: "#4b5563",
  fontWeight: 750,
};

const dateBox: React.CSSProperties = {
  minWidth: 180,
  padding: 14,
  borderRadius: 16,
  background: "#f9fafb",
  display: "grid",
  gap: 4,
  fontSize: 13,
};

const metaGrid: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const actions: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
};

const actionButton: React.CSSProperties = {
  padding: "13px 12px",
  borderRadius: 14,
  background: "#f3f4f6",
  color: "#111827",
  textAlign: "center",
  textDecoration: "none",
  fontWeight: 950,
};

const actionButtonGreen: React.CSSProperties = {
  ...actionButton,
  background: "#dcfce7",
  color: "#166534",
};

const actionButtonBlue: React.CSSProperties = {
  ...actionButton,
  background: "#dbeafe",
  color: "#1d4ed8",
};

const actionButtonDark: React.CSSProperties = {
  ...actionButton,
  background: "#111827",
  color: "#ffffff",
};

const statusActions: React.CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const endedActions: React.CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const liveButton: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  border: "none",
  borderRadius: 14,
  background: "#16a34a",
  color: "#ffffff",
  fontWeight: 950,
  cursor: "pointer",
};

const readyButton: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  border: "none",
  borderRadius: 14,
  background: "#fef3c7",
  color: "#92400e",
  fontWeight: 950,
  cursor: "pointer",
};

const endButton: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  border: "none",
  borderRadius: 14,
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 950,
  cursor: "pointer",
};

const deleteButton: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  border: "none",
  borderRadius: 14,
  background: "#dc2626",
  color: "#ffffff",
  fontWeight: 950,
  cursor: "pointer",
};

const debugText: React.CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  color: "#6b7280",
};

const mutedText: React.CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
  fontWeight: 800,
};

const warningText: React.CSSProperties = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "#fff7ed",
  color: "#9a3412",
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 850,
};