// src/lib/ui.ts
export const ui = {
  page: {
    padding: 32,
    maxWidth: 1100,
    margin: "0 auto",
  } as const,

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 18,
  } as const,

  h1: { margin: 0, fontSize: 24, letterSpacing: -0.2 } as const,
  sub: { marginTop: 8, marginBottom: 0, color: "#555", lineHeight: 1.5 } as const,

  card: {
    border: "1px solid #eee",
    borderRadius: 14,
    background: "#fff",
    padding: 16,
  } as const,

  cardTitle: { margin: 0, fontSize: 16 } as const,
  muted: { color: "#666" } as const,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  } as const,

  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  } as const,

  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } as const,

  label: { display: "block", fontWeight: 800, marginBottom: 8 } as const,

  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    fontSize: 15,
    outline: "none",
  } as const,

  textarea: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    fontSize: 15,
    outline: "none",
    minHeight: 110,
    resize: "vertical",
  } as const,

  select: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    fontSize: 15,
    outline: "none",
    background: "#fff",
  } as const,

  btn: {
    base: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #e7e7e7",
      background: "#fafafa",
      color: "#111",
      fontWeight: 800,
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
    } as const,
    primary: {
      background: "#111",
      color: "#fff",
      border: "1px solid #111",
    } as const,
    danger: {
      background: "#fff5f5",
      color: "#b42318",
      border: "1px solid #ffd2d2",
    } as const,
    disabled: {
      opacity: 0.55,
      cursor: "not-allowed",
    } as const,
  },

  tabsWrap: {
    display: "flex",
    gap: 10,
    borderBottom: "1px solid #eee",
    paddingBottom: 10,
    marginBottom: 14,
  } as const,

  tab: (active: boolean) =>
    ({
      padding: "10px 12px",
      borderRadius: 999,
      border: "1px solid #e7e7e7",
      background: active ? "#111" : "#fafafa",
      color: active ? "#fff" : "#111",
      fontWeight: 900,
      cursor: "pointer",
    }) as const,

  pill: {
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid #e7e7e7",
    background: "#fafafa",
    fontSize: 12,
    color: "#333",
  } as const,

  hr: { border: "none", borderTop: "1px solid #eee", margin: "16px 0" } as const,
};

export function Btn({
  children,
  onClick,
  href,
  target,
  rel,
  primary,
  danger,
  disabled,
  style,
}: {
  children: any;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  style?: any;
}) {
  const s = {
    ...ui.btn.base,
    ...(primary ? ui.btn.primary : {}),
    ...(danger ? ui.btn.danger : {}),
    ...(disabled ? ui.btn.disabled : {}),
    ...style,
  };

  if (href) {
    return (
      <a href={href} target={target} rel={rel} style={s}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} style={s as any}>
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: any;
  hint?: string;
}) {
  return (
    <div>
      <div style={ui.label}>{label}</div>
      {children}
      {hint && <div style={{ marginTop: 6, color: "#777", fontSize: 13 }}>{hint}</div>}
    </div>
  );
}

export function Card({
  title,
  right,
  children,
}: {
  title?: string;
  right?: any;
  children: any;
}) {
  return (
    <section style={ui.card}>
      {(title || right) && (
        <div style={{ ...ui.row, justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 900 }}>{title}</div>
          <div>{right}</div>
        </div>
      )}
      {children}
    </section>
  );
}