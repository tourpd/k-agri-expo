import { BuilderCard } from "./card-types";

export function parseAiResultToCards(
  result: string
): BuilderCard[] {
  const cards: BuilderCard[] = [];

  const sections = [
    {
      keyword: "SECTION 01",
      type: "hero",
      size: "3x2",
    },
    {
      keyword: "SECTION 02",
      type: "problem",
      size: "2x1",
    },
    {
      keyword: "SECTION 03",
      type: "compare",
      size: "2x1",
    },
    {
      keyword: "SECTION 04",
      type: "proof",
      size: "2x1",
    },
    {
      keyword: "SECTION 05",
      type: "usage",
      size: "2x1",
    },
    {
      keyword: "SECTION 06",
      type: "review",
      size: "2x1",
    },
    {
      keyword: "SECTION 07",
      type: "cta",
      size: "3x1",
    },
  ];

  sections.forEach((section, index) => {
    cards.push({
      id: crypto.randomUUID(),
      type: section.type as any,
      title: section.keyword,
      content: result,
      size: section.size as any,
      visible: true,
      sortOrder: index,
    });
  });

  return cards;
}