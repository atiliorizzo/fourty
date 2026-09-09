import type { Card, Rank } from "./cards.js";
import { rankAfter } from "./cards.js";

export function sweepConsecutiveUpward(fromRank: Rank, remainingTable: readonly Card[]): Card[] {
  const captured: Card[] = [];
  let table = [...remainingTable];
  let currentRank = fromRank;

  for (let nextRank = rankAfter(currentRank); nextRank; nextRank = rankAfter(currentRank)) {
    const nextCard = table.find((card) => card.rank === nextRank);
    if (!nextCard) {
      break;
    }
    captured.push(nextCard);
    table = table.filter((card) => card !== nextCard);
    currentRank = nextRank;
  }

  return captured;
}
