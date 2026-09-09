import type { Card, Rank } from "./cards.js";

export type RondaKind = "ronda" | "doble-ronda";

export interface RondaDetection {
  kind: RondaKind;
  rank: Rank;
}

export function detectRonda(hand: readonly Card[]): RondaDetection | undefined {
  const countByRank = new Map<Rank, number>();
  for (const card of hand) {
    countByRank.set(card.rank, (countByRank.get(card.rank) ?? 0) + 1);
  }

  for (const [rank, count] of countByRank) {
    if (count === 4) {
      return { kind: "doble-ronda", rank };
    }
  }
  for (const [rank, count] of countByRank) {
    if (count === 3) {
      return { kind: "ronda", rank };
    }
  }
  return undefined;
}
