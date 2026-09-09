import type { Card } from "./cards.js";

export function isFalla(teamCapturedCards: readonly Card[]): boolean {
  return teamCapturedCards.length === 0;
}
