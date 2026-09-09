import type { Card } from "./cards.js";

export function isLimpia(tableBeforePlay: readonly Card[], captured: readonly Card[]): boolean {
  if (tableBeforePlay.length === 0) {
    return false;
  }
  const remaining = tableBeforePlay.filter((card) => !captured.includes(card));
  return remaining.length === 0;
}
