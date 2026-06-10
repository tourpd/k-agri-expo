export type MusicVideoStyle = {
  id: string;
  label: string;
  description: string;
  bestFor: string[];
};

export const musicVideoLibrary: MusicVideoStyle[] = [
  {
    id: "trot_music_video",
    label: "트로트 뮤직비디오",
    description: "구수한 가사, 반복 후렴, 농촌 무대, 어르신 공감.",
    bestFor: ["agriculture", "health", "produce"],
  },
  {
    id: "emotional_ballad",
    label: "감성 발라드 MV",
    description: "가족, 부모님, 농민의 고생, 따뜻한 감정선.",
    bestFor: ["health", "healing", "futurefood"],
  },
  {
    id: "hiphop_music_video",
    label: "힙합 MV",
    description: "빠른 컷, 강한 비트, 신제품·농기계·드론 홍보용.",
    bestFor: ["machinery", "drone", "smartfarm"],
  },
  {
    id: "dance_challenge",
    label: "댄스 챌린지",
    description: "반복 동작, 짧은 후킹, 쇼츠 확산형.",
    bestFor: ["processed", "produce", "farmtour", "health"],
  },
  {
    id: "rural_folk_song",
    label: "농촌 포크송",
    description: "편안한 기타, 농촌 풍경, 산지직송·체험농장에 적합.",
    bestFor: ["produce", "farmtour", "healing"],
  },
  {
    id: "retro_7080",
    label: "7080 복고 MV",
    description: "중장년층 감성, 추억, 가족 선물, 건강식품에 적합.",
    bestFor: ["health", "processed", "fishery"],
  },
];
