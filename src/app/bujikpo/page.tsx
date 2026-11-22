import BujikpoClient from "./BujikpoClient";

export const metadata = {
  title: "부직포 계산기 — 내 밭엔 몇 롤, 핀 몇 개? | K-Agri Expo",
  description: "두둑 폭·길이·줄 수나 평수만 넣으면 서리방지 부직포 몇 롤, 고정핀 몇 개가 필요한지 바로 계산합니다. 핀 꽂는 법과 쿠팡리뷰 순위 TOP 5.",
};

/** 서리방지 부직포 계산기 — /bujikpo */
export default function Page() {
  return <BujikpoClient />;
}
