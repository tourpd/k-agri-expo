import { NextRequest, NextResponse } from "next/server";

import {
  enqueueBroadcastDiscovery,
  type HunterDiscoveryInput,
} from "@/lib/jopd-broadcast-hunter/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<HunterDiscoveryInput>;

    const result = enqueueBroadcastDiscovery({
      sourceRegistryId: body.sourceRegistryId,
      title: String(body.title || ""),
      url: String(body.url || ""),
      platform: body.platform,
      domain: body.domain,
      publishedAt: body.publishedAt ?? null,
      discoveredBy: String(body.discoveredBy || ""),
      discoveryReason: body.discoveryReason,
    });

    return NextResponse.json({
      ok: true,
      inserted: result.inserted,
      duplicate: !result.inserted,
      item: result.item,
    });
  } catch (error) {
    console.error("[JOPD BROADCAST HUNTER DISCOVER]", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Broadcast Hunter 등록 실패",
      },
      { status: 400 }
    );
  }
}
