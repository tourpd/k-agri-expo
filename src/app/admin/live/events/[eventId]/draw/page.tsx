import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import AdminDrawButton from "@/components/live/AdminDrawButton";

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
};

type LivePrize = {
  id: string;
  title?: string | null;
  quantity?: number | null;
};

type Participant = {
  id: string;
  name?: string | null;
  phone?: string | null;
  region?: string | null;
  crop?: string | null;
  farm_size?: string | null;
  is_drawn?: boolean | null;
  confirmed_winner?: boolean | null;
  draw_number?: number | null;
  created_at?: string | null;
};

async function drawWinner(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const event_id = String(formData.get("event_id") || "").trim();

  if (!event_id) {
    throw new Error("event_id 없음");
  }

  const { data: candidates, error } = await supabase
    .from("live_participants")
    .select("*")
    .eq("event_id", event_id)
    .eq("is_eligible", true)
    .neq("is_drawn", true);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (candidates || []) as Participant[];

  if (rows.length === 0) {
    redirect(`/admin/live/events/${event_id}/draw`);
  }

  const randomIndex = Math.floor(Math.random() * rows.length);
  const picked = rows[randomIndex];

  const drawNumber = Date.now();

  const { error: updateError } = await supabase
    .from("live_participants")
    .update({
      is_drawn: true,
      drawn_at: new Date().toISOString(),
      draw_number: drawNumber,
      call_status: "pending",
    })
    .eq("id", picked.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  redirect(`/admin/live/events/${event_id}/draw`);
}

async function resetParticipant(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const participant_id = String(formData.get("participant_id") || "").trim();
  const event_id = String(formData.get("event_id") || "").trim();

  await supabase
    .from("live_participants")
    .update({
      is_drawn: false,
      confirmed_winner: false,
      draw_number: null,
      drawn_at: null,
      confirmed_at: null,
      call_status: null,
    })
    .eq("id", participant_id);

  redirect(`/admin/live/events/${event_id}/draw`);
}

async function confirmWinner(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const participant_id = String(formData.get("participant_id") || "").trim();
  const event_id = String(formData.get("event_id") || "").trim();

  await supabase
    .from("live_participants")
    .update({
      confirmed_winner: true,
      confirmed_at: new Date().toISOString(),
      call_status: "confirmed",
    })
    .eq("id", participant_id);

  redirect(`/admin/live/events/${event_id}/draw`);
}

async function deleteEvent(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const event_id = String(formData.get("event_id") || "").trim();

  if (!event_id) {
    throw new Error("event_id 없음");
  }

  await supabase
    .from("live_events")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
    })
    .eq("id", event_id);

  redirect("/admin/live/events");
}

function statusText(status?: string | null) {
  if (status === "live") return "진행중";
  if (status === "ready") return "준비중";
  if (status === "ended") return "종료";
  return "미설정";
}

export default async function AdminLiveDrawPage({
  params,
}: PageProps) {
  const { eventId } = await params;

  const supabase = createSupabaseAdminClient();

  const { data: event } = await supabase
    .from("live_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle<LiveEvent>();

  const { data: prizes } = await supabase
    .from("live_prizes")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .is("deleted_at", null);

  const { data: participants, error: participantError } =
    await supabase
      .from("live_participants")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

  const participantRows = (participants || []) as Participant[];
  const prizeRows = (prizes || []) as LivePrize[];

  const available = participantRows.filter(
    (v) => !v.is_drawn
  );

  const drawn = participantRows.filter(
    (v) => v.is_drawn
  );

  const currentWinner =
    drawn.length > 0 ? drawn[0] : null;

  return (
    <main style={wrap}>
      <section style={header}>
        <div>
          <div style={eyebrow}>K-Agri Live Admin</div>
          <h1 style={title}>🎲 라이브 추첨 콘솔</h1>

          <p style={desc}>
            방송 중 참여자 중에서 무작위로 추첨하고,
            전화 연결 상태와 당첨 확정을 관리합니다.
          </p>
        </div>

        <div style={topButtons}>
          <Link
            href="/admin/live/events"
            style={darkButton}
          >
            ← 이벤트 목록
          </Link>

          <Link
            href={`/admin/live/events/${eventId}/prizes`}
            style={greenButton}
          >
            경품 관리 →
          </Link>
        </div>
      </section>

      {participantError ? (
        <div style={errorBox}>
          참여자 조회 오류:
          {participantError.message}
        </div>
      ) : null}

      <section style={eventBox}>
        <div style={statusBadge}>
          {statusText(event?.status)}
        </div>

        <h2 style={eventTitle}>
          {event?.title || "이벤트 없음"}
        </h2>

        <p style={eventIdText}>
          event_id: {eventId}
        </p>
      </section>

      <section style={summaryGrid}>
        <div style={summaryCard}>
          <span>전체 참여자</span>
          <strong>{participantRows.length}</strong>
        </div>

        <div style={summaryCard}>
          <span>추첨 가능</span>
          <strong>{available.length}</strong>
        </div>

        <div style={summaryCard}>
          <span>이미 추첨</span>
          <strong>{drawn.length}</strong>
        </div>

        <div style={summaryCard}>
          <span>확정 당첨</span>
          <strong>
            {
              participantRows.filter(
                (v) => v.confirmed_winner
              ).length
            }
          </strong>
        </div>
      </section>

      <section style={card}>
        <h2 style={sectionTitle}>
          ① 방송 추첨
        </h2>

        <div style={prizeBox}>
          <b>등록 경품</b>

          <div style={prizeList}>
            {prizeRows.map((prize) => (
              <div
                key={prize.id}
                style={prizeBadge}
              >
                🎁 {prize.title} {prize.quantity}명
              </div>
            ))}
          </div>
        </div>

        <AdminDrawButton eventId={eventId} prizeId={prizeRows[0]?.id || null} />

        {available.length === 0 ? (
          <div style={warnBox}>
            현재 추첨 가능한 후보가 없습니다.
          </div>
        ) : null}
      </section>

      <section style={card}>
        <h2 style={sectionTitle}>
          ② 현재 당첨 후보
        </h2>

        {!currentWinner ? (
          <div style={emptyBox}>
            아직 추첨된 사람이 없습니다.
          </div>
        ) : (
          <article style={winnerCard}>
            <div style={winnerName}>
              {currentWinner.name || "이름없음"}
            </div>

            <div style={winnerPhone}>
              {currentWinner.phone || "-"}
            </div>

            <div style={metaGrid}>
              <div>
                <span>지역</span>
                <b>{currentWinner.region || "-"}</b>
              </div>

              <div>
                <span>작물</span>
                <b>{currentWinner.crop || "-"}</b>
              </div>

              <div>
                <span>재배면적</span>
                <b>{currentWinner.farm_size || "-"}</b>
              </div>
            </div>

            <div style={actionGrid}>
              <form action={confirmWinner}>
                <input
                  type="hidden"
                  name="participant_id"
                  value={currentWinner.id}
                />

                <input
                  type="hidden"
                  name="event_id"
                  value={eventId}
                />

                <button
                  type="submit"
                  style={confirmButton}
                >
                  ✅ 당첨 확정
                </button>
              </form>

              <form action={resetParticipant}>
                <input
                  type="hidden"
                  name="participant_id"
                  value={currentWinner.id}
                />

                <input
                  type="hidden"
                  name="event_id"
                  value={eventId}
                />

                <button
                  type="submit"
                  style={resetButton}
                >
                  🔄 다시 추첨
                </button>
              </form>
            </div>
          </article>
        )}
      </section>

      <section style={card}>
        <h2 style={sectionTitle}>
          ③ 참여자 후보 목록
        </h2>

        {participantRows.length === 0 ? (
          <div style={emptyBox}>
            참여자가 아직 없습니다.
          </div>
        ) : (
          <div style={participantList}>
            {participantRows.map((p) => (
              <div
                key={p.id}
                style={participantCard}
              >
                <div>
                  <b>{p.name || "이름없음"}</b>
                  <p style={smallText}>
                    {p.phone || "-"}
                  </p>
                </div>

                <div style={smallText}>
                  {p.region || "-"} /{" "}
                  {p.crop || "-"}
                </div>

                <div>
                  {p.is_drawn ? "추첨됨" : "대기중"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={card}>
        <h2 style={sectionTitle}>
          ④ 이벤트 종료/삭제
        </h2>

        <form action={deleteEvent}>
          <input
            type="hidden"
            name="event_id"
            value={eventId}
          />

          <button
            type="submit"
            style={deleteButton}
          >
            🗑 이벤트 종료 및 숨김처리
          </button>
        </form>
      </section>
    </main>
  );
}

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "#e5e7eb",
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
  color: "#111827",
  boxShadow: "0 18px 45px rgba(15,23,42,0.10)",
};

const eyebrow: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 950,
  color: "#15803d",
};

const title: React.CSSProperties = {
  fontSize: 38,
  lineHeight: 1.15,
  fontWeight: 950,
  margin: "8px 0 0",
  color: "#111827",
  letterSpacing: "-0.04em",
};

const desc: React.CSSProperties = {
  marginTop: 10,
  color: "#374151",
  fontSize: 16,
  lineHeight: 1.65,
  fontWeight: 800,
};

const topButtons: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const darkButton: React.CSSProperties = {
  background: "#111827",
  color: "#ffffff",
  padding: "15px 20px",
  borderRadius: 16,
  textDecoration: "none",
  fontWeight: 950,
  fontSize: 16,
  minHeight: 54,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const greenButton: React.CSSProperties = {
  ...darkButton,
  background: "#16a34a",
};

const eventBox: React.CSSProperties = {
  maxWidth: 1120,
  margin: "18px auto 0",
  background: "#ffffff",
  borderRadius: 24,
  padding: 26,
  color: "#111827",
  boxShadow: "0 10px 28px rgba(15,23,42,0.07)",
};

const statusBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: 999,
  background: "#dcfce7",
  color: "#166534",
  fontSize: 14,
  fontWeight: 950,
};

const eventTitle: React.CSSProperties = {
  margin: "16px 0 0",
  fontSize: 34,
  lineHeight: 1.18,
  fontWeight: 950,
  color: "#111827",
  letterSpacing: "-0.04em",
};

const eventIdText: React.CSSProperties = {
  marginTop: 14,
  color: "#4b5563",
  fontSize: 13,
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
  padding: 22,
  display: "grid",
  gap: 8,
  color: "#111827",
  boxShadow: "0 10px 25px rgba(15,23,42,0.07)",
  border: "1px solid #e5e7eb",
};

const card: React.CSSProperties = {
  maxWidth: 1120,
  margin: "18px auto 0",
  background: "#ffffff",
  borderRadius: 26,
  padding: 26,
  color: "#111827",
  boxShadow: "0 18px 45px rgba(15,23,42,0.09)",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 18px",
  fontSize: 28,
  lineHeight: 1.25,
  fontWeight: 950,
  color: "#111827",
  letterSpacing: "-0.03em",
};

const prizeBox: React.CSSProperties = {
  background: "#f9fafb",
  borderRadius: 20,
  padding: 20,
  color: "#111827",
  border: "1px solid #e5e7eb",
};

const prizeList: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 12,
};

const prizeBadge: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  background: "#dcfce7",
  color: "#166534",
  fontSize: 15,
  fontWeight: 950,
  border: "1px solid #bbf7d0",
};

const drawButton: React.CSSProperties = {
  marginTop: 18,
  width: "100%",
  minHeight: 76,
  border: "none",
  borderRadius: 20,
  background: "#16a34a",
  color: "#ffffff",
  fontSize: 26,
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(22,163,74,0.25)",
};

const warnBox: React.CSSProperties = {
  marginTop: 16,
  background: "#fff7ed",
  color: "#9a3412",
  padding: 18,
  borderRadius: 16,
  fontSize: 16,
  lineHeight: 1.6,
  fontWeight: 950,
  border: "1px solid #fed7aa",
};

const winnerCard: React.CSSProperties = {
  border: "3px solid #16a34a",
  borderRadius: 24,
  padding: 28,
  background: "linear-gradient(135deg,#052e16,#166534)",
  color: "#ffffff",
  boxShadow: "0 18px 40px rgba(22,101,52,0.28)",
};

const winnerName: React.CSSProperties = {
  fontSize: 52,
  lineHeight: 1.1,
  fontWeight: 950,
  color: "#ffffff",
  letterSpacing: "-0.04em",
};

const winnerPhone: React.CSSProperties = {
  marginTop: 12,
  fontSize: 32,
  lineHeight: 1.2,
  fontWeight: 950,
  color: "#facc15",
};

const metaGrid: React.CSSProperties = {
  marginTop: 20,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
  color: "#111827",
};

const actionGrid: React.CSSProperties = {
  marginTop: 24,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const confirmButton: React.CSSProperties = {
  width: "100%",
  minHeight: 62,
  border: "none",
  borderRadius: 18,
  background: "#16a34a",
  color: "#ffffff",
  fontSize: 22,
  fontWeight: 950,
  cursor: "pointer",
};

const resetButton: React.CSSProperties = {
  width: "100%",
  minHeight: 62,
  border: "none",
  borderRadius: 18,
  background: "#fee2e2",
  color: "#991b1b",
  fontSize: 22,
  fontWeight: 950,
  cursor: "pointer",
};

const participantList: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const participantCard: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 18,
  padding: 18,
  background: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  color: "#111827",
  fontSize: 15,
  fontWeight: 850,
};

const emptyBox: React.CSSProperties = {
  padding: 42,
  borderRadius: 20,
  background: "#f9fafb",
  textAlign: "center",
  fontSize: 18,
  lineHeight: 1.7,
  fontWeight: 950,
  color: "#111827",
  border: "1px solid #e5e7eb",
};

const smallText: React.CSSProperties = {
  color: "#374151",
  fontSize: 14,
  fontWeight: 800,
};

const deleteButton: React.CSSProperties = {
  width: "100%",
  minHeight: 68,
  border: "none",
  borderRadius: 20,
  background: "#dc2626",
  color: "#ffffff",
  fontSize: 24,
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(220,38,38,0.22)",
};

const errorBox: React.CSSProperties = {
  maxWidth: 1120,
  margin: "18px auto 0",
  background: "#fee2e2",
  color: "#991b1b",
  padding: 18,
  borderRadius: 18,
  fontSize: 16,
  lineHeight: 1.6,
  fontWeight: 950,
  border: "1px solid #fecaca",
};