export type OutputFormat = {
  id: string;
  label: string;
  description: string;
};

export const outputFormatLibrary: OutputFormat[] = [
  { id: "shorts", label: "유튜브 쇼츠", description: "8초, 15초, 30초 세로형 영상 대본." },
  { id: "reels", label: "릴스", description: "감각적인 짧은 반복형 영상." },
  { id: "tiktok", label: "틱톡", description: "밈, 챌린지, 리액션 중심 영상." },
  { id: "youtube_ad", label: "유튜브 광고", description: "15초, 30초, 45초 광고." },
  { id: "detail_page", label: "상세페이지", description: "히어로, 문제, 해결, 증거, CTA 구성." },
  { id: "landing_page", label: "랜딩페이지", description: "상담·신청 전환 중심 페이지." },
  { id: "groupbuy", label: "공동구매 페이지", description: "마감, 가격, 혜택, 신청 중심." },
  { id: "banner", label: "배너", description: "공포형, 비교형, 혜택형 문구." },
  { id: "sms", label: "문자", description: "90자 이내 전환형 문구." },
  { id: "kakao", label: "카카오톡", description: "친근한 톤의 알림 메시지." },
  { id: "live_script", label: "라이브커머스 대본", description: "진행자 멘트, 혜택, 실시간 CTA." },
  { id: "home_shopping_script", label: "홈쇼핑 대본", description: "쇼호스트형 판매 대본." },
  { id: "music_video", label: "뮤직비디오", description: "제품을 노래·가사·장면으로 홍보." },
];
