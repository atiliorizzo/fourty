import type { Card } from "./cards.js";

export type PlayerCount = 2 | 4;

export const CARDS_PER_HAND = 5;

export interface DealtHand {
  hands: Card[][];
  remainingDeck: Card[];
}

export function dealHand(deck: readonly Card[], numPlayers: PlayerCount): DealtHand {
  const cardsNeeded = CARDS_PER_HAND * numPlayers;
  if (deck.length < cardsNeeded) {
    throw new Error(`Not enough cards to deal: need ${cardsNeeded}, only ${deck.length} left`);
  }

  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  for (let round = 0; round < CARDS_PER_HAND; round++) {
    for (let player = 0; player < numPlayers; player++) {
      hands[player].push(deck[round * numPlayers + player]);
    }
  }

  return { hands, remainingDeck: deck.slice(cardsNeeded) };
}

export function dealAllHands(deck: readonly Card[], numPlayers: PlayerCount): Card[][][] {
  const cardsPerDeal = CARDS_PER_HAND * numPlayers;
  if (deck.length % cardsPerDeal !== 0) {
    throw new Error(
      `The deck (${deck.length} cards) does not split evenly across ${numPlayers} players at ${CARDS_PER_HAND} cards each`
    );
  }

  const deals: Card[][][] = [];
  let remaining: readonly Card[] = deck;
  while (remaining.length > 0) {
    const { hands, remainingDeck } = dealHand(remaining, numPlayers);
    deals.push(hands);
    remaining = remainingDeck;
  }
  return deals;
}
