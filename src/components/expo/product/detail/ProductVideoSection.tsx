import React from "react";

type Props = {
  title?: string | null;
  embedUrl?: string | null;
};

export default function ProductVideoSection({ title, embedUrl }: Props) {
  if (!embedUrl) return null;

  return (
    <section style={S.video}>
      <h3 style={S.sectionHeading}>제품 영상</h3>
      <iframe
        src={embedUrl}
        width="100%"
        height="360"
        style={S.iframe}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title || "제품 영상"}
      />
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  video: {
    marginTop: 24,
  },

  sectionHeading: {
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 12,
    color: "#111827",
  },

  iframe: {
    border: "none",
    borderRadius: 14,
    background: "#000",
  },
};