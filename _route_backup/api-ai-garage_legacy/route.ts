import { NextResponse } from "next/server";

import { analyzeLife }
from "@/lib/ai-garage/life-engine";

import { scoreLife }
from "@/lib/ai-garage/scoring-engine";

import { createDesigns }
from "@/lib/ai-garage/design-engine";

import { createLayout }
from "@/lib/ai-garage/layout-engine";

export async function POST(req: Request) {

  const body = await req.json();

  const profile =
    analyzeLife(
      body.text || ""
    );

  const score =
    scoreLife(profile);

  const designs =
    createDesigns(score);

  const result =
    designs.map(d => ({
      ...d,
      layout: createLayout(d)
    }));

  return NextResponse.json({
    profile,
    score,
    designs: result
  });
}