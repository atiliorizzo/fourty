import { describe, expect, it } from "vitest";
import {
  createFullDeck,
  createPerros,
  createPlayDeck,
  PERRO_RANKS,
  shuffle,
  sumValueOf,
} from "./cards.js";

describe("createFullDeck", () => {
  it("has 52 unique cards", () => {
    const deck = createFullDeck();
    const unique = new Set(deck.map((card) => `${card.rank}-${card.suit}`));
    expect(deck).toHaveLength(52);
    expect(unique.size).toBe(52);
  });

  it("has 13 ranks in each of the 4 suits", () => {
    const deck = createFullDeck();
    for (const suit of ["hearts", "diamonds", "clubs", "spades"] as const) {
      expect(deck.filter((card) => card.suit === suit)).toHaveLength(13);
    }
  });
});

describe("createPlayDeck", () => {
  it("has 40 cards", () => {
    expect(createPlayDeck()).toHaveLength(40);
  });

  it("never includes an 8, 9 or 10", () => {
    const deck = createPlayDeck();
    for (const card of deck) {
      expect(PERRO_RANKS).not.toContain(card.rank);
    }
  });
});

describe("createPerros", () => {
  it("has 12 cards, only 8s, 9s and 10s", () => {
    const perros = createPerros();
    expect(perros).toHaveLength(12);
    for (const card of perros) {
      expect(PERRO_RANKS).toContain(card.rank);
    }
  });
});

describe("createPlayDeck + createPerros", () => {
  it("together reconstruct the full 52-card deck", () => {
    const combined = createPlayDeck().length + createPerros().length;
    expect(combined).toBe(52);
  });
});

describe("sumValueOf", () => {
  it("returns the numeric value for A through 7", () => {
    expect(sumValueOf("A")).toBe(1);
    expect(sumValueOf("5")).toBe(5);
    expect(sumValueOf("7")).toBe(7);
  });

  it("returns undefined for face cards", () => {
    expect(sumValueOf("J")).toBeUndefined();
    expect(sumValueOf("Q")).toBeUndefined();
    expect(sumValueOf("K")).toBeUndefined();
  });
});

describe("shuffle", () => {
  it("keeps every original card, just reordered", () => {
    const deck = createPlayDeck();
    const shuffled = shuffle(deck, () => 0.999999);
    expect(shuffled).toHaveLength(deck.length);
    expect([...shuffled].sort(byRankAndSuit)).toEqual([...deck].sort(byRankAndSuit));
  });

  it("does not mutate the original array", () => {
    const deck = createPlayDeck();
    const original = [...deck];
    shuffle(deck, () => 0.5);
    expect(deck).toEqual(original);
  });
});

function byRankAndSuit(a: { rank: string; suit: string }, b: { rank: string; suit: string }): number {
  return `${a.rank}-${a.suit}`.localeCompare(`${b.rank}-${b.suit}`);
}
