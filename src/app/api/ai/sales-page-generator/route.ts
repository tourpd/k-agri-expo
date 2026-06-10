import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  industry?: string;
  product?: string;
  target?: string;
  problem?: string;
  cropOrField?: string;
  price?: string;
  benefit?: string;
  proof?: string;
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const product = body.product?.trim() || "제품명 미입력";
    const target = body.target?.trim() || "타겟 미입력";
    const problem = body.problem?.trim() || "고객 고민 미입력";
    const cropOrField = body.cropOrField?.trim() || "작물/분야 미입력";
    const price = body.price?.trim() || "가격/판매조건 미입력";
    const benefit = body.benefit?.trim() || "핵심 효과 미입력";
    const proof = body.proof?.trim() || "증거자료 미입력";
    const notes = body.notes?.trim() || "추가 메모 없음";

    const result = {
      success: true,
      page: {
        hero: {
          headline: `${problem} 때문에 고민이신가요?`,
          subheadline: `${target}을 위한 ${product} 안내`,
          cta: "지금 상담 / 공동구매 신청하기",
        },
        problem: {
          title: "지금 농가가 겪는 문제",
          body: `${cropOrField} 현장에서 가장 큰 고민은 ${problem}입니다. 문제를 늦게 발견하면 비용과 손해가 커질 수 있습니다.`,
        },
        empathy: {
          title: "농민이 불안한 이유",
          bullets: [
            "지금 안 하면 손해가 커질 수 있다",
            "옆집은 이미 준비했을 수 있다",
            "품질과 수확량 차이가 벌어질 수 있다",
          ],
        },
        solution: {
          title: `해결책: ${product}`,
          body: `${product}는 ${target}이 원하는 결과인 ${benefit}에 맞춰 제안됩니다.`,
        },
        proof: {
          title: "신뢰 자료",
          body: proof,
        },
        price: {
          title: "가격 / 판매조건",
          body: price,
        },
        video: {
          title: "현장 영상",
          body: "쇼츠, 유튜브, 사용 장면 영상을 연결합니다.",
        },
        order: {
          title: "신청 / 주문",
          fields: ["이름", "전화번호", "지역", "작물", "면적", "수량", "메모"],
          cta: "신청하기",
        },
        crm: {
          title: "CRM 자동관리",
          tags: [target, cropOrField, problem, product],
          followup: "상담 후 3일, 7일, 30일 재구매 문자 예약",
        },
      },
      rawText: `
━━━━━━━━━━━━━━━━━━
AI 판매페이지 구성
━━━━━━━━━━━━━━━━━━

1. 첫 화면
${problem} 때문에 고민이신가요?
${target}을 위한 ${product}

2. 문제
${cropOrField} 현장에서 ${problem}은 농민의 손해로 바로 연결될 수 있습니다.

3. 공감
지금 안 하면 늦을 수 있습니다.
옆집은 이미 준비했을 수 있습니다.
품질과 수확량 차이가 벌어질 수 있습니다.

4. 해결
${product}

5. 핵심 효과
${benefit}

6. 증거자료
${proof}

7. 가격 / 조건
${price}

8. 신청폼
이름 / 전화번호 / 지역 / 작물 / 면적 / 수량 / 메모

9. CRM
태그: ${target}, ${cropOrField}, ${problem}, ${product}
재구매 문자 예약

10. 추가 메모
${notes}
`,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("sales-page-generator error:", error);
    return NextResponse.json(
      { success: false, result: "AI 판매페이지 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
