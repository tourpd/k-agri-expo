import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { image_url } = await req.json();

  if (!image_url) {
    return NextResponse.json(
      { error: "image_url required" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    disease: "탄저병 의심",
    confidence: 0.87,
    action: "살균제 살포",
    follow_up_days: 7
  });
}
