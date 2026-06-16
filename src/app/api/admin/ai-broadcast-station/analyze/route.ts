import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanXmlText(v: string) {
  return String(v || "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function fixAgriTerms(v: string) {
  return String(v || "")
    .replaceAll("연면십이", "엽면시비")
    .replaceAll("엽면시위", "엽면시비")
    .replaceAll("제충박사", "제균박사")
    .replaceAll("제충박스", "제균박사")
    .replaceAll("케이플라스", "K-PLUS")
    .replaceAll("케이 플러스", "K-PLUS")
    .replaceAll("K 플러스", "K-PLUS")
    .replaceAll("아미 육십오", "아미65")
    .replaceAll("탄저", "탄저병");
}

function pickTopics(text: string) {
  const candidates = [
    "역병",
    "탄저병",
    "장마",
    "칼슘",
    "엽면시비",
    "제균박사",
    "아미65",
    "K-PLUS",
    "총채벌레",
    "담배나방",
    "활착",
    "뿌리",
    "고추",
  ];

  return candidates.filter((k) => text.includes(k)).slice(0, 8);
}

function makeShorts(subtitles: string[]) {
  const keywords = ["안 됩니다", "주의", "위험", "장마", "탄저병", "역병", "지금", "꼭", "예방", "방제"];
  return subtitles
    .filter((t) => keywords.some((k) => t.includes(k)))
    .slice(0, 10)
    .map((t, i) => ({
      no: i + 1,
      title: `${i + 1}. ${t.slice(0, 28)}...`,
      hook: t,
      shorts_caption: `🔥 ${t}`,
      estimate: i < 3 ? "상" : "중",
    }));
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "FCPXML 파일이 필요합니다." }, { status: 400 });
    }

    const raw = await file.text();

    const titleTexts = Array.from(raw.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g))
      .map((m) => cleanXmlText(m[1]))
      .filter(Boolean);

    const titleAttrTexts = Array.from(raw.matchAll(/value="([^"]+)"/g))
      .map((m) => cleanXmlText(m[1]))
      .filter((v) => v.length > 2 && !v.includes("http"));

    const subtitles = [...titleTexts, ...titleAttrTexts]
      .map(fixAgriTerms)
      .filter((v, i, arr) => v && arr.indexOf(v) === i)
      .slice(0, 400);

    const fullText = subtitles.join("\n");
    const topics = pickTopics(fullText);
    const shorts = makeShorts(subtitles);

    const youtubePost = `📢 고추 6월 농가 행동알림

이번 영상의 핵심은 ${topics.slice(0, 4).join(", ")} 입니다.

✅ 역병과 탄저병은 장마 전 예방이 중요합니다.
✅ 병이 터진 뒤보다 사전에 방제하는 것이 훨씬 유리합니다.
✅ 고추밭 배수와 병해충 예찰을 꼭 확인하세요.

현재 농장 상태를 댓글로 남겨주세요.`;

    const bandPost = `[한국농수산TV 오늘의 농사 알림]

고추 농가분들, 6월에는 역병과 탄저병 관리가 매우 중요합니다.

특히 장마 전에는 병해가 빠르게 번질 수 있으므로 배수관리, 예방방제, 엽면시비를 함께 점검해야 합니다.

오늘 확인할 일
1. 고추밭 배수 상태 확인
2. 역병·탄저병 예방방제
3. 칼슘 및 생육관리
4. 병든 포기 조기 제거
5. 약제 교호살포 확인

여러분 농장의 현재 상태를 사진과 함께 댓글로 공유해주세요.`;

    const tistoryPost = `# 고추 6월 병해충 관리, 역병과 탄저병 예방이 핵심입니다

6월 고추농사에서 가장 중요한 것은 장마 전 병해충 관리입니다. 특히 역병과 탄저병은 한 번 발생하면 빠르게 번질 수 있어 사전 예방이 중요합니다.

## 1. 역병은 물과 함께 움직입니다

역병은 배수불량, 과습, 장마철 환경에서 크게 늘어날 수 있습니다. 고추밭의 배수로를 먼저 점검하고 병든 포기가 보이면 빠르게 제거해야 합니다.

## 2. 탄저병은 예방 중심으로 봐야 합니다

탄저병은 치료보다 예방이 중요합니다. 보호용 살균제와 치료용 살균제를 상황에 맞게 교호살포하는 것이 좋습니다.

## 3. 6월에는 생육관리도 함께 해야 합니다

칼슘, 엽면시비, 뿌리 활착 관리를 함께 진행해야 고추가 장마와 고온 스트레스를 버틸 수 있습니다.

## 결론

6월 고추농사의 핵심은 병이 온 뒤 대응하는 것이 아니라 장마 전 미리 준비하는 것입니다.`;

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      subtitleCount: subtitles.length,
      topics,
      subtitles,
      shorts,
      youtubePost,
      bandPost,
      tistoryPost,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "AI 방송국 분석 실패" },
      { status: 500 }
    );
  }
}
