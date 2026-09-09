import { describe, expect, it } from "vitest";
import { createPlayDeck } from "./cards.js";
import { dealAllManos, dealMano } from "./dealing.js";

describe("dealMano", () => {
  it("deals 5 cards to each of 2 players, in round-robin order", () => {
    const deck = createPlayDeck();
    const { hands, remainingDeck } = dealMano(deck, 2);

    expect(hands).toHaveLength(2);
    expect(hands[0]).toHaveLength(5);
    expect(hands[1]).toHaveLength(5);
    expect(hands[0][0]).toEqual(deck[0]);
    expect(hands[1][0]).toEqual(deck[1]);
    expect(hands[0][1]).toEqual(deck[2]);
    expect(remainingDeck).toHaveLength(deck.length - 10);
  });

  it("deals 5 cards to each of 4 players", () => {
    const deck = createPlayDeck();
    const { hands, remainingDeck } = dealMano(deck, 4);

    expect(hands).toHaveLength(4);
    for (const hand of hands) {
      expect(hand).toHaveLength(5);
    }
    expect(remainingDeck).toHaveLength(deck.length - 20);
  });

  it("throws if there aren't enough cards left", () => {
    const deck = createPlayDeck().slice(0, 9);
    expect(() => dealMano(deck, 2)).toThrow();
  });
});

describe("dealAllManos", () => {
  it("splits a 40-card deck into 4 manos for 2 players", () => {
    const deck = createPlayDeck();
    const manos = dealAllManos(deck, 2);

    expect(manos).toHaveLength(4);
    for (const mano of manos) {
      expect(mano).toHaveLength(2);
      expect(mano[0]).toHaveLength(5);
      expect(mano[1]).toHaveLength(5);
    }
  });

  it("splits a 40-card deck into 2 manos for 4 players", () => {
    const deck = createPlayDeck();
    const manos = dealAllManos(deck, 4);

    expect(manos).toHaveLength(2);
    for (const mano of manos) {
      expect(mano).toHaveLength(4);
    }
  });

  it("uses every card exactly once, with no duplicates", () => {
    const deck = createPlayDeck();
    const manos = dealAllManos(deck, 2);

    const allDealtCards = manos.flat(2);
    expect(allDealtCards).toHaveLength(deck.length);

    const unique = new Set(allDealtCards.map((card) => `${card.rank}-${card.suit}`));
    expect(unique.size).toBe(deck.length);
  });
});
