"use client";

import React from "react";
import Link from "next/link";

type BillboardItem = {
  booth_id: string;
  booth_name: string;
  click_count: number;
  inquiry_count: number;
  order_count: number;
  score: number;
};

const RESPONSIVE_CSS = `
.billboard-board-root {
  width: 100%;
}

.billboard-shell {
  border-radius: 30px;
}

.billboard-list {
  display: grid;
  gap: 12px;
}

.billboard-row {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 12px;
  align-items: center;
}

@media (max-width: 768px) {
  .billboard-shell {
    padding: 18px 14px !important;
    border-radius: 24px !important;
  }

  .billboard-head {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 14px !important;
  }

  .billboard-title {
    font-size: 34px !important;
    line-height: 1.12 !important;
  }

  .billboard-desc {
    font-size: 15px !important;
    line-height: 1.7 !important;
  }

  .billboard-more-link {
    width: 100% !important;
    box-sizing: border-box !important;
    text-align: center !important;
    justify-content: center !important;
  }

  .billboard-row {
    grid-template-columns: 44px 1fr !important;
  }

  .billboard-score {
    grid-column: 2 / 3;
    justify-self: start !important;
    margin-top: 6px !important;
  }
}

@media (max-width: 480px) {
  .billboard-title {
    font-size: 30px !important;
  }

  .billboard-row {
    padding: 14px 12px !important;
    border-radius: 16px !important;
  }

  .billboard-rank {
    width: 34px !important;
    height: 34px !important;
    font-size: 16px !important;
  }

  .billboard-name {
    font-size: 15px !important;
  }
}
`;

export default function BillboardBoard() {
  const [items, setItems] = React.useState<BillboardItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorText, setErrorText] = React.useState("");

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrorText("");

        const res = await fetch("/api/expo/billboard", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "빌보드 데이터를 불러오지 못했습니다.");
        }

        if (!alive) return;
        setItems(Array.isArray(json.top_booths) ? json.top_booths : []);
      } catch (e: any) {
        if (!alive) return;
        setErrorText(e?.message || "빌보드 데이터를 불러오지 못했습니다.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section style={S.root} className="billboard-board-root">
      <style>{RESPONSIVE_CSS}</style>

      <div style={S.shell} className="billboard-shell">
        <div style={S.head} className="billboard-head">
          <div>
            <div style={S.kicker}>LIVE FARMER DATA BOARD</div>
            <h2 style={S.title} className="billboard-title">
              실시간 농민 행동 빌보드
            </h2>
            <p style={S.desc} className="billboard-desc">
              최근 7일 기준으로 클릭 · 문의 · 주문 데이터를 합산해 자동 집계한 순위입니다.
            </p>
          </div>

          <Link
            href="/expo/booths"
            style={S.moreLink}
            className="billboard-more-link"
          >
            전체 부스 보기 →
          </Link>
        </div>

        <div style={S.metaRow}>
          <span style={S.metaPill}>클릭 1점</span>
          <span style={S.metaPill}>문의 3점</span>
          <span style={S.metaPill}>주문 5점</span>
        </div>

        {loading ? (
          <div style={S.stateBox}>빌보드 집계 불러오는 중...</div>
        ) : errorText ? (
          <div style={S.stateBox}>{errorText}</div>
        ) : items.length === 0 ? (
          <div style={S.stateBox}>아직 집계 데이터가 없습니다.</div>
        ) : (
          <div className="billboard-list">
            {items.map((item, idx) => (
              <Link
                key={item.booth_id}
                href={`/expo/booths/${item.booth_id}`}
                style={S.row}
                className="billboard-row"
              >
                <div style={S.rank} className="billboard-rank">
                  {idx + 1}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={S.name} className="billboard-name">
                    {item.booth_name}
                  </div>
                  <div style={S.sub}>
                    클릭 {item.click_count} · 문의 {item.inquiry_count} · 주문 {item.order_count}
                  </div>
                </div>

                <div style={S.score} className="billboard-score">
                  {item.score}점
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: {
    width: "100%",
  },

  shell: {
    borderRadius: 30,
    padding: 26,
    background: "linear-gradient(135deg, #0b1220 0%, #0f1f3d 48%, #111827 100%)",
    color: "#fff",
    boxShadow: "0 18px 42px rgba(15,23,42,0.18)",
  },

  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 18,
    flexWrap: "wrap",
  },

  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#4ade80",
    letterSpacing: 0.4,
  },

  title: {
    margin: "10px 0 0",
    fontSize: 58,
    lineHeight: 1.02,
    fontWeight: 950,
    letterSpacing: -1.2,
    color: "#ffffff",
  },

  desc: {
    marginTop: 18,
    maxWidth: 780,
    fontSize: 18,
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.82)",
  },

  moreLink: {
    textDecoration: "none",
    color: "#fff",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    padding: "14px 18px",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  },

  metaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 18,
  },

  metaPill: {
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 900,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.9)",
  },

  stateBox: {
    borderRadius: 18,
    padding: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 1.7,
  },

  row: {
    textDecoration: "none",
    color: "#fff",
    display: "grid",
    gridTemplateColumns: "56px 1fr auto",
    gap: 12,
    alignItems: "center",
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  rank: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontWeight: 950,
    fontSize: 18,
  },

  name: {
    minWidth: 0,
    color: "#ffffff",
    fontWeight: 950,
    fontSize: 18,
    lineHeight: 1.35,
    wordBreak: "keep-all",
  },

  sub: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.6,
  },

  score: {
    fontSize: 22,
    fontWeight: 950,
    color: "#fde68a",
    whiteSpace: "nowrap",
    justifySelf: "end",
  },
};