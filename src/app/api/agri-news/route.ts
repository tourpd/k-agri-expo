import { NextResponse } from "next/server";

export async function GET() {

  const news = [
    {
      title: "마늘 총채벌레 피해 증가",
      source: "농촌진흥청",
      url: "https://rda.go.kr",
      summary: "최근 기온 상승으로 총채벌레 피해가 급증하고 있습니다."
    },
    {
      title: "고추 노균병 확산 주의",
      source: "농업신문",
      url: "https://nongmin.com",
      summary: "시설 고추 농가에서 노균병 확산 사례가 보고되었습니다."
    },
    {
      title: "양파 비대기 관리 중요",
      source: "월간원예",
      url: "https://horticulture.kr",
      summary: "양파 비대기에는 칼륨 관리가 수량에 큰 영향을 줍니다."
    }
  ]

  return NextResponse.json(news)
}