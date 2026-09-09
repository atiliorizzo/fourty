import type { Card } from "./cards.js";
import { sumValueOf } from "./cards.js";
import { sweepConsecutiveUpward } from "./consecutiveSweep.js";

export interface SumaOptions {
  /** House rule: allows combining 3 table cards instead of 2, but only if the result leaves the table clean (limpia). */
  allowThreeCardSumForLimpia?: boolean;
}

export interface SumaResult {
  isValidSuma: boolean;
  captured: Card[];
}

const INVALID: SumaResult = { isValidSuma: false, captured: [] };

export function resolveSuma(
  playedCard: Card,
  selectedTableCards: readonly Card[],
  tableCards: readonly Card[],
  options: SumaOptions = {}
): SumaResult {
  const allowThreeCardSumForLimpia = options.allowThreeCardSumForLimpia ?? true;

  const playedValue = sumValueOf(playedCard.rank);
  if (playedValue === undefined) {
    return INVALID;
  }

  if (selectedTableCards.length !== 2 && selectedTableCards.length !== 3) {
    return INVALID;
  }

  const allSelectedAreOnTable = selectedTableCards.every((selected) => tableCards.includes(selected));
  if (!allSelectedAreOnTable) {
    return INVALID;
  }

  const values = selectedTableCards.map((card) => sumValueOf(card.rank));
  if (values.some((value) => value === undefined)) {
    return INVALID;
  }

  const total = values.reduce((sum: number, value) => sum + (value as number), 0);
  if (total !== playedValue) {
    return INVALID;
  }

  const remainingTable = tableCards.filter((card) => !selectedTableCards.includes(card));
  const swept = sweepConsecutiveUpward(playedCard.rank, remainingTable);

  if (selectedTableCards.length === 3) {
    if (!allowThreeCardSumForLimpia) {
      return INVALID;
    }
    const tableAfter = remainingTable.filter((card) => !swept.includes(card));
    if (tableAfter.length !== 0) {
      return INVALID;
    }
  }

  return { isValidSuma: true, captured: [...selectedTableCards, playedCard, ...swept] };
}
