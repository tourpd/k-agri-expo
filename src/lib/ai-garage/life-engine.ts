export function analyzeLife(text:string){

  const t=text.toLowerCase();

  return {
    couple:
      t.includes("아내") ||
      t.includes("부부"),

    camping:
      t.includes("차박") ||
      t.includes("캠핑"),

    creator:
      t.includes("유튜브") ||
      t.includes("촬영"),

    fishing:
      t.includes("낚시"),

    office:
      t.includes("사무실"),

    farming:
      t.includes("농장"),

    travel:
      t.includes("여행")
  };
}
