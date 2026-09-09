import { describe, expect, it } from "vitest";
import { createPlayDeck } from "./cards.js";
import { dealAllHands, dealHand } from "./dealing.js";

describe("dealHand", () => {
  it("deals 5 cards to each of 2 players, in round-robin order", () => {
    const deck = createPlayDeck();
    const { hands, remainingDeck } = dealHand(deck, 2);

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
    const { hands, remainingDeck } = dealHand(deck, 4);

    expect(hands).toHaveLength(4);
    for (const hand of hands) {
      expect(hand).toHaveLength(5);
    }
    expect(remainingDeck).toHaveLength(deck.length - 20);
  });

  it("throws if there aren't enough cards left", () => {
    const deck = createPlayDeck().slice(0, 9);
    expect(() => dealHand(deck, 2)).toThrow();
  });
});

describe("dealAllHands", () => {
  it("splits a 40-card deck into 4 deals for 2 players", () => {
    const deck = createPlayDeck();
    const deals = dealAllHands(deck, 2);

    expect(deals).toHaveLength(4);
    for (const deal of deals) {
      expect(deal).toHaveLength(2);
      expect(deal[0]).toHaveLength(5);
      expect(deal[1]).toHaveLength(5);
    }
  });

  it("splits a 40-card deck into 2 deals for 4 players", () => {
    const deck = createPlayDeck();
    const deals = dealAllHands(deck, 4);

    expect(deals).toHaveLength(2);
    for (const deal of deals) {
      expect(deal).toHaveLength(4);
    }
  });

  it("uses every card exactly once, with no duplicates", () => {
    const deck = createPlayDeck();
    const deals = dealAllHands(deck, 2);

    const allDealtCards = deals.flat(2);
    expect(allDealtCards).toHaveLength(deck.length);

    const unique = new Set(allDealtCards.map((card) => `${card.rank}-${card.suit}`));
    expect(unique.size).toBe(deck.length);
  });
});
