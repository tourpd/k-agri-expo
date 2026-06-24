import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ eventId: string }>;
};

async function updateEvent(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const event_id = String(formData.get("event_id") || "").trim();

  if (!event_id) {
    throw new Error("event_id가 없습니다.");
  }

  const { error } = await supabase
    .from("live_events")
    .update({
      title: String(formData.get("title") || "").trim() || null,
      description: String(formData.get("description") || "").trim() || null,
      start_at: String(formData.get("start_at") || "").trim() || null,
      end_at: String(formData.get("end_at") || "").trim() || null,
    })
    .eq("id", event_id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/live/events");
}

export default async function EditLiveEventPage({ params }: PageProps) {
  const { eventId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: event, error } = await supabase
    .from("live_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    return (
      <main style={wrap}>
        <section style={card}>
          <h1 style={title}>이벤트를 찾을 수 없습니다</h1>
          <pre>{error?.message || eventId}</pre>
          <Link href="/admin/live/events" style={backButton}>
            ← 이벤트 목록
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <section style={card}>
        <div style={top}>
          <div>
            <div style={eyebrow}>K-Agri Live Admin</div>
            <h1 style={title}>문구 수정</h1>
            <p style={desc}>이벤트 제목, 설명, 시작/종료 시간을 수정합니다.</p>
          </div>

          <Link href="/admin/live/events" style={backButton}>
            ← 목록
          </Link>
        </div>

        <form action={updateEvent} style={form}>
          <input type="hidden" name="event_id" value={eventId} />

          <label style={label}>
            이벤트 제목
            <input name="title" defaultValue={event.title || ""} style={input} />
          </label>

          <label style={label}>
            이벤트 설명
            <textarea
              name="description"
              defaultValue={event.description || ""}
              style={textarea}
            />
          </label>

          <div style={grid2}>
            <label style={label}>
              시작 시간
              <input
                name="start_at"
                type="datetime-local"
                defaultValue={toDateTimeLocal(event.start_at)}
                style={input}
              />
            </label>

            <label style={label}>
              종료 시간
              <input
                name="end_at"
                type="datetime-local"
                defaultValue={toDateTimeLocal(event.end_at)}
                style={input}
              />
            </label>
          </div>

          <button type="submit" style={saveButton}>
            저장하기
          </button>
        </form>
      </section>
    </main>
  );
}

function toDateTimeLocal(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f3f4f6",
  padding: 24,
  color: "#111827",
};

const card: React.CSSProperties = {
  maxWidth: 860,
  margin: "0 auto",
  background: "#fff",
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

const eyebrow: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 950,
  color: "#16a34a",
};

const title: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: 36,
  fontWeight: 950,
};

const desc: React.CSSProperties = {
  marginTop: 10,
  color: "#4b5563",
  fontWeight: 800,
};

const backButton: React.CSSProperties = {
  padding: "13px 18px",
  borderRadius: 14,
  background: "#111827",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
};

const form: React.CSSProperties = {
  marginTop: 26,
  display: "grid",
  gap: 16,
};

const label: React.CSSProperties = {
  display: "grid",
  gap: 8,
  fontWeight: 900,
};

const input: React.CSSProperties = {
  width: "100%",
  height: 56,
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: "0 14px",
  fontSize: 16,
  fontWeight: 800,
  boxSizing: "border-box",
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 130,
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: 14,
  fontSize: 16,
  fontWeight: 800,
  boxSizing: "border-box",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const saveButton: React.CSSProperties = {
  width: "100%",
  minHeight: 64,
  border: "none",
  borderRadius: 18,
  background: "#16a34a",
  color: "#fff",
  fontSize: 20,
  fontWeight: 950,
  cursor: "pointer",
};