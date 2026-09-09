import { describe, expect, it } from "vitest";
import type { Card } from "./cards.js";
import { isFalla } from "./falla.js";

const card = (rank: Card["rank"], suit: Card["suit"] = "hearts"): Card => ({ rank, suit });

describe("isFalla", () => {
  it("is true when a team captured no cards at all", () => {
    expect(isFalla([])).toBe(true);
  });

  it("is false as soon as a team captured at least one card", () => {
    expect(isFalla([card("5")])).toBe(false);
  });
});
