import { NextRequest, NextResponse } from "next/server";

import {
  discoverYouTubeSource,
  type YouTubeDiscoveryRequest,
} from "@/lib/jopd-broadcast-hunter/youtube-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body =
      (await req.json()) as Partial<YouTubeDiscoveryRequest>;

    const sourceRegistryId = String(
      body.sourceRegistryId || ""
    ).trim();

    const channelUrl = String(
      body.channelUrl || ""
    ).trim();

    const domain = String(
      body.domain || ""
    ).trim();

    if (!sourceRegistryId) {
      throw new Error("sourceRegistryId가 필요합니다.");
    }

    if (!channelUrl) {
      throw new Error("channelUrl이 필요합니다.");
    }

    if (!domain) {
      throw new Error("domain이 필요합니다.");
    }

    const result = discoverYouTubeSource({
      sourceRegistryId,
      channelUrl,
      domain,
      platform: body.platform || "YOUTUBE",
      includeKeywords: Array.isArray(
        body.includeKeywords
      )
        ? body.includeKeywords.map(String)
        : [],
      maxItems:
        typeof body.maxItems === "number"
          ? body.maxItems
          : 50,
    });

    return NextResponse.json({
      ok: true,
      sourceRegistryId,
      ...result,
    });
  } catch (error) {
    console.error(
      "[JOPD BROADCAST HUNTER YOUTUBE SCAN]",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "YouTube Hunter scan 실패",
      },
      { status: 400 }
    );
  }
}
