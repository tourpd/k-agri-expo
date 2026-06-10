import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = String(formData.get("title") || "");
    const period = String(formData.get("period") || "");
    const file = formData.get("file");

    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          error: "제목이 없습니다.",
        },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        {
          ok: false,
          error: "PDF 파일이 없습니다.",
        },
        { status: 400 }
      );
    }

    const result = {
      summary:
        "최근 총채벌레, 노린재, 탄저병 발생 위험이 증가하고 있습니다. 고추·토마토·사과 농가는 예방 방제가 필요합니다.",

      danger_crops: [
        "고추",
        "토마토",
        "사과",
        "배",
      ],

      danger_pests: [
        "총채벌레",
        "노린재",
        "탄저병",
        "과수화상병",
      ],

      recommended_products: [
        "싹쓰리충",
        "멸규니",
        "켈팍",
      ],

      items: [
        {
          crop: "고추",
          pest: "총채벌레",
          risk: "매우높음",
          level: "경보",
          reason: "최근 발생 증가",
          product: "싹쓰리충",
          adCopy:
            "총채벌레가 이미 밭에 들어왔습니다. 지금 방제가 수확량을 결정합니다.",
        },

        {
          crop: "고추",
          pest: "탄저병",
          risk: "높음",
          level: "주의보",
          reason: "장마 전 발생 가능성",
          product: "멸규니",
          adCopy:
            "탄저병은 한 번 시작되면 되돌리기 어렵습니다.",
        },

        {
          crop: "사과",
          pest: "과수화상병",
          risk: "매우높음",
          level: "경보",
          reason: "확산 위험",
          product: "예찰 필요",
          adCopy:
            "과수화상병 의심 증상 발견 즉시 확인이 필요합니다.",
        },
      ],
    };

    return NextResponse.json({
      ok: true,
      title,
      period,
      result,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "분석 실패",
      },
      { status: 500 }
    );
  }
}