import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

async function createLiveEvent(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const status = String(formData.get("status") || "ready").trim();
  const startRaw = String(formData.get("start_at") || "").trim();
  const endRaw = String(formData.get("end_at") || "").trim();

  if (!title) {
    throw new Error("이벤트 제목은 필수입니다.");
  }

  const start_at = startRaw ? new Date(startRaw).toISOString() : null;
  const end_at = endRaw ? new Date(endRaw).toISOString() : null;

  const locked_at = status === "live" ? new Date().toISOString() : null;
  const ended_at = status === "ended" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("live_events")
    .insert({
      title,
      description: description || null,
      status,
      start_at,
      end_at,
      locked_at,
      ended_at,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/admin/live/events/${data.id}/prizes`);
}

export default function AdminLiveEventNewPage() {
  return (
    <main style={wrap}>
      <section style={card}>
        <div style={top}>
          <div>
            <div style={eyebrow}>K-Agri Live Admin</div>
            <h1 style={title}>+ 새 라이브 이벤트 만들기</h1>
            <p style={desc}>
              먼저 방송 회차를 만들고, 다음 화면에서 경품을 등록합니다.
            </p>
          </div>

          <Link href="/admin/live/events" style={backButton}>
            ← 이벤트 목록
          </Link>
        </div>

        <form action={createLiveEvent} style={form}>
          <section style={section}>
            <h2 style={sectionTitle}>① 이벤트 기본 정보</h2>

            <label style={label}>
              이벤트 제목 <b style={required}>*</b>
              <input
                name="title"
                required
                placeholder="예: K-Agri Expo LIVE 경품 추첨"
                style={input}
              />
            </label>

            <label style={label}>
              이벤트 설명
              <textarea
                name="description"
                placeholder="예: 방송 참여 농민 대상 라이브 경품 추첨 이벤트입니다."
                style={textarea}
              />
            </label>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>② 이벤트 상태</h2>

            <div style={statusGrid}>
              <label style={radioCard}>
                <input type="radio" name="status" value="ready" defaultChecked />
                <strong>준비중</strong>
                <span>경품 등록과 테스트 중</span>
              </label>

              <label style={radioCard}>
                <input type="radio" name="status" value="live" />
                <strong>진행중</strong>
                <span>방송 송출 및 추첨 진행</span>
              </label>

              <label style={radioCard}>
                <input type="radio" name="status" value="ended" />
                <strong>종료</strong>
                <span>끝난 이벤트 보관</span>
              </label>
            </div>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>③ 일정</h2>

            <div style={dateGrid}>
              <label style={label}>
                시작일시
                <input name="start_at" type="datetime-local" style={input} />
              </label>

              <label style={label}>
                종료일시
                <input name="end_at" type="datetime-local" style={input} />
              </label>
            </div>

            <div style={helpBox}>
              일정은 비워도 됩니다. 방송 당일에는 상태를 “진행중”으로 바꾸고,
              경품 목록에서 “방송에 띄우기” 버튼으로 현재 경품을 선택합니다.
            </div>
          </section>

          <button type="submit" style={submitButton}>
            이벤트 만들고 경품 등록으로 이동
          </button>
        </form>
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
  maxWidth: 880,
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

const backButton: React.CSSProperties = {
  padding: "13px 17px",
  borderRadius: 15,
  background: "#111827",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 950,
};

const form: React.CSSProperties = {
  marginTop: 24,
  display: "grid",
  gap: 18,
};

const section: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 20,
  background: "#ffffff",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: 21,
  fontWeight: 950,
};

const label: React.CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 14,
  fontSize: 15,
  fontWeight: 950,
};

const required: React.CSSProperties = {
  color: "#dc2626",
};

const input: React.CSSProperties = {
  width: "100%",
  height: 56,
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: "0 15px",
  fontSize: 16,
  fontWeight: 800,
  outline: "none",
  boxSizing: "border-box",
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 130,
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: 15,
  fontSize: 16,
  fontWeight: 800,
  lineHeight: 1.6,
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
};

const statusGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

const radioCard: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 8,
  cursor: "pointer",
  background: "#f9fafb",
};

const dateGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const helpBox: React.CSSProperties = {
  marginTop: 16,
  padding: 15,
  borderRadius: 16,
  background: "#ecfdf5",
  color: "#166534",
  fontSize: 14,
  lineHeight: 1.7,
  fontWeight: 850,
};

const submitButton: React.CSSProperties = {
  width: "100%",
  minHeight: 64,
  border: "none",
  borderRadius: 18,
  background: "#16a34a",
  color: "#ffffff",
  fontSize: 20,
  fontWeight: 950,
  cursor: "pointer",
};