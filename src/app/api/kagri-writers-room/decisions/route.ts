import { NextRequest, NextResponse } from "next/server";

import {
  loadJopdCreativeMemory,
  loadWorkMemory,
  recordJopdDecision,
  type JopdDecision,
} from "@/lib/jopd-writers-room/jopd-memory";

const ALLOWED_DECISIONS = new Set<JopdDecision>([
  "SELECT",
  "REJECT",
  "MODIFY",
  "COMBINE",
]);

export async function GET() {
  try {
    const memory = loadJopdCreativeMemory();

    return NextResponse.json({
      ok: true,
      authority: memory.authority,
      decisionCount: memory.decisions.length,
      decisions: memory.decisions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "JOPD Creative Memory 조회 실패",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const decision = String(
      body?.decision || ""
    ).trim() as JopdDecision;

    const workId = String(
      body?.workId || ""
    ).trim();

    const target = String(
      body?.target || ""
    ).trim();

    const instruction = String(
      body?.instruction || ""
    ).trim();

    const reason = String(
      body?.reason || ""
    ).trim();

    /*
     * 절대 규칙:
     * 자연어에서 결정을 추론하지 않는다.
     * 클라이언트가 SELECT / REJECT / MODIFY / COMBINE 중
     * 하나를 명시적으로 보내야만 기록한다.
     */
    if (!ALLOWED_DECISIONS.has(decision)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "명시적 JOPD decision이 필요합니다: SELECT / REJECT / MODIFY / COMBINE",
        },
        { status: 400 }
      );
    }

    if (!workId) {
      return NextResponse.json(
        {
          ok: false,
          error: "workId가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const work = loadWorkMemory(workId);

    if (!work) {
      return NextResponse.json(
        {
          ok: false,
          error: `존재하지 않는 Work Memory: ${workId}`,
        },
        { status: 404 }
      );
    }

    if (!target || !instruction) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "target과 조PD의 명시적 instruction이 필요합니다.",
        },
        { status: 400 }
      );
    }

    const recorded = recordJopdDecision({
      decision,
      workId,
      target,
      instruction,
      reason: reason || null,
    });

    return NextResponse.json({
      ok: true,
      recorded,
      authority: "JOPD",
      work: {
        workId: work.workId,
        title: work.title,
        status: work.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "JOPD decision 기록 실패",
      },
      { status: 500 }
    );
  }
}
