import { describe, expect, it } from "vitest";
import type { Card } from "./cards.js";
import { detectRonda } from "./ronda.js";

const card = (rank: Card["rank"], suit: Card["suit"] = "hearts"): Card => ({ rank, suit });

describe("detectRonda", () => {
  it("detects a ronda when the hand has exactly 3 cards of the same rank", () => {
    const hand = [card("7", "hearts"), card("7", "diamonds"), card("7", "clubs"), card("2"), card("K")];
    const result = detectRonda(hand);

    expect(result).toEqual({ kind: "ronda", rank: "7" });
  });

  it("detects a doble-ronda when the hand has 4 cards of the same rank", () => {
    const hand = [
      card("J", "hearts"),
      card("J", "diamonds"),
      card("J", "clubs"),
      card("J", "spades"),
      card("K"),
    ];
    const result = detectRonda(hand);

    expect(result).toEqual({ kind: "doble-ronda", rank: "J" });
  });

  it("returns undefined for a hand with no matching set", () => {
    const hand = [card("A"), card("2"), card("3"), card("4"), card("5")];
    expect(detectRonda(hand)).toBeUndefined();
  });

  it("returns undefined for a hand with only a pair (2 of a kind)", () => {
    const hand = [card("A", "hearts"), card("A", "diamonds"), card("2"), card("3"), card("4")];
    expect(detectRonda(hand)).toBeUndefined();
  });
});
