import type { Card } from "./cards.js";

export type PlayerCount = 2 | 4;

export const CARDS_PER_HAND = 5;

export interface DealtMano {
  hands: Card[][];
  remainingDeck: Card[];
}

export function dealMano(deck: readonly Card[], numPlayers: PlayerCount): DealtMano {
  const cardsNeeded = CARDS_PER_HAND * numPlayers;
  if (deck.length < cardsNeeded) {
    throw new Error(`No hay suficientes cartas para repartir: se necesitan ${cardsNeeded}, quedan ${deck.length}`);
  }

  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  for (let round = 0; round < CARDS_PER_HAND; round++) {
    for (let player = 0; player < numPlayers; player++) {
      hands[player].push(deck[round * numPlayers + player]);
    }
  }

  return { hands, remainingDeck: deck.slice(cardsNeeded) };
}

export function dealAllManos(deck: readonly Card[], numPlayers: PlayerCount): Card[][][] {
  const cardsPerMano = CARDS_PER_HAND * numPlayers;
  if (deck.length % cardsPerMano !== 0) {
    throw new Error(
      `El mazo (${deck.length} cartas) no se reparte exacto entre ${numPlayers} jugadores de a ${CARDS_PER_HAND} cartas por mano`
    );
  }

  const manos: Card[][][] = [];
  let remaining: readonly Card[] = deck;
  while (remaining.length > 0) {
    const { hands, remainingDeck } = dealMano(remaining, numPlayers);
    manos.push(hands);
    remaining = remainingDeck;
  }
  return manos;
}
