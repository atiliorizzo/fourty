export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export const SUITS: readonly Suit[] = ["hearts", "diamonds", "clubs", "spades"];

export const ALL_RANKS: readonly Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const PERRO_RANKS: readonly Rank[] = ["8", "9", "10"];

export const PLAY_RANKS: readonly Rank[] = ALL_RANKS.filter((rank) => !PERRO_RANKS.includes(rank));

const SUM_VALUE_BY_RANK: Partial<Record<Rank, number>> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
};

export function sumValueOf(rank: Rank): number | undefined {
  return SUM_VALUE_BY_RANK[rank];
}

export function createFullDeck(): Card[] {
  return SUITS.flatMap((suit) => ALL_RANKS.map((rank) => ({ suit, rank })));
}

export function createPlayDeck(): Card[] {
  return SUITS.flatMap((suit) => PLAY_RANKS.map((rank) => ({ suit, rank })));
}

export function createPerros(): Card[] {
  return SUITS.flatMap((suit) => PERRO_RANKS.map((rank) => ({ suit, rank })));
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
