import { revalidatePath } from "next/cache";
import {
  createProblemQuickLink,
  listProblemQuickLinks,
  toggleProblemQuickLinkActive,
} from "@/lib/admin/problem-quick-links";

export const dynamic = "force-dynamic";

export default async function AdminProblemQuickLinksPage() {
  const rows = await listProblemQuickLinks();

  async function createAction(formData: FormData) {
    "use server";
    await createProblemQuickLink(formData);
    revalidatePath("/admin/problem-quick-links");
    revalidatePath("/expo");
  }

  async function toggleAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    const nextValue = String(formData.get("nextValue") ?? "") === "true";

    if (!id) return;

    await toggleProblemQuickLinkActive(id, nextValue);
    revalidatePath("/admin/problem-quick-links");
    revalidatePath("/expo");
  }

  return (
    <main style={S.page}>
      <div style={S.container}>
        <div style={S.header}>
          <div>
            <div style={S.eyebrow}>ADMIN CMS</div>
            <h1 style={S.title}>빠른 해결 버튼 관리</h1>
            <p style={S.desc}>
              월별·시즌별로 메인에 노출할 해결 버튼을 등록합니다.
            </p>
          </div>
        </div>

        <section style={S.card}>
          <h2 style={S.sectionTitle}>새 버튼 등록</h2>

          <form action={createAction} style={S.formGrid}>
            <label style={S.field}>
              <span style={S.label}>버튼명 *</span>
              <input name="label" style={S.input} placeholder="예: 총채벌레 해결" required />
            </label>

            <label style={S.field}>
              <span style={S.label}>링크 URL *</span>
              <input name="link_url" style={S.input} defaultValue="/expo/consult" required />
            </label>

            <label style={S.field}>
              <span style={S.label}>대상</span>
              <select name="audience_type" style={S.input} defaultValue="farmer">
                <option value="all">all</option>
                <option value="farmer">farmer</option>
                <option value="vendor">vendor</option>
                <option value="buyer">buyer</option>
              </select>
            </label>

            <label style={S.field}>
              <span style={S.label}>시즌</span>
              <select name="season_key" style={S.input} defaultValue="">
                <option value="">없음</option>
                <option value="spring">spring</option>
                <option value="summer">summer</option>
                <option value="fall">fall</option>
                <option value="winter">winter</option>
              </select>
            </label>

            <label style={S.field}>
              <span style={S.label}>월</span>
              <input name="month_key" type="number" min={1} max={12} style={S.input} placeholder="예: 3" />
            </label>

            <label style={S.field}>
              <span style={S.label}>우선순위</span>
              <input name="priority" type="number" style={S.input} defaultValue={100} />
            </label>

            <label style={S.field}>
              <span style={S.label}>작물 키</span>
              <input name="crop_key" style={S.input} placeholder="예: pepper" />
            </label>

            <label style={S.field}>
              <span style={S.label}>이슈 키</span>
              <input name="issue_key" style={S.input} placeholder="예: thrips" />
            </label>

            <label style={S.field}>
              <span style={S.label}>시작일</span>
              <input name="start_at" type="datetime-local" style={S.input} />
            </label>

            <label style={S.field}>
              <span style={S.label}>종료일</span>
              <input name="end_at" type="datetime-local" style={S.input} />
            </label>

            <label style={{ ...S.checkboxWrap, gridColumn: "1 / -1" }}>
              <input name="is_active" type="checkbox" defaultChecked />
              <span>즉시 활성화</span>
            </label>

            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" style={S.primaryButton}>
                저장하기
              </button>
            </div>
          </form>
        </section>

        <section style={S.card}>
          <h2 style={S.sectionTitle}>등록된 버튼</h2>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>버튼명</th>
                  <th style={S.th}>링크</th>
                  <th style={S.th}>월</th>
                  <th style={S.th}>시즌</th>
                  <th style={S.th}>작물</th>
                  <th style={S.th}>이슈</th>
                  <th style={S.th}>우선순위</th>
                  <th style={S.th}>활성</th>
                  <th style={S.th}>동작</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={S.emptyTd}>
                      아직 등록된 빠른 해결 버튼이 없습니다.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td style={S.tdStrong}>{row.label}</td>
                      <td style={S.td}>{row.link_url}</td>
                      <td style={S.td}>{row.month_key ?? "-"}</td>
                      <td style={S.td}>{row.season_key ?? "-"}</td>
                      <td style={S.td}>{row.crop_key ?? "-"}</td>
                      <td style={S.td}>{row.issue_key ?? "-"}</td>
                      <td style={S.td}>{row.priority}</td>
                      <td style={S.td}>{row.is_active ? "활성" : "비활성"}</td>
                      <td style={S.td}>
                        <form action={toggleAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <input
                            type="hidden"
                            name="nextValue"
                            value={row.is_active ? "false" : "true"}
                          />
                          <button type="submit" style={row.is_active ? S.offButton : S.onButton}>
                            {row.is_active ? "비활성화" : "활성화"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "24px 16px 40px",
  },
  container: {
    maxWidth: 1280,
    margin: "0 auto",
    display: "grid",
    gap: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 12,
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#16a34a",
    letterSpacing: 0.5,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 34,
    fontWeight: 950,
    letterSpacing: -0.8,
  },
  desc: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.7,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
  },
  formGrid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 800,
    color: "#334155",
  },
  input: {
    height: 46,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
  },
  checkboxWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
  },
  primaryButton: {
    border: "none",
    background: "#15803d",
    color: "#fff",
    borderRadius: 14,
    padding: "12px 18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  tableWrap: {
    marginTop: 16,
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 980,
  },
  th: {
    textAlign: "left",
    fontSize: 13,
    color: "#475569",
    fontWeight: 900,
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  td: {
    fontSize: 14,
    color: "#334155",
    padding: "12px 10px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  },
  tdStrong: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 800,
    padding: "12px 10px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  },
  emptyTd: {
    padding: "24px 10px",
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
  },
  onButton: {
    border: "1px solid #16a34a",
    background: "#f0fdf4",
    color: "#166534",
    borderRadius: 12,
    padding: "8px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  offButton: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#475569",
    borderRadius: 12,
    padding: "8px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
};