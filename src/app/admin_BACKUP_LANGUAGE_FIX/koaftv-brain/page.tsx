import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function readJson(filePath: string) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return [];
  }
}

export default function KoafTvBrainPage() {
  const rules = readJson("data/koaftv/knowledge_assets/rules/koaftv_rules.json");
  const quotes = readJson("data/koaftv/knowledge_assets/character_quotes/koaftv_character_quotes.json");
  const broadcast = readJson("data/koaftv/knowledge_assets/broadcast_materials/koaftv_broadcast_materials.json");
  const shorts = readJson("data/koaftv/knowledge_assets/shorts_materials/koaftv_shorts_materials.json");

  return (
    <main style={{ padding: 24, background: "#f6f7f4", minHeight: "100vh", color: "#111" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>KOAF TV 지식자산센터</h1>
      <p style={{ marginTop: 8, fontSize: 16 }}>
        한국농수산TV 자막에서 추출한 농사 규칙, 방송소재, 쇼츠소재, 캐릭터 대사 원천입니다.
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 24 }}>
        <Card title="농사 규칙" count={rules.length} />
        <Card title="방송 소재" count={broadcast.length} />
        <Card title="쇼츠 소재" count={shorts.length} />
        <Card title="캐릭터 어록" count={quotes.length} />
      </section>

      <DataSection
        title="캐릭터 어록 후보"
        rows={quotes.slice(0, 80)}
        columns={[
          ["title", "영상"],
          ["quote_candidate", "어록 후보"],
          ["possible_character", "활용 캐릭터"],
          ["url", "원본"],
        ]}
      />

      <DataSection
        title="농사 규칙 후보"
        rows={rules.slice(0, 80)}
        columns={[
          ["crop", "작물"],
          ["problem", "문제"],
          ["evidence_sentence", "근거 문장"],
          ["action_instruction", "작업지시"],
          ["url", "원본"],
        ]}
      />
    </main>
  );
}

function Card({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ background: "white", border: "1px solid #ddd", borderRadius: 16, padding: 18 }}>
      <div style={{ fontSize: 15, color: "#555", fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 900, marginTop: 8 }}>{count}</div>
    </div>
  );
}

function DataSection({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: any[];
  columns: [string, string][];
}) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>{title}</h2>
      <div style={{ overflowX: "auto", background: "white", border: "1px solid #ddd", borderRadius: 14 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1200 }}>
          <thead>
            <tr style={{ background: "#e9efe5" }}>
              {columns.map(([key, label]) => (
                <th key={key} style={th}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {columns.map(([key]) => (
                  <td key={key} style={td}>
                    {key === "url" && row[key] ? (
                      <a href={row[key]} target="_blank" style={{ color: "#166534", fontWeight: 800 }}>
                        보기
                      </a>
                    ) : (
                      String(row[key] ?? "")
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const th: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #eee",
  fontSize: 13,
  verticalAlign: "top",
  lineHeight: 1.45,
};
