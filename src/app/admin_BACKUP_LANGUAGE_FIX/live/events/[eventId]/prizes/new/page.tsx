import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ eventId: string }>;
};

async function uploadPrizeImage(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  file: File | null
) {
  if (!file || file.size <= 0) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";

  const filePath = `live-prizes/${eventId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("expo-assets")
    .upload(filePath, buffer, {
      contentType: file.type || "image/png",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("expo-assets").getPublicUrl(filePath);

  return data.publicUrl;
}

async function createPrize(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const event_id = String(formData.get("event_id") || "").trim();
  const title = String(formData.get("title") || "").trim();

  if (!event_id) {
    throw new Error("event_id 없음");
  }

  if (!title) {
    throw new Error("경품명은 필수");
  }

  const imageFile = formData.get("image_file") as File | null;

  const image_url = await uploadPrizeImage(
    supabase,
    event_id,
    imageFile
  );

  const quantity = Math.max(
    1,
    Number(String(formData.get("quantity") || "1"))
  );

  const { error } = await supabase.from("live_prizes").insert({
    event_id,

    title,

    sponsor:
      String(formData.get("sponsor") || "").trim() || null,

    description:
      String(formData.get("description") || "").trim() || null,

    preview_note:
      String(formData.get("preview_note") || "").trim() || null,

    image_url,

    video_url:
      String(formData.get("video_url") || "").trim() || null,

    media_mode:
      String(formData.get("media_mode") || "image").trim(),

    event_label:
      String(formData.get("event_label") || "메인 이벤트").trim(),

    headline:
      String(formData.get("headline") || "").trim() || null,

    subheadline:
      String(formData.get("subheadline") || "").trim() || null,

    winner_note:
      String(formData.get("winner_note") || "").trim() ||
      "방송 중 전화 확인 후 최종 당첨 확정",

    number_font_size: Math.max(
      80,
      Number(String(formData.get("number_font_size") || "150"))
    ),

    name_font_size: Math.max(
      36,
      Number(String(formData.get("name_font_size") || "68"))
    ),

    note_font_size: Math.max(
      24,
      Number(String(formData.get("note_font_size") || "36"))
    ),

    product_price:
      String(formData.get("product_price") || "").trim() || null,

    product_cta:
      String(formData.get("product_cta") || "").trim() || null,

    category:
      String(formData.get("category") || "").trim() || null,

    display_group:
      String(formData.get("display_group") || "big").trim(),

    draw_type:
      String(formData.get("draw_type") || "main").trim(),

    quantity,
    total_winners: quantity,

    sort_order: Math.max(
      1,
      Number(String(formData.get("sort_order") || "1"))
    ),

    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/admin/live/events/${event_id}/prizes`);
}

export default async function NewPrizePage({
  params,
}: PageProps) {
  const { eventId } = await params;

  return (
    <main style={wrap}>
      <section style={card}>
        <div style={top}>
          <div>
            <div style={eyebrow}>
              K-Agri LIVE
            </div>

            <h1 style={title}>
              + 새 경품 등록
            </h1>

            <p style={desc}>
              방송에 사용할 경품을 등록합니다.
            </p>
          </div>

          <Link
            href={`/admin/live/events/${eventId}/prizes`}
            style={backButton}
          >
            ← 경품 목록
          </Link>
        </div>

        <form action={createPrize} style={form}>
          <input
            type="hidden"
            name="event_id"
            value={eventId}
          />

          <label style={label}>
            경품명
            <input
              name="title"
              required
              placeholder="예: 영진로타리 역회전 로타리"
              style={input}
            />
          </label>

          <div style={grid2}>
            <label style={label}>
              협찬사
              <input
                name="sponsor"
                placeholder="예: 영진로타리"
                style={input}
              />
            </label>

            <label style={label}>
              이벤트 표시명
              <input
                name="event_label"
                defaultValue="메인 이벤트"
                style={input}
              />
            </label>
          </div>

          <label style={label}>
            방송 제목
            <input
              name="headline"
              placeholder="예: 신개념 역회전 로타리 출시"
              style={input}
            />
          </label>

          <label style={label}>
            방송 보조 문구
            <input
              name="subheadline"
              placeholder="예: 강력한 쇄토력과 작업시간 단축"
              style={input}
            />
          </label>

          <section style={box}>
            <h3 style={miniTitle}>
              📺 방송 미디어
            </h3>

            <label style={label}>
              제품 이미지
              <input
                type="file"
                name="image_file"
                accept="image/png,image/jpeg,image/webp"
                style={fileInput}
              />
            </label>

            <label style={label}>
              유튜브 영상 URL
              <input
                name="video_url"
                placeholder="https://youtu.be/xxxx"
                style={input}
              />
            </label>

            <label style={label}>
              방송 표시 방식
              <select
                name="media_mode"
                defaultValue="image"
                style={input}
              >
                <option value="image">
                  이미지만 표시
                </option>

                <option value="video">
                  영상만 표시
                </option>

                <option value="both">
                  이미지 + 영상
                </option>

                <option value="none">
                  문구만 표시
                </option>
              </select>
            </label>
          </section>

          <section style={box}>
            <h3 style={miniTitle}>
              🔢 당첨 표시 설정
            </h3>

            <label style={label}>
              당첨 안내문구
              <input
                name="winner_note"
                defaultValue="방송 중 전화 확인 후 최종 당첨 확정"
                style={input}
              />
            </label>

            <div style={grid3}>
              <label style={label}>
                번호 글자크기
                <input
                  type="number"
                  name="number_font_size"
                  defaultValue={150}
                  style={input}
                />
              </label>

              <label style={label}>
                이름 글자크기
                <input
                  type="number"
                  name="name_font_size"
                  defaultValue={68}
                  style={input}
                />
              </label>

              <label style={label}>
                안내문구 크기
                <input
                  type="number"
                  name="note_font_size"
                  defaultValue={36}
                  style={input}
                />
              </label>
            </div>
          </section>

          <label style={label}>
            경품 설명
            <textarea
              name="description"
              style={textarea}
            />
          </label>

          <div style={grid2}>
            <label style={label}>
              경품 수량
              <input
                type="number"
                name="quantity"
                defaultValue={1}
                min={1}
                style={input}
              />
            </label>

            <label style={label}>
              카테고리
              <input
                name="category"
                placeholder="예: 농기계"
                style={input}
              />
            </label>
          </div>

          <button type="submit" style={submitButton}>
            + 경품 등록하기
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
};

const card: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  background: "#fff",
  borderRadius: 28,
  padding: 28,
};

const top: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const eyebrow: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: "#16a34a",
};

const title: React.CSSProperties = {
  margin: "10px 0 0",
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
  marginTop: 24,
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
  minHeight: 120,
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: 14,
  fontSize: 16,
  fontWeight: 800,
  boxSizing: "border-box",
};

const fileInput: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: 14,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 12,
};

const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: 12,
};

const box: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 14,
};

const miniTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 950,
};

const submitButton: React.CSSProperties = {
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