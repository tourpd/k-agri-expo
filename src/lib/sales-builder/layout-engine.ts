import { BuilderCard } from "./card-types";

export function buildMondrianLayout(
  cards: BuilderCard[]
) {
  return cards.map((card) => ({
    ...card,
    x: 0,
    y: 0,
  }));
}