import type { Card } from "./cards.js";
import { sweepConsecutiveUpward } from "./consecutiveSweep.js";

export interface CaidaResult {
  isCaida: boolean;
  captured: Card[];
}

export function resolveCaida(playedCard: Card, tableCards: readonly Card[]): CaidaResult {
  const directMatches = tableCards.filter((card) => card.rank === playedCard.rank);
  if (directMatches.length === 0) {
    return { isCaida: false, captured: [] };
  }

  const remainingTable = tableCards.filter((card) => !directMatches.includes(card));
  const swept = sweepConsecutiveUpward(playedCard.rank, remainingTable);

  return { isCaida: true, captured: [...directMatches, playedCard, ...swept] };
}
