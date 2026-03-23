export type HallLayout = {
  hallId: string;
  title: string;
  // ex) A01~A30 같은 슬롯 목록
  slots: string[];
  // grid 컬럼 수(지도처럼 보이게)
  cols: number;
};

function range(n: number) {
  return Array.from({ length: n }, (_, i) => i + 1);
}

function makeSlots(prefix: string, count: number) {
  // A01, A02 ... A30
  return range(count).map((i) => `${prefix}${String(i).padStart(2, "0")}`);
}

export const HALL_LAYOUTS: Record<string, HallLayout> = {
  "agri-inputs": {
    hallId: "agri-inputs",
    title: "농자재관",
    slots: makeSlots("A", 30),
    cols: 6, // 6x5 그리드
  },
  machinery: {
    hallId: "machinery",
    title: "농기계관",
    slots: makeSlots("B", 30),
    cols: 6,
  },
  smartfarm: {
    hallId: "smartfarm",
    title: "스마트팜관",
    slots: makeSlots("C", 24),
    cols: 6,
  },
  seeds: {
    hallId: "seeds",
    title: "종자관",
    slots: makeSlots("D", 24),
    cols: 6,
  },
};