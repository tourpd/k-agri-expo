import { redirect } from "next/navigation";

// 예전 /booth 화면은 코드에 직접 써 넣은 가짜 부스 6개를 보여줬습니다.
// 실제 참여 부스 목록으로 보냅니다.
export default function BoothIndexRedirect() {
  redirect("/expo/booths");
}
