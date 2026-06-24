import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  crop?: string;
  type?: string;
  usage?: string;
};

export default async function IndexedKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const crop = (params.crop || "").trim();
  const type = (params.type || "").trim();
  const usage = (params.usage || "").trim();

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("knowledge_page_index")
    .select(
      "id,source_title,page_number,crop,month_text,growth_stage,topic,thumbnail_url,full_image_url,visual_summary,visual_findings,image_analysis_status,created_at"
    )
    .eq("image_analysis_status", "asset_indexed")
    .order("source_title")
    .order("page_number")
    .limit(946);

  if (q) {
    query = query.or(
      [
        `source_title.ilike.%${q}%`,
        `crop.ilike.%${q}%`,
        `topic.ilike.%${q}%`,
        `visual_summary.ilike.%${q}%`,
      ].join(",")
    );
  }

  if (crop && crop !== "전체") query = query.eq("crop", crop);

  const { data } = await query;
  let rows = data ?? [];

  if (type && type !== "전체") {
    rows = rows.filter((r: any) =>
      Array.isArray(r.visual_findings?.asset_types) &&
      r.visual_findings.asset_types.includes(type)
    );
  }

  if (usage && usage !== "전체") {
    rows = rows.filter((r: any) =>
      Array.isArray(r.visual_findings?.usage_tags) &&
      r.visual_findings.usage_tags.includes(usage)
    );
  }

  const crops = Array.from(
    new Set(rows.map((r: any) => r.crop || r.visual_findings?.crop || "공통"))
  ).sort();

  const assetTypes = Array.from(
    new Set(
      rows.flatMap((r: any) =>
        Array.isArray(r.visual_findings?.asset_types)
          ? r.visual_findings.asset_types
          : []
      )
    )
  ).sort();

  const usages = Array.from(
    new Set(
      rows.flatMap((r: any) =>
        Array.isArray(r.visual_findings?.usage_tags)
          ? r.visual_findings.usage_tags
          : []
      )
    )
  ).sort();

  return (
    <main style={S.page}>
      <section style={S.hero}>
        <div style={S.kicker}>K-AGRI KNOWLEDGE ASSET INDEX</div>
        <h1 style={S.h1}>자료 색인센터</h1>
        <p style={S.desc}>
          안이영 PPT·농진청·포토닥터·유튜브 자료를 콘텐츠 소재로 다시 꺼내 쓰는 운영용 엑셀 화면입니다.
        </p>
      </section>

      <section style={S.stats}>
        <Stat label="표시 건수" value={`${rows.length}건`} />
        <Stat label="전체 색인" value="946페이지" />
        <Stat label="목적" value="콘텐츠 재사용" />
        <Stat label="최종 목표" value="제품·매출 연결" />
      </section>

      <form style={S.filters}>
        <input
          name="q"
          defaultValue={q}
          placeholder="작물·키워드·자료명 검색 예: 총채벌레, 탄저병, 칼슘, 고추"
          style={S.search}
        />

        <select name="crop" defaultValue={crop || "전체"} style={S.select}>
          <option>전체</option>
          {crops.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select name="type" defaultValue={type || "전체"} style={S.select}>
          <option>전체</option>
          {assetTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <select name="usage" defaultValue={usage || "전체"} style={S.select}>
          <option>전체</option>
          {usages.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>

        <button style={S.button}>검색</button>
        <a href="/admin/knowledge-assets/indexed" style={S.reset}>
          초기화
        </a>
      </form>

      <section style={S.tableWrap}>
        <div style={S.tableTop}>
          <b>자료 색인 엑셀표</b>
          <span>한 줄 = 한 페이지 자산 / 클릭해서 이미지 확인</span>
        </div>

        <div style={S.scroll}>
          <table style={S.table}>
            <thead>
              <tr>
                <Th w="48px">선택</Th>
                <Th w="80px">작물</Th>
                <Th w="70px">월</Th>
                <Th w="100px">유형</Th>
                <Th w="180px">키워드</Th>
                <Th w="90px">페이지</Th>
                <Th w="360px">핵심 색인</Th>
                <Th w="240px">활용처</Th>
                <Th w="120px">이미지</Th>
                <Th w="360px">자료명</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => {
                const vf = r.visual_findings || {};
                const keywords = Array.isArray(vf.keywords) ? vf.keywords : [];
                const types = Array.isArray(vf.asset_types) ? vf.asset_types : [];
                const tags = Array.isArray(vf.usage_tags) ? vf.usage_tags : [];
                const image = r.full_image_url || r.thumbnail_url;

                return (
                  <tr key={r.id}>
                    <Td center>
                      <input type="checkbox" />
                    </Td>
                    <Td strong>{r.crop || vf.crop || "공통"}</Td>
                    <Td>{r.month_text || vf.month || "-"}</Td>
                    <Td>
                      <Badge text={types[0] || "교육자료"} dark />
                    </Td>
                    <Td>
                      <div style={S.tags}>
                        {keywords.slice(0, 4).map((k: string) => (
                          <Badge key={k} text={k} />
                        ))}
                      </div>
                    </Td>
                    <Td>{r.page_number}p</Td>
                    <Td strong>{r.visual_summary || r.topic || "-"}</Td>
                    <Td>
                      <div style={S.tags}>
                        {tags.slice(0, 5).map((t: string) => (
                          <Badge key={t} text={t} green />
                        ))}
                      </div>
                    </Td>
                    <Td>
                      {image ? (
                        <a href={image} target="_blank" style={S.imageBtn}>
                          원본 보기
                        </a>
                      ) : (
                        <span style={S.muted}>없음</span>
                      )}
                    </Td>
                    <Td>
                      <span style={S.source}>{r.source_title}</span>
                    </Td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} style={S.empty}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.stat}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
    </div>
  );
}

function Th({ children, w }: { children: React.ReactNode; w?: string }) {
  return <th style={{ ...S.th, width: w }}>{children}</th>;
}

function Td({
  children,
  strong,
  center,
}: {
  children: React.ReactNode;
  strong?: boolean;
  center?: boolean;
}) {
  return (
    <td
      style={{
        ...S.td,
        fontWeight: strong ? 900 : 700,
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </td>
  );
}

function Badge({
  text,
  dark,
  green,
}: {
  text: string;
  dark?: boolean;
  green?: boolean;
}) {
  return (
    <span
      style={{
        ...S.badge,
        background: dark ? "#020617" : green ? "#dcfce7" : "#fef3c7",
        color: dark ? "white" : green ? "#166534" : "#713f12",
      }}
    >
      {text}
    </span>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4f6f8",
    padding: 24,
    color: "#0f172a",
  },
  hero: {
    background: "#020617",
    color: "white",
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
  },
  kicker: {
    color: "#22c55e",
    fontWeight: 900,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  h1: {
    marginTop: 10,
    fontSize: 44,
    fontWeight: 900,
    lineHeight: 1.1,
  },
  desc: {
    marginTop: 10,
    color: "#cbd5e1",
    fontWeight: 700,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
    marginBottom: 18,
  },
  stat: {
    background: "white",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
  },
  statLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: 900,
  },
  statValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: 900,
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "1fr 140px 160px 160px 90px 90px",
    gap: 10,
    background: "white",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
  },
  search: {
    border: "2px solid #0f172a",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 800,
  },
  select: {
    border: "2px solid #0f172a",
    borderRadius: 12,
    padding: "12px 10px",
    fontWeight: 800,
    background: "white",
  },
  button: {
    border: 0,
    borderRadius: 12,
    background: "#059669",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  reset: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: 900,
    textDecoration: "none",
  },
  tableWrap: {
    background: "white",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
  },
  tableTop: {
    display: "flex",
    justifyContent: "space-between",
    padding: 18,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 16,
  },
  scroll: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: 1900,
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "#eef2f7",
    borderBottom: "1px solid #cbd5e1",
    padding: "14px 10px",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 900,
  },
  td: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    verticalAlign: "top",
    wordBreak: "keep-all",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "5px 9px",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  imageBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    background: "#020617",
    color: "white",
    padding: "8px 10px",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
  },
  muted: {
    color: "#94a3b8",
    fontWeight: 900,
  },
  source: {
    color: "#475569",
    fontSize: 13,
  },
  empty: {
    padding: 40,
    textAlign: "center",
    fontWeight: 900,
    color: "#64748b",
  },
};
