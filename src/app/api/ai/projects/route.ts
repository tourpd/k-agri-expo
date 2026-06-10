import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    message: "AI Projects API",
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Project created",
  });
}
