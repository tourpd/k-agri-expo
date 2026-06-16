import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(v: string) {
  return String(v || "")
    .replaceAll("제충박사", "제균박사")
    .replaceAll("제충박스", "제균박사")
    .replaceAll("제균박스", "제균박사");
}

function recommendProducts(text: string) {
  const t = normalizeText(text);
  const products: string[] = [];

  if (t.includes("병해") || t.includes("탄저") || t.includes("곰팡") || t.includes("역병")) {
    products.push("제균박사");
  }
  if (t.includes("충") || t.includes("총채") || t.includes("담배나방") || t.includes("진딧물")) {
    products.push("싹쓰리충");
  }
  if (t.includes("활착") || t.includes("뿌리") || t.includes("생육") || t.includes("스트레스")) {
    products.push("아미65");
  }
  if (t.includes("칼슘") || t.includes("착과") || t.includes("비대")) {
    products.push("칼슘제");
  }

  return [...new Set(products)].slice(0, 3);
}

function fallbackTop5(actions: any[]) {
  const seen = new Set<string>();

  return actions
    .map((a) => {
      const merged = normalizeText(
        `${a.symptom || ""} ${a.cause || ""} ${a.countermeasure || ""} ${a.action_instruction || ""}`
      );

      return {
        priority: 0,
        title: normalizeText(a.countermeasure || a.symptom || "오늘 작업"),
        reason: normalizeText(a.cause || a.symptom || "생육관리 필요"),
        action: normalizeText(a.action_instruction || a.countermeasure || ""),
        risk_level: a.risk_level || "중간",
        products: recommendProducts(merged),
        ppl_note: "",
      };
    })
    .filter((a) => {
      const key = a.action.slice(0, 24);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5)
    .map((a, i) => ({ ...a, priority: i + 1 }));
}

function safeJson(text: string) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const crop = String(body.crop || "");
    const month = String(body.month || "");
    const actions = Array.isArray(body.actions) ? body.actions : [];
    const manualProducts = Array.isArray(body.manualProducts) ? body.manualProducts : [];

    if (actions.length === 0) {
      return NextResponse.json({ top5: [], sms: "" });
    }

    let top5: any[] = [];

    if (!process.env.OPENAI_API_KEY) {
      top5 = fallbackTop5(actions);
    } else {
      const prompt = `
너는 K-AGRI 농민 행동엔진이다.

아래 행동지시 목록을 농민에게 오늘 보낼 TOP5 작업지시로 압축하라.

중요 교정:
- "제충박사"는 틀린 표현이다. 반드시 "제균박사"로 고쳐라.
- 제품명 후보: 제균박사, 싹쓰리충, 아미65, 칼슘제, 켈팍, K-PLUS

조건:
- 중복 제거
- 반드시 최대한 5개 생성
- 농민이 바로 행동할 수 있는 짧은 문장
- 설명보다 지시
- 위험도 높은 작업 우선
- 관련 추천제품이 있으면 products 배열에 넣기
- PPL 문구는 ppl_note에 비워두거나 짧게 작성
- JSON 배열만 출력

형식:
{
  "priority": 1,
  "title": "작업명",
  "reason": "이유",
  "action": "농민 행동지시",
  "risk_level": "높음|중간|낮음",
  "products": ["제균박사"],
  "ppl_note": "공동구매 연결 가능"
}

작물: ${crop}
월: ${month}

원본 행동지시:
${JSON.stringify(actions, null, 2)}
`;

      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: prompt,
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        top5 = fallbackTop5(actions);
      } else {
        const data = await res.json();
        const text = data.output_text || data.output?.[0]?.content?.[0]?.text || "";
        top5 = safeJson(text).slice(0, 5);
      }
    }

    top5 = top5.map((a: any, i: number) => {
      const merged = normalizeText(`${a.title || ""} ${a.reason || ""} ${a.action || ""}`);
      const autoProducts = Array.isArray(a.products) && a.products.length
        ? a.products.map((p: string) => normalizeText(p))
        : recommendProducts(merged);

      const manual = manualProducts
        .map((p: any) => normalizeText(String(p.name || p || "")))
        .filter(Boolean);

      const products = [...new Set([...autoProducts, ...manual])].slice(0, 5);

      return {
        priority: i + 1,
        title: normalizeText(a.title || "오늘 작업"),
        reason: normalizeText(a.reason || ""),
        action: normalizeText(a.action || ""),
        risk_level: a.risk_level || "중간",
        products,
        ppl_note: normalizeText(a.ppl_note || ""),
      };
    });

    const sms =
      `${crop} ${month} 농가 행동알림\n\n` +
      top5.map((a: any) => {
        const p = a.products?.length ? `\n추천제품: ${a.products.join(", ")}` : "";
        return `${a.priority}. ${a.action}${p}`;
      }).join("\n\n") +
      "\n\nK-AGRI 농민 행동엔진";

    return NextResponse.json({ top5, sms });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "TOP5 생성 실패" },
      { status: 500 }
    );
  }
}
