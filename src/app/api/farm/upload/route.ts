import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    image_url: "https://dummy-image.com/test.jpg"
  });
}
