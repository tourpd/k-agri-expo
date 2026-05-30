import React from "react";

type Promotion = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  promo_type?: string | null;
  media_type?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  badge?: string | null;
  is_featured?: boolean | null;
};

function safe(v: any, fallback = "") {
  const s = String(v || "").trim();
  return s || fallback;
}

function toYoutubeEmbed(url?: string | null) {
  const v = String(url || "").trim();
  if (!v) return "";

  if (v.includes("youtu.be/")) {
    const id = v.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  if (v.includes("watch?v=")) {
    const id = v.split("watch?v=")[1]?.split("&")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  if (v.includes("/embed/")) return v;

  return "";
}

function typeLabel(type?: string | null) {
  switch (type) {
    case "live":
      return "LIVE";
    case "giveaway":
      return "무료 경품";
    case "sample":
      return "샘플 증정";
    case "discount":
      return "할인 행사";
    case "health":
      return "건강식품";
    case "alert":
      return "긴급 알림";
    default:
      return "특별 이벤트";
  }
}

export default function ExpoPromotionSections({
  items,
}: {
  items: Promotion[];
}) {
  if (!items.length) return null;

  const featured = items.find((x) => x.is_featured) || items[0];
  const cards = items.filter((x) => x.id !== featured.id);

  const featuredEmbed = toYoutubeEmbed(featured.video_url);
  const featuredMediaType = safe(featured.media_type, "image");

  return (
    <section style={S.wrap}>
      <div style={S.hero}>
        <div style={S.left}>
          <div style={S.badge}>
            {featured.badge || typeLabel(featured.promo_type)}
          </div>

          <h2 style={S.title}>{featured.title}</h2>

          <div style={S.subtitle}>{featured.subtitle}</div>

          <p style={S.desc}>{featured.description}</p>

          <a href={featured.button_link || "#"} style={S.mainButton}>
            {featured.button_text || "자세히 보기"}
          </a>
        </div>

        <div style={S.mediaBox}>
          {featuredMediaType !== "image" && featuredEmbed ? (
            <iframe
              src={featuredEmbed}
              title={featured.title || "영상"}
              style={S.video}
              allowFullScreen
            />
          ) : featured.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured.image_url}
              alt={featured.title || "대표 이벤트"}
              style={S.image}
            />
          ) : (
            <div style={S.empty}>이미지를 업로드하세요</div>
          )}
        </div>
      </div>

      {cards.length > 0 ? (
        <div style={S.grid}>
          {cards.map((item) => {
            const embed = toYoutubeEmbed(item.video_url);
            const mediaType = safe(item.media_type, "image");

            return (
              <a key={item.id} href={item.button_link || "#"} style={S.card}>
                <div style={S.cardBadge}>
                  {item.badge || typeLabel(item.promo_type)}
                </div>

                <div style={S.cardMedia}>
                  {mediaType !== "image" && embed ? (
                    <iframe
                      src={embed}
                      title={item.title || "영상"}
                      style={S.cardVideo}
                      allowFullScreen
                    />
                  ) : item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.title || "이벤트"}
                      style={S.cardImage}
                    />
                  ) : (
                    <div style={S.cardEmpty}>이미지</div>
                  )}
                </div>

                <h3 style={S.cardTitle}>{item.title}</h3>
                <p style={S.cardDesc}>{item.subtitle}</p>

                <div style={S.cardButton}>
                  {item.button_text || "자세히 보기"}
                </div>
              </a>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    padding: "24px 20px 0",
  },
  hero: {
    maxWidth: 1160,
    margin: "0 auto",
    borderRadius: 34,
    padding: 30,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 26,
    background:
      "linear-gradient(135deg,#020617 0%,#0f2f52 48%,#065f46 100%)",
    color: "#fff",
    boxShadow: "0 24px 70px rgba(15,23,42,0.18)",
  },
  left: {
    display: "grid",
    alignContent: "center",
    gap: 16,
  },
  badge: {
    width: "fit-content",
    padding: "9px 15px",
    borderRadius: 999,
    background: "#16a34a",
    fontWeight: 950,
  },
  title: {
    margin: 0,
    fontSize: "clamp(38px, 5vw, 66px)",
    lineHeight: 1.04,
    fontWeight: 950,
    letterSpacing: "-0.06em",
    wordBreak: "keep-all",
  },
  subtitle: {
    padding: "14px 18px",
    borderRadius: 18,
    background: "linear-gradient(135deg,#facc15,#f97316)",
    color: "#111827",
    fontSize: "clamp(24px, 3vw, 36px)",
    fontWeight: 950,
    wordBreak: "keep-all",
  },
  desc: {
    margin: 0,
    color: "rgba(255,255,255,0.82)",
    fontSize: 17,
    lineHeight: 1.65,
    fontWeight: 750,
  },
  mainButton: {
    minHeight: 64,
    borderRadius: 18,
    background: "#facc15",
    color: "#111827",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 23,
    fontWeight: 950,
  },
  mediaBox: {
    minHeight: 330,
    borderRadius: 26,
    overflow: "hidden",
    background: "#fff",
    display: "grid",
    placeItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  video: {
    width: "100%",
    height: "100%",
    minHeight: 330,
    border: 0,
  },
  empty: {
    color: "#64748b",
    fontWeight: 950,
  },
  grid: {
    maxWidth: 1160,
    margin: "18px auto 0",
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: 16,
  },
  card: {
    padding: 18,
    borderRadius: 26,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
    textDecoration: "none",
    color: "#111827",
    display: "flex",
    flexDirection: "column",
  },
  cardBadge: {
    width: "fit-content",
    padding: "7px 12px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    fontSize: 13,
    fontWeight: 950,
  },
  cardMedia: {
    marginTop: 14,
    height: 145,
    borderRadius: 18,
    overflow: "hidden",
    background: "#f8fafc",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cardVideo: {
    width: "100%",
    height: "100%",
    border: 0,
  },
  cardEmpty: {
    height: "100%",
    display: "grid",
    placeItems: "center",
    color: "#94a3b8",
    fontWeight: 900,
  },
  cardTitle: {
    margin: "15px 0 0",
    fontSize: 24,
    lineHeight: 1.2,
    fontWeight: 950,
    letterSpacing: "-0.04em",
    wordBreak: "keep-all",
  },
  cardDesc: {
    margin: "8px 0 0",
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 1.5,
    fontWeight: 750,
  },
  cardButton: {
    marginTop: "auto",
    minHeight: 48,
    borderRadius: 15,
    background: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
  },
};