import React from "react";

type Props = {
  href?: string | null;
};

export default function ProductCatalogButton({ href }: Props) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={S.catalogBtn}
    >
      카탈로그 다운로드
    </a>
  );
}

const S: Record<string, React.CSSProperties> = {
  catalogBtn: {
    display: "block",
    marginTop: 24,
    background: "#111827",
    color: "#fff",
    padding: 14,
    textAlign: "center",
    textDecoration: "none",
    borderRadius: 12,
    fontWeight: 900,
  },
};