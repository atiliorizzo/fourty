import type { Card } from "./cards.js";
import { rankAfter } from "./cards.js";

export interface CaidaResult {
  isCaida: boolean;
  captured: Card[];
}

export function resolveCaida(playedCard: Card, tableCards: readonly Card[]): CaidaResult {
  const directMatches = tableCards.filter((card) => card.rank === playedCard.rank);
  if (directMatches.length === 0) {
    return { isCaida: false, captured: [] };
  }

  const captured = [...directMatches, playedCard];
  let remainingTable = tableCards.filter((card) => !directMatches.includes(card));

  let currentRank = playedCard.rank;
  for (let nextRank = rankAfter(currentRank); nextRank; nextRank = rankAfter(currentRank)) {
    const nextCard = remainingTable.find((card) => card.rank === nextRank);
    if (!nextCard) {
      break;
    }
    captured.push(nextCard);
    remainingTable = remainingTable.filter((card) => card !== nextCard);
    currentRank = nextRank;
  }

  return { isCaida: true, captured };
}
