import { getSupabaseAdmin } from "@/lib/supabase/admin";

type BoothType = "free" | "basic" | "premium";

type AllocatedSlot = {
  hallId: string;
  slotCode: string;
  usedFallback: boolean;
};

const DEFAULT_HALL_ID = "agri-inputs";

/**
 * 실제 운영용 우선순위 슬롯
 *
 * premium:
 *   앞줄/좋은 자리 우선
 *
 * basic:
 *   중간 구역 우선
 *
 * free:
 *   뒤쪽/여유 구역 우선
 *
 * 필요하면 이 배열 순서만 바꾸면 정책이 바뀝니다.
 */
const SLOT_PRIORITY: Record<BoothType, string[]> = {
  premium: [
    "A1", "A2", "A3", "A4", "A5",
    "B1", "B2", "B3", "B4"
  ],
  basic: [
    "B5",
    "C1", "C2", "C3", "C4", "C5",
    "D1", "D2", "D3", "D4", "D5"
  ],
  free: [
    "E1", "E2", "E3", "E4", "E5",
    "F1", "F2", "F3", "F4", "F5",
    "G1", "G2", "G3", "G4", "G5"
  ],
};

function normalizeBoothType(value: string | null | undefined): BoothType {
  if (value === "premium") return "premium";
  if (value === "basic") return "basic";
  return "free";
}

/**
 * 전체 fallback 슬롯 후보
 * 우선순위 슬롯 외에 빈칸이 있으면 자동 사용
 */
function generateFallbackSlots() {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8];

  const result: string[] = [];
  for (const row of rows) {
    for (const col of cols) {
      result.push(`${row}${col}`);
    }
  }

  return result;
}

async function getOccupiedSlots(hallId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("booths")
    .select("slot_code")
    .eq("hall_id", hallId)
    .eq("is_active", true)
    .not("slot_code", "is", null);

  if (error) {
    throw new Error(error.message || "현재 점유 슬롯 조회 중 오류가 발생했습니다.");
  }

  return new Set(
    (data || [])
      .map((row) => row.slot_code)
      .filter(Boolean)
  );
}

export async function allocateBoothSlot(
  boothTypeRaw: string | null | undefined,
  hallId: string = DEFAULT_HALL_ID
): Promise<AllocatedSlot> {
  const boothType = normalizeBoothType(boothTypeRaw);
  const occupiedSlots = await getOccupiedSlots(hallId);

  const prioritySlots = SLOT_PRIORITY[boothType];

  // 1) 부스 타입별 우선 슬롯 먼저 확인
  for (const slotCode of prioritySlots) {
    if (!occupiedSlots.has(slotCode)) {
      return {
        hallId,
        slotCode,
        usedFallback: false,
      };
    }
  }

  // 2) fallback 슬롯 탐색
  const allFallbackCandidates = generateFallbackSlots();

  for (const slotCode of allFallbackCandidates) {
    if (!occupiedSlots.has(slotCode)) {
      return {
        hallId,
        slotCode,
        usedFallback: true,
      };
    }
  }

  throw new Error("배정 가능한 빈 슬롯이 없습니다.");
}