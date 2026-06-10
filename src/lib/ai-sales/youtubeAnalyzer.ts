export type YoutubeAnalyzeInput = {
  youtube_url: string;
};

export function extractYoutubeId(url: string) {
  const v = String(url || "").trim();

  if (v.includes("youtu.be/")) {
    return v.split("youtu.be/")[1]?.split("?")[0] || "";
  }

  if (v.includes("watch?v=")) {
    return v.split("watch?v=")[1]?.split("&")[0] || "";
  }

  if (v.includes("youtube.com/shorts/")) {
    return v.split("youtube.com/shorts/")[1]?.split("?")[0] || "";
  }

  if (v.includes("youtube.com/embed/")) {
    return v.split("youtube.com/embed/")[1]?.split("?")[0] || "";
  }

  return "";
}

export async function analyzeYoutubeForSalesPage(input: YoutubeAnalyzeInput) {
  const videoId = extractYoutubeId(input.youtube_url);

  if (!videoId) {
    throw new Error("유튜브 영상 ID를 찾을 수 없습니다.");
  }

  return {
    video_id: videoId,
    youtube_url: input.youtube_url,
    thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,

    summary:
      "유튜브 영상 링크를 기반으로 제품 설명, 농민 문제, 구매 포인트를 추출할 준비가 완료되었습니다.",

    farmer_problem_candidates: [
      "영상 속 농민이 겪는 실제 문제를 추출합니다.",
      "제품이 해결하는 작물·병해충·생육 문제를 추출합니다.",
      "농민이 바로 반응할 수 있는 문장을 생성합니다.",
    ],

    headline_candidates: [
      "농민이 겪는 문제를 한 줄로 잡아내는 헤드라인을 생성합니다.",
      "제품명이 아니라 농민의 고민을 앞세운 문구를 만듭니다.",
      "영상 속 핵심 장면을 판매 문구로 바꿉니다.",
    ],

    page_sections: [
      "영상 핵심 문제",
      "농민 공감 포인트",
      "제품 해결력",
      "사용 장면",
      "후기성 멘트",
      "구매 유도 문구",
    ],

    image_prompts: [
      "유튜브 영상 내용을 바탕으로 광고형 상단 배너 이미지 생성",
      "농민이 겪는 문제를 보여주는 상세페이지 이미지 생성",
      "제품 사용 장면을 강조하는 이미지 생성",
      "구매를 유도하는 CTA 이미지 생성",
    ],

    short_video_plan: [
      "0~3초: 농민 문제 제기",
      "3~10초: 피해 또는 고민 장면",
      "10~20초: 제품 등장과 해결 메시지",
      "20~30초: 구매 유도 문구",
    ],
  };
}