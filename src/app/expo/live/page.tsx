import type { CSSProperties } from "react";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import LiveCounter from "./LiveCounter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type LiveEvent = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  created_at?: string | null;
  locked_at?: string | null;
  ended_at?: string | null;
};

type LivePrize = {
  id: string;
  event_id?: string | null;
  title?: string | null;
  sponsor?: string | null;
  description?: string | null;
  preview_note?: string | null;
  image_url?: string | null;
  quantity?: number | null;
  total_winners?: number | null;
  drawn_count?: number | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  display_group?: string | null;
  draw_type?: string | null;
  category?: string | null;
  deleted_at?: string | null;
  product_price?: string | null;
  product_cta?: string | null;
};

export default async function LivePage() {
  const supabase = createSupabaseAdminClient();

  const { data: event, error: eventError } = await supabase
    .from("live_events")
    .select("*")
    .eq("status", "live")
    .order("locked_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<LiveEvent>();

  if (eventError) {
    return (
      <main style={wrap}>
        <section style={card}>
          <h1 style={errorTitle}>라이브 이벤트를 불러오지 못했습니다.</h1>
          <p style={errorDesc}>{eventError.message}</p>
        </section>
      </main>
    );
  }

  if (!event?.id) {
    return (
      <main style={wrap}>
        <section style={card}>
          <div style={badge}>🔥 K-Agri LIVE EVENT</div>
          <h1 style={title}>현재 진행 중인 라이브 이벤트가 없습니다.</h1>
          <p style={desc}>
            관리자가 라이브 이벤트를 시작하면 이 페이지에 경품 참여 화면이 표시됩니다.
          </p>

          <Link href="/expo" style={ctaDark}>
            EXPO 메인으로 돌아가기 →
          </Link>
        </section>
      </main>
    );
  }

  const { data: prizes, error: prizeError } = await supabase
    .from("live_prizes")
    .select("*")
    .eq("event_id", event.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (prizeError) {
    return (
      <main style={wrap}>
        <section style={card}>
          <h1 style={errorTitle}>라이브 경품을 불러오지 못했습니다.</h1>
          <p style={errorDesc}>{prizeError.message}</p>
        </section>
      </main>
    );
  }

  const livePrizes = (prizes || []) as LivePrize[];
  const mainPrize = pickMainPrize(livePrizes);

  const titleText = event.title || "K-Agri Expo 라이브 경품 이벤트";

  const subtitleText =
    mainPrize?.preview_note ||
    mainPrize?.description ||
    event.description ||
    "방송 중 경품 추첨에 참여하려면 아래 정보를 입력해주세요.";

  const prizeText = mainPrize?.title
    ? `${mainPrize.title}${getPrizeQuantityText(mainPrize)}`
    : "라이브 경품 추첨";

  const descriptionText =
    event.description ||
    mainPrize?.description ||
    "참여 완료 후 발급되는 참여번호가 방송 중 경품 추첨 번호로 사용됩니다.";

  const imageUrl = mainPrize?.image_url ? addCacheBuster(mainPrize.image_url) : "";

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={hero}>
          <div style={badge}>🔥 K-Agri LIVE EVENT</div>

          <h1 style={title}>{titleText}</h1>

          <p style={desc}>{subtitleText}</p>

          <LiveCounter />

          <div style={prizeBox}>
            <div style={prizeMain}>{prizeText}</div>
            <div style={prizeSub}>참여번호 자동 발급</div>
            <div style={prizeDesc}>참여 신청 → 번호 발급 → 방송 중 추첨</div>
          </div>

          <p style={eventDesc}>{descriptionText}</p>

          <div style={ctaWrap}>
            <Link href="/expo/live/join" style={cta}>
              🔥 라이브 경품 참여하기
            </Link>

            <Link href="/expo/live/my-number" style={ctaDark}>
              🔎 내 참여번호 찾기
            </Link>
          </div>
        </section>

        {mainPrize ? (
          <section style={section}>
            <h2 style={sectionTitle}>📸 오늘의 이벤트 제품</h2>

            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={mainPrize.title || titleText}
                style={productImage}
              />
            ) : (
              <div style={noImage}>
                등록된 상품 이미지가 없습니다.
              </div>
            )}

            <div style={productInfoBox}>
              <strong>{mainPrize.sponsor || "K-Agri Expo"}</strong>
              <span>{mainPrize.title || "라이브 경품"}</span>
            </div>
          </section>
        ) : (
          <section style={section}>
            <h2 style={sectionTitle}>📸 오늘의 이벤트 제품</h2>
            <div style={noImage}>
              이 이벤트에 연결된 경품이 없습니다.
              <br />
              관리자에서 live_prizes.event_id를 확인해주세요.
            </div>
          </section>
        )}

        <section style={noticeSection}>
          <div style={noticeBadge}>꼭 읽어주세요</div>

          <h2 style={noticeTitle}>📢 라이브 경품 참여 안내</h2>

          <p style={noticeDesc}>
            농민은 유튜브 고정댓글, 설명란, QR코드, 또는 앱 배너를 통해 이 페이지로 들어옵니다.
            참여하기를 누르면 현재 방송 중인 이벤트에 자동으로 연결되고, 본인의 참여번호가 발급됩니다.
          </p>

          <div style={noticeList}>
            <div style={noticeItem}>
              <b>① 라이브 참여 신청</b>
              <span>이름과 전화번호를 입력하면 현재 방송 중 이벤트에 참여됩니다.</span>
            </div>

            <div style={noticeItem}>
              <b>② 참여번호 확인</b>
              <span>신청 완료 화면에서 본인의 참여번호를 확인합니다.</span>
            </div>

            <div style={noticeItem}>
              <b>③ 방송 중 추첨 확인</b>
              <span>방송 화면에 내 참여번호가 나오면 당첨입니다.</span>
            </div>

            <div style={noticeItem}>
              <b>④ 번호를 잊은 경우</b>
              <span>내 참여번호 찾기에서 전화번호로 다시 확인할 수 있습니다.</span>
            </div>

            <div style={noticeItem}>
              <b>⑤ 당첨 후 안내</b>
              <span>당첨자는 전화 연결 또는 배송정보 입력 안내를 받습니다.</span>
            </div>
          </div>

          <div style={noticeWarning}>
            ✔ 동일 전화번호 중복 참여는 제한될 수 있습니다.
            <br />
            ✔ 참여번호는 방송 중 경품 추첨 번호로 사용됩니다.
            <br />
            ✔ 최종 당첨 시 전화 연결 또는 배송정보 입력 안내가 진행됩니다.
          </div>
        </section>

        <section style={debugBox}>
          <b>관리자 확인용</b>
          <span>event_id: {event.id}</span>
          <span>event_title: {titleText}</span>
          <span>prize_id: {mainPrize?.id || "없음"}</span>
          <span>prize_title: {mainPrize?.title || "없음"}</span>
        </section>
      </div>
    </main>
  );
}

function pickMainPrize(prizes: LivePrize[]) {
  if (!prizes.length) return null;

  const big = prizes.find((p) => p.display_group === "big");
  if (big) return big;

  const general = prizes.find((p) => p.display_group === "general");
  if (general) return general;

  return [...prizes].sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
  )[0];
}

function getPrizeQuantityText(prize: LivePrize) {
  const qty = Number(prize.quantity || prize.total_winners || 0);
  if (!qty) return "";
  return ` ${qty}명`;
}

function addCacheBuster(url: string) {
  if (!url) return "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
}

const wrap: CSSProperties = {
  minHeight: "100vh",
  background: "#f3f4f6",
  padding: 20,
};

const container: CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const card: CSSProperties = {
  background: "#ffffff",
  borderRadius: 26,
  padding: 28,
  textAlign: "center",
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
};

const hero: CSSProperties = {
  background: "#ffffff",
  borderRadius: 26,
  padding: 28,
  textAlign: "center",
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
};

const badge: CSSProperties = {
  display: "inline-block",
  background: "#ecfdf5",
  color: "#15803d",
  padding: "8px 16px",
  borderRadius: 999,
  fontWeight: 900,
};

const title: CSSProperties = {
  fontSize: 38,
  lineHeight: 1.16,
  fontWeight: 950,
  marginTop: 18,
  color: "#111827",
};

const desc: CSSProperties = {
  marginTop: 12,
  fontSize: 17,
  lineHeight: 1.6,
  color: "#374151",
  fontWeight: 800,
};

const prizeBox: CSSProperties = {
  marginTop: 22,
  background: "linear-gradient(135deg,#166534,#16a34a)",
  borderRadius: 20,
  padding: 22,
  color: "#fff",
};

const prizeMain: CSSProperties = {
  fontSize: 26,
  fontWeight: 950,
};

const prizeSub: CSSProperties = {
  marginTop: 4,
  fontSize: 24,
  fontWeight: 950,
  color: "#facc15",
};

const prizeDesc: CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  fontWeight: 800,
};

const eventDesc: CSSProperties = {
  marginTop: 18,
  fontSize: 15,
  lineHeight: 1.7,
  color: "#4b5563",
  fontWeight: 700,
};

const ctaWrap: CSSProperties = {
  marginTop: 22,
  display: "grid",
  gap: 10,
};

const cta: CSSProperties = {
  display: "block",
  padding: 18,
  background: "#16a34a",
  color: "#fff",
  borderRadius: 15,
  fontWeight: 950,
  fontSize: 18,
  textDecoration: "none",
};

const ctaDark: CSSProperties = {
  display: "block",
  padding: 18,
  background: "#111827",
  color: "#fff",
  borderRadius: 15,
  fontWeight: 950,
  fontSize: 18,
  textDecoration: "none",
};

const section: CSSProperties = {
  background: "#fff",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
};

const sectionTitle: CSSProperties = {
  fontSize: 22,
  fontWeight: 950,
  marginBottom: 14,
  color: "#111827",
};

const productImage: CSSProperties = {
  width: "100%",
  borderRadius: 18,
  display: "block",
};

const productInfoBox: CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  background: "#f9fafb",
  display: "grid",
  gap: 4,
  color: "#111827",
  fontSize: 15,
  fontWeight: 850,
};

const noImage: CSSProperties = {
  borderRadius: 18,
  background: "#f9fafb",
  color: "#6b7280",
  fontSize: 17,
  fontWeight: 900,
  lineHeight: 1.6,
  padding: 40,
  textAlign: "center",
};

const noticeSection: CSSProperties = {
  background: "#fff",
  borderRadius: 22,
  padding: 24,
  boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
};

const noticeBadge: CSSProperties = {
  display: "inline-block",
  padding: "7px 13px",
  borderRadius: 999,
  background: "#ecfdf5",
  color: "#15803d",
  fontSize: 13,
  fontWeight: 950,
};

const noticeTitle: CSSProperties = {
  marginTop: 12,
  fontSize: 25,
  fontWeight: 950,
  color: "#111827",
};

const noticeDesc: CSSProperties = {
  marginTop: 12,
  fontSize: 16,
  lineHeight: 1.75,
  color: "#374151",
  fontWeight: 800,
};

const noticeList: CSSProperties = {
  marginTop: 18,
  display: "grid",
  gap: 12,
};

const noticeItem: CSSProperties = {
  padding: 16,
  borderRadius: 15,
  background: "#f9fafb",
  display: "grid",
  gap: 6,
  fontSize: 15,
  lineHeight: 1.6,
  color: "#111827",
};

const noticeWarning: CSSProperties = {
  marginTop: 18,
  padding: 16,
  borderRadius: 15,
  background: "#fff7ed",
  color: "#9a3412",
  fontSize: 15,
  lineHeight: 1.75,
  fontWeight: 900,
};

const debugBox: CSSProperties = {
  background: "#111827",
  color: "#d1d5db",
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 6,
  fontSize: 12,
  lineHeight: 1.5,
};

const errorTitle: CSSProperties = {
  fontSize: 26,
  fontWeight: 950,
  color: "#dc2626",
};

const errorDesc: CSSProperties = {
  marginTop: 12,
  fontSize: 15,
  color: "#374151",
  lineHeight: 1.6,
};