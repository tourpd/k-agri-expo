import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    eventId: string;
    prizeId: string;
  }>;
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

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("expo-assets").getPublicUrl(filePath);

  return data.publicUrl;
}

async function updatePrize(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const event_id = String(formData.get("event_id") || "").trim();
  const prize_id = String(formData.get("prize_id") || "").trim();
  const current_image_url = String(formData.get("current_image_url") || "").trim();

  if (!event_id || !prize_id) throw new Error("경품 정보 없음");

  const imageFile = formData.get("image_file") as File | null;
  const uploadedImageUrl = await uploadPrizeImage(supabase, event_id, imageFile);

  const quantity = Math.max(1, Number(String(formData.get("quantity") || "1")));
  const sort_order = Math.max(1, Number(String(formData.get("sort_order") || "1")));

  const media_mode = String(formData.get("media_mode") || "image").trim();
  const video_url = String(formData.get("video_url") || "").trim();

  const { error } = await supabase
    .from("live_prizes")
    .update({
      title: String(formData.get("title") || "").trim(),
      sponsor: String(formData.get("sponsor") || "").trim() || null,
      description: String(formData.get("description") || "").trim() || null,
      preview_note: String(formData.get("preview_note") || "").trim() || null,

      image_url: uploadedImageUrl || current_image_url || null,
      video_url: video_url || null,
      media_mode,

      event_label: String(formData.get("event_label") || "메인 이벤트").trim(),
      headline: String(formData.get("headline") || "").trim() || null,
      subheadline: String(formData.get("subheadline") || "").trim() || null,

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

      product_price: String(formData.get("product_price") || "").trim() || null,
      product_cta: String(formData.get("product_cta") || "").trim() || null,

      category: String(formData.get("category") || "").trim() || null,
      display_group: String(formData.get("display_group") || "big").trim(),
      draw_type: String(formData.get("draw_type") || "phone").trim(),

      quantity,
      total_winners: quantity,
      sort_order,
      is_active: true,
      deleted_at: null,
    })
    .eq("id", prize_id)
    .eq("event_id", event_id);

  if (error) throw new Error(error.message);

  redirect(`/admin/live/events/${event_id}/prizes`);
}

async function deletePrize(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const event_id = String(formData.get("event_id") || "").trim();
  const prize_id = String(formData.get("prize_id") || "").trim();

  await supabase
    .from("live_prizes")
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", prize_id)
    .eq("event_id", event_id);

  redirect(`/admin/live/events/${event_id}/prizes`);
}

export default async function EditPrizePage({ params }: PageProps) {
  const { eventId, prizeId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: prize } = await supabase
    .from("live_prizes")
    .select("*")
    .eq("id", prizeId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (!prize) {
    return (
      <main style={wrap}>
        <div style={card}>경품을 찾을 수 없습니다.</div>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <section style={card}>
        <div style={top}>
          <div>
            <div style={eyebrow}>K-Agri LIVE</div>
            <h1 style={title}>경품 수정</h1>
            <p style={desc}>
              여기서 경품 이미지, 유튜브 영상, 메인 이벤트 문구를 직접 관리합니다.
            </p>
          </div>

          <Link href={`/admin/live/events/${eventId}/prizes`} style={backButton}>
            ← 목록
          </Link>
        </div>

        <form action={updatePrize} style={form}>
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="prize_id" value={prizeId} />
          <input type="hidden" name="current_image_url" value={prize.image_url || ""} />

          <label style={label}>
            경품명
            <input name="title" defaultValue={prize.title || ""} style={input} />
          </label>

          <div style={grid2}>
            <label style={label}>
              협찬사
              <input name="sponsor" defaultValue={prize.sponsor || ""} style={input} />
            </label>

            <label style={label}>
              이벤트 표시명
              <input
                name="event_label"
                defaultValue={prize.event_label || "메인 이벤트"}
                style={input}
              />
            </label>
          </div>

          <label style={label}>
            메인 큰 제목
            <input name="headline" defaultValue={prize.headline || ""} style={input} />
          </label>

          <label style={label}>
            노란 강조 문구
            <input
              name="subheadline"
              defaultValue={prize.subheadline || ""}
              style={input}
              placeholder="예: 영진로타리 역회전 로타리 1명 무료 추첨"
            />
          </label>

          <section style={box}>
            <h3 style={miniTitle}>📺 이미지 / 유튜브 영상</h3>

            {prize.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prize.image_url} alt={prize.title || "경품"} style={thumb} />
            ) : null}

            <label style={label}>
              새 이미지 업로드
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
                defaultValue={prize.video_url || ""}
                style={input}
                placeholder="https://youtu.be/영상ID 또는 https://www.youtube.com/watch?v=영상ID"
              />
            </label>

            <label style={label}>
              표시 방식
              <select name="media_mode" defaultValue={prize.media_mode || "image"} style={input}>
                <option value="image">이미지만</option>
                <option value="video">영상만</option>
                <option value="both">이미지 + 영상</option>
                <option value="none">문구만</option>
              </select>
            </label>
          </section>

          <section style={box}>
            <h3 style={miniTitle}>🎯 메인 이벤트 관리</h3>

            <div style={grid2}>
              <label style={label}>
                상품 가격/가치 문구
                <input
                  name="product_price"
                  defaultValue={prize.product_price || ""}
                  style={input}
                  placeholder="예: 2,000만원 상당"
                />
              </label>

              <label style={label}>
                CTA 문구
                <input
                  name="product_cta"
                  defaultValue={prize.product_cta || ""}
                  style={input}
                  placeholder="예: 제품 영상 확인 후 참여 가능"
                />
              </label>
            </div>

            <label style={label}>
              설명
              <textarea
                name="description"
                defaultValue={prize.description || ""}
                style={textarea}
                placeholder="메인 이벤트 카드에 보여줄 설명"
              />
            </label>

            <label style={label}>
              방송용 강조 문구
              <textarea
                name="preview_note"
                defaultValue={prize.preview_note || ""}
                style={textarea}
                placeholder="예: 돌 많은 밭에서도 강력한 분쇄력&#10;역회전 구조로 작업시간 단축"
              />
            </label>
          </section>

          <section style={box}>
            <h3 style={miniTitle}>🔢 당첨 표시</h3>

            <label style={label}>
              안내문구
              <input
                name="winner_note"
                defaultValue={
                  prize.winner_note || "방송 중 전화 확인 후 최종 당첨 확정"
                }
                style={input}
              />
            </label>

            <div style={grid3}>
              <label style={label}>
                번호크기
                <input
                  type="number"
                  name="number_font_size"
                  defaultValue={prize.number_font_size || 150}
                  style={input}
                />
              </label>

              <label style={label}>
                이름크기
                <input
                  type="number"
                  name="name_font_size"
                  defaultValue={prize.name_font_size || 68}
                  style={input}
                />
              </label>

              <label style={label}>
                안내문구 크기
                <input
                  type="number"
                  name="note_font_size"
                  defaultValue={prize.note_font_size || 36}
                  style={input}
                />
              </label>
            </div>
          </section>

          <div style={grid2}>
            <label style={label}>
              경품 수량
              <input
                type="number"
                name="quantity"
                min={1}
                defaultValue={prize.quantity || prize.total_winners || 1}
                style={input}
              />
            </label>

            <label style={label}>
              정렬 순서
              <input
                type="number"
                name="sort_order"
                min={1}
                defaultValue={prize.sort_order || 1}
                style={input}
              />
            </label>
          </div>

          <div style={grid3}>
            <label style={label}>
              카테고리
              <input name="category" defaultValue={prize.category || ""} style={input} />
            </label>

            <label style={label}>
              경품 구분
              <select
                name="display_group"
                defaultValue={prize.display_group || "big"}
                style={input}
              >
                <option value="big">대표 경품</option>
                <option value="general">일반 경품</option>
                <option value="small">소형 경품</option>
                <option value="coupon">쿠폰/참가상</option>
              </select>
            </label>

            <label style={label}>
              추첨 방식
              <select name="draw_type" defaultValue={prize.draw_type || "phone"} style={input}>
                <option value="phone">전화추첨</option>
                <option value="box">박스추첨</option>
                <option value="lotto">로또식 추첨</option>
                <option value="main">메인 이벤트</option>
              </select>
            </label>
          </div>

          <button type="submit" style={saveButton}>
            저장하기
          </button>
        </form>

        <form action={deletePrize}>
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="prize_id" value={prizeId} />

          <button type="submit" style={deleteButton}>
            삭제
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
  maxWidth: 900,
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: 28,
  padding: 28,
  color: "#111827",
  boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
};

const top: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
};

const eyebrow: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: "#16a34a",
};

const title: React.CSSProperties = {
  margin: "10px 0 0",
  fontSize: 36,
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  color: "#111827",
};

const desc: React.CSSProperties = {
  marginTop: 10,
  color: "#4b5563",
  fontWeight: 800,
  lineHeight: 1.6,
};

const backButton: React.CSSProperties = {
  padding: "13px 18px",
  borderRadius: 14,
  background: "#111827",
  color: "#ffffff",
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
  color: "#111827",
  fontSize: 15,
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
  background: "#ffffff",
  color: "#111827",
  outline: "none",
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 120,
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: 14,
  fontSize: 16,
  fontWeight: 800,
  lineHeight: 1.6,
  boxSizing: "border-box",
  background: "#ffffff",
  color: "#111827",
  outline: "none",
  resize: "vertical",
};

const fileInput: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: 14,
  background: "#ffffff",
  color: "#111827",
  boxSizing: "border-box",
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
  background: "#f9fafb",
};

const miniTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 950,
  color: "#111827",
};

const thumb: React.CSSProperties = {
  width: "100%",
  maxWidth: 320,
  borderRadius: 18,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  objectFit: "contain",
};

const saveButton: React.CSSProperties = {
  width: "100%",
  minHeight: 64,
  border: "none",
  borderRadius: 18,
  background: "#2563eb",
  color: "#ffffff",
  fontSize: 20,
  fontWeight: 950,
  cursor: "pointer",
};

const deleteButton: React.CSSProperties = {
  marginTop: 16,
  width: "100%",
  minHeight: 54,
  border: "none",
  borderRadius: 18,
  background: "#fee2e2",
  color: "#991b1b",
  fontSize: 18,
  fontWeight: 950,
  cursor: "pointer",
};