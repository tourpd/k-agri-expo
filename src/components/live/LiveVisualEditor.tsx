"use client";

import type { CSSProperties } from "react";
import type { LiveVisualConfig } from "@/types/live-visual";

type Props = {
  value: LiveVisualConfig;
  onChange: (next: LiveVisualConfig) => void;
};

function num(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function LiveVisualEditor({
  value,
  onChange,
}: Props) {
  function update<K extends keyof LiveVisualConfig>(
    key: K,
    next: LiveVisualConfig[K]
  ) {
    onChange({
      ...value,
      [key]: next,
    });
  }

  return (
    <div style={wrap}>
      <div style={left}>
        <Section title="① 로고 / 브랜드">
          <Input
            label="브랜드명"
            value={value.brand_name || ""}
            onChange={(v) => update("brand_name", v)}
          />

          <Input
            label="브랜드 로고 URL"
            value={value.brand_logo_url || ""}
            onChange={(v) => update("brand_logo_url", v)}
          />

          <Input
            label="협찬사명"
            value={value.sponsor_name || ""}
            onChange={(v) => update("sponsor_name", v)}
          />

          <Input
            label="협찬사 로고 URL"
            value={value.sponsor_logo_url || ""}
            onChange={(v) => update("sponsor_logo_url", v)}
          />
        </Section>

        <Section title="② 이미지 / 영상">
          <Input
            label="제품 이미지 URL"
            value={value.product_image_url || ""}
            onChange={(v) => update("product_image_url", v)}
          />

          <Input
            label="유튜브 URL"
            value={value.video_url || ""}
            onChange={(v) => update("video_url", v)}
          />

          <Range
            label="제품 이미지 가로"
            value={value.product_image_width || 420}
            min={180}
            max={800}
            onChange={(v) =>
              update("product_image_width", v)
            }
          />

          <Range
            label="제품 이미지 세로"
            value={value.product_image_height || 240}
            min={120}
            max={600}
            onChange={(v) =>
              update("product_image_height", v)
            }
          />

          <Range
            label="영상 높이"
            value={value.video_height || 300}
            min={180}
            max={700}
            onChange={(v) =>
              update("video_height", v)
            }
          />
        </Section>

        <Section title="③ 글자 크기">
          <Range
            label="메인 제목"
            value={value.title_font_size || 64}
            min={24}
            max={120}
            onChange={(v) =>
              update("title_font_size", v)
            }
          />

          <Range
            label="부제목"
            value={value.subtitle_font_size || 34}
            min={14}
            max={80}
            onChange={(v) =>
              update("subtitle_font_size", v)
            }
          />

          <Range
            label="D-DAY"
            value={value.dday_font_size || 72}
            min={18}
            max={150}
            onChange={(v) =>
              update("dday_font_size", v)
            }
          />

          <Range
            label="참여자수"
            value={value.participant_font_size || 42}
            min={14}
            max={100}
            onChange={(v) =>
              update("participant_font_size", v)
            }
          />
        </Section>

        <Section title="④ 표시 설정">
          <Check
            label="D-DAY 표시"
            checked={!!value.show_dday}
            onChange={(v) =>
              update("show_dday", v)
            }
          />

          <Check
            label="참여자 수 표시"
            checked={!!value.show_participant_count}
            onChange={(v) =>
              update("show_participant_count", v)
            }
          />

          <Range
            label="몇 명 이상일 때 공개"
            value={value.participant_min_show || 50}
            min={0}
            max={1000}
            onChange={(v) =>
              update("participant_min_show", v)
            }
          />
        </Section>

        <Section title="⑤ 색상">
          <Color
            label="배경색"
            value={value.background_color || "#07111f"}
            onChange={(v) =>
              update("background_color", v)
            }
          />

          <Color
            label="버튼색"
            value={value.button_color || "#facc15"}
            onChange={(v) =>
              update("button_color", v)
            }
          />

          <Color
            label="포인트색"
            value={value.primary_color || "#facc15"}
            onChange={(v) =>
              update("primary_color", v)
            }
          />
        </Section>
      </div>

      <div style={previewWrap}>
        <div
          style={{
            ...previewCard,
            background:
              value.background_color || "#07111f",
          }}
        >
          <div style={topRow}>
            <div style={brandRow}>
              {!!value.brand_logo_url && (
                <img
                  src={value.brand_logo_url}
                  alt=""
                  style={logo}
                />
              )}

              <div style={brandText}>
                {value.brand_name || "K-Agri Expo"}
              </div>
            </div>

            {!!value.show_participant_count && (
              <div style={participantCircle}>
                <div style={participantLabel}>
                  참여농가
                </div>

                <div
                  style={{
                    ...participantValue,
                    fontSize:
                      value.participant_font_size || 42,
                  }}
                >
                  248명
                </div>
              </div>
            )}
          </div>

          {!!value.show_dday && (
            <div
              style={{
                ...dday,
                fontSize:
                  value.dday_font_size || 72,
              }}
            >
              D-22
            </div>
          )}

          <div
            style={{
              ...title,
              fontSize:
                value.title_font_size || 64,
            }}
          >
            영진로타리
            <br />
            신제품 출시
          </div>

          <div
            style={{
              ...subtitle,
              fontSize:
                value.subtitle_font_size || 34,
            }}
          >
            무료 추첨 이벤트
          </div>

          <div style={mediaArea}>
            {!!value.product_image_url && (
              <img
                src={value.product_image_url}
                alt=""
                style={{
                  width:
                    value.product_image_width || 420,
                  height:
                    value.product_image_height || 240,
                  objectFit: "contain",
                  borderRadius: 18,
                  background: "#fff",
                }}
              />
            )}
          </div>

          <button
            style={{
              ...button,
              background:
                value.button_color || "#facc15",
            }}
          >
            무료 추첨 참여하기
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={section}>
      <h3 style={sectionTitle}>{title}</h3>
      <div style={sectionBody}>{children}</div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={field}>
      <span style={labelStyle}>{label}</span>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        style={input}
      />
    </label>
  );
}

function Range({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={field}>
      <span style={labelStyle}>
        {label} ({value})
      </span>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(num(e.target.value))
        }
      />
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={checkRow}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
      />

      <span>{label}</span>
    </label>
  );
}

function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={field}>
      <span style={labelStyle}>{label}</span>

      <input
        type="color"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        style={colorInput}
      />
    </label>
  );
}

const wrap: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "420px 1fr",
  gap: 24,
};

const left: CSSProperties = {
  display: "grid",
  gap: 18,
};

const previewWrap: CSSProperties = {
  position: "sticky",
  top: 20,
  height: "fit-content",
};

const previewCard: CSSProperties = {
  borderRadius: 32,
  padding: 26,
  color: "#fff",
  minHeight: 760,
};

const topRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const brandRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const logo: CSSProperties = {
  width: 62,
  height: 62,
  objectFit: "contain",
  borderRadius: 12,
  background: "#fff",
};

const brandText: CSSProperties = {
  fontSize: 26,
  fontWeight: 950,
};

const participantCircle: CSSProperties = {
  width: 130,
  height: 130,
  borderRadius: 999,
  background: "#fff",
  color: "#111827",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
};

const participantLabel: CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
};

const participantValue: CSSProperties = {
  fontWeight: 950,
  lineHeight: 1,
};

const dday: CSSProperties = {
  marginTop: 24,
  fontWeight: 950,
  color: "#facc15",
  lineHeight: 1,
};

const title: CSSProperties = {
  marginTop: 20,
  fontWeight: 950,
  lineHeight: 1.02,
};

const subtitle: CSSProperties = {
  marginTop: 18,
  fontWeight: 950,
  color: "#facc15",
};

const mediaArea: CSSProperties = {
  marginTop: 30,
};

const button: CSSProperties = {
  marginTop: 28,
  width: "100%",
  minHeight: 72,
  border: "none",
  borderRadius: 22,
  fontSize: 24,
  fontWeight: 950,
  color: "#111827",
};

const section: CSSProperties = {
  background: "#fff",
  borderRadius: 22,
  padding: 20,
  border: "1px solid #e5e7eb",
};

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 950,
};

const sectionBody: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gap: 14,
};

const field: CSSProperties = {
  display: "grid",
  gap: 6,
};

const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
};

const input: CSSProperties = {
  width: "100%",
  height: 52,
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: "0 14px",
  fontSize: 15,
  fontWeight: 800,
};

const colorInput: CSSProperties = {
  width: 80,
  height: 42,
};

const checkRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 800,
};