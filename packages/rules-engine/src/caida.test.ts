import { describe, expect, it } from "vitest";
import type { Card } from "./cards.js";
import { resolveCaida } from "./caida.js";

const card = (rank: Card["rank"], suit: Card["suit"] = "hearts"): Card => ({ rank, suit });

describe("resolveCaida", () => {
  it("is not a caída when no table card matches the rank played", () => {
    const result = resolveCaida(card("5"), [card("3"), card("K")]);
    expect(result.isCaida).toBe(false);
    expect(result.captured).toEqual([]);
  });

  it("captures the matching table card plus the played card", () => {
    const table = [card("3", "clubs"), card("5", "diamonds"), card("K", "spades")];
    const result = resolveCaida(card("5", "hearts"), table);

    expect(result.isCaida).toBe(true);
    expect(result.captured).toEqual([card("5", "diamonds"), card("5", "hearts")]);
  });

  it("leaves non-matching table cards untouched (only returns what was captured)", () => {
    const table = [card("3", "clubs"), card("5", "diamonds"), card("K", "spades")];
    const result = resolveCaida(card("5", "hearts"), table);

    expect(result.captured).not.toContainEqual(card("3", "clubs"));
    expect(result.captured).not.toContainEqual(card("K", "spades"));
  });

  it("captures every table card matching the rank, if more than one is present", () => {
    const table = [card("7", "clubs"), card("7", "diamonds")];
    const result = resolveCaida(card("7", "hearts"), table);

    expect(result.isCaida).toBe(true);
    expect(result.captured).toHaveLength(3);
  });

  it("ignores suit — only rank matters for a caída", () => {
    const result = resolveCaida(card("J", "spades"), [card("J", "hearts")]);
    expect(result.isCaida).toBe(true);
  });
});

describe("resolveCaida — barrido de consecutivas", () => {
  it("sweeps consecutive ranks upward (5,6,7,J,Q,K playing a 6 leaves only the 5)", () => {
    const table = [card("5"), card("6"), card("7"), card("J"), card("Q"), card("K")];
    const result = resolveCaida(card("6", "spades"), table);

    expect(result.isCaida).toBe(true);
    expect(result.captured).toHaveLength(6);
    expect(result.captured).not.toContainEqual(card("5"));
  });

  it("does not sweep ranks below the played card", () => {
    const table = [card("4"), card("5"), card("6")];
    const result = resolveCaida(card("5", "spades"), table);

    expect(result.captured).toContainEqual(card("6"));
    expect(result.captured).toHaveLength(3);
    const leftOnTable = table.filter((c) => !result.captured.includes(c));
    expect(leftOnTable).toEqual([card("4")]);
  });

  it("stops the sweep at the first gap in the sequence", () => {
    const table = [card("6"), card("7"), card("K")];
    const result = resolveCaida(card("6", "spades"), table);

    expect(result.captured).toHaveLength(3);
    const leftOnTable = table.filter((c) => !result.captured.includes(c));
    expect(leftOnTable).toEqual([card("K")]);
  });

  it("does not sweep past K (there is no rank after K)", () => {
    const table = [card("K")];
    const result = resolveCaida(card("K", "spades"), table);

    expect(result.captured).toHaveLength(2);
  });

  it("7 connects directly to J in the sequence (8, 9 and 10 are not in play)", () => {
    const table = [card("7"), card("J")];
    const result = resolveCaida(card("7", "spades"), table);

    expect(result.captured).toContainEqual(card("J"));
    expect(result.captured).toHaveLength(3);
  });
});
