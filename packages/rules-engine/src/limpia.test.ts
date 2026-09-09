import { describe, expect, it } from "vitest";
import type { Card } from "./cards.js";
import { isLimpia } from "./limpia.js";

const card = (rank: Card["rank"], suit: Card["suit"] = "hearts"): Card => ({ rank, suit });

describe("isLimpia", () => {
  it("is true when every card that was on the table got captured", () => {
    const five = card("5");
    const six = card("6");
    const played = card("5", "spades");
    const table = [five, six];

    expect(isLimpia(table, [five, played, six])).toBe(true);
  });

  it("is false when some table cards remain uncaptured", () => {
    const five = card("5");
    const king = card("K");
    const table = [five, king];

    expect(isLimpia(table, [five])).toBe(false);
  });

  it("is false if the table was already empty before the play (nothing to clean)", () => {
    expect(isLimpia([], [])).toBe(false);
  });
});
