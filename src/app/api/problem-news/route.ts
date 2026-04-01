import { NextResponse } from "next/server";
import { convertNewsToContent } from "@/lib/newsToContent";

export async function GET() {

  const res = await fetch("http://localhost:3000/api/agri-news")
  const news = await res.json()

  const contents = convertNewsToContent(news)

  return NextResponse.json(contents)
}