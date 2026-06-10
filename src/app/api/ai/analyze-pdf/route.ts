import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({
        success: false,
        result: "PDF 파일이 없습니다.",
      });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        result: "OPENAI_API_KEY 없음",
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `
PDF 자료를 OCR 분석하십시오.

반드시 아래 형식으로 작성:

1. 제품명

2. 브랜드

3. 제조사

4. 산업군

5. 주요 작물

6. 주요 성분

7. 사용방법

8. 핵심효과

9. 고객고민

10. 구매이유

11. 광고포인트

12. 공동구매포인트

13. CRM태그

14. 재구매가능성

15. 판매페이지 핵심문구

16. OCR 전체 요약

PDF 안의 글자를 최대한 많이 읽어라.
`,
                },
                {
                  type: "file",
                  file: {
                    filename: file.name,
                    file_data: `data:application/pdf;base64,${base64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 3000,
        }),
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      result:
        data?.choices?.[0]?.message?.content ||
        "PDF 분석 실패",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      result: "PDF 분석 서버 오류",
    });
  }
}