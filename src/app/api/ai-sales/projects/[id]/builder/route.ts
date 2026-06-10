import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

function safeId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function filePath(id: string) {
  return path.join(process.cwd(), ".data", "ai-sales-builders", `${safeId(id)}.json`);
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const raw = await readFile(filePath(id), "utf-8");
    return NextResponse.json({
      success: true,
      data: JSON.parse(raw),
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: null,
    });
  }
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  await mkdir(path.join(process.cwd(), ".data", "ai-sales-builders"), {
    recursive: true,
  });

  const payload = {
    projectId: id,
    projectName: body.projectName || "이름 없는 상세페이지",
    cards: body.cards || [],
    lastChange: body.lastChange || null,
    html: body.html || "",
    updatedAt: new Date().toISOString(),
  };

  await writeFile(filePath(id), JSON.stringify(payload, null, 2), "utf-8");

  return NextResponse.json({
    success: true,
    data: payload,
  });
}
