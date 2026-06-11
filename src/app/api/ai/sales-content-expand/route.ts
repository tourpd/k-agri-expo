import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const productName = body.productName || "선택 제품";

  return NextResponse.json({
    ok: true,
    productName,
    expansion: {
      detailPageTitle: `${productName} 상세페이지 초안`,
      fourCutComic: [
        "농민이 겪는 문제 제기",
        "제품을 발견하는 장면",
        "사용 후 변화",
        "공동구매 신청 유도",
      ],
      eightCutWebtoon: [
        "문제 상황",
        "농민 고민",
        "전문가 등장",
        "제품 설명",
        "사용 장면",
        "변화",
        "이웃 반응",
        "구매 유도",
      ],
      shortsIdeas: [
        "코믹형: 옆집 농부가 먼저 써본 이유",
        "공포형: 방치하면 손해 보는 농사 문제",
        "다큐형: 실제 농민 사용 스토리",
        "예능형: 농민 퀴즈와 제품 소개",
      ],
      homeShoppingScript: `${productName}을 농민의 실제 고민에서 출발해 설명하는 홈쇼핑형 대본`,
      reviewQuestions: [
        "사용 전 가장 큰 고민은 무엇이었나요?",
        "사용 후 어떤 변화가 있었나요?",
        "다른 농민에게 추천한다면 이유는 무엇인가요?",
      ],
    },
  });
}
