"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function NewsAnalyzerPage() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");

  function generate() {
    setResult(`
농업 뉴스 분석 결과

주제: ${topic || "미입력"}

1. 고객에게 중요한 변화
- 가격, 병해충, 날씨, 정책, 수급 변화를 중심으로 확인해야 합니다.

2. 콘텐츠화 방향
- "이 뉴스가 내 농사에 무슨 상관인가?"를 3초 안에 보여줘야 합니다.

3. 쇼츠 제목
- 고객들 지금 이 뉴스 꼭 봐야 합니다
- 올해 농사 판도 바뀔 수 있습니다
- 이 변화 모르면 손해 봅니다

4. 실행
- 관련 작물/지역/제품과 연결해 광고와 공동구매로 확장합니다.
`);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/sales-automation" className="font-black text-green-700">
          ← AI 판매자동화센터
        </Link>

        <section className="mt-6 rounded-3xl bg-green-800 p-8 text-white">
          <h1 className="text-5xl font-black">농업 뉴스 분석기</h1>
          <p className="mt-4 text-2xl font-bold">뉴스를 고객 행동과 판매전략으로 바꿉니다.</p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={8}
            placeholder="뉴스 내용, 기사 링크, 이슈 메모 입력"
            className="w-full rounded-2xl border p-5 text-xl font-bold"
          />

          <button onClick={generate} className="mt-6 w-full rounded-3xl bg-green-700 py-6 text-3xl font-black text-white">
            뉴스 분석하기
          </button>
        </section>

        {result && (
          <pre className="mt-8 whitespace-pre-wrap rounded-3xl bg-white p-8 text-xl font-bold shadow-xl">
            {result}
          </pre>
        )}
      </div>
    </main>
  );
}
