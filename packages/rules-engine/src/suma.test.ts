import { describe, expect, it } from "vitest";
import type { Card } from "./cards.js";
import { resolveSuma } from "./suma.js";

const card = (rank: Card["rank"], suit: Card["suit"] = "hearts"): Card => ({ rank, suit });

describe("resolveSuma — basic 2-card case", () => {
  it("captures 2 table cards that add up to the played card's value", () => {
    const two = card("2");
    const three = card("3");
    const king = card("K");
    const table = [two, three, king];
    const played = card("5", "spades");

    const result = resolveSuma(played, [two, three], table);

    expect(result.isValidSuma).toBe(true);
    expect(result.captured).toEqual([two, three, played]);
  });

  it("rejects the combination if the sum doesn't match exactly", () => {
    const two = card("2");
    const three = card("3");
    const table = [two, three];
    const played = card("7", "spades");

    const result = resolveSuma(played, [two, three], table);

    expect(result.isValidSuma).toBe(false);
    expect(result.captured).toEqual([]);
  });

  it("rejects if a selected card isn't actually on the table", () => {
    const two = card("2");
    const three = card("3");
    const notOnTable = card("4");
    const table = [two, three];

    const result = resolveSuma(card("5", "spades"), [two, notOnTable], table);
    expect(result.isValidSuma).toBe(false);
  });

  it("rejects if a face card (J/Q/K) is part of the combination", () => {
    const jack = card("J");
    const two = card("2");
    const table = [jack, two];

    const result = resolveSuma(card("5", "spades"), [jack, two], table);
    expect(result.isValidSuma).toBe(false);
  });

  it("rejects if the played card is a face card (J/Q/K) — they never sum", () => {
    const two = card("2");
    const three = card("3");
    const table = [two, three];

    const result = resolveSuma(card("J", "spades"), [two, three], table);
    expect(result.isValidSuma).toBe(false);
  });

  it("also carries the consecutive sweep after the suma", () => {
    const two = card("2");
    const three = card("3");
    const six = card("6");
    const sevenCard = card("7");
    const table = [two, three, six, sevenCard];
    const played = card("5", "spades");

    const result = resolveSuma(played, [two, three], table);

    expect(result.isValidSuma).toBe(true);
    expect(result.captured).toEqual([two, three, played, six, sevenCard]);
  });
});

describe("resolveSuma — special 3-card combination", () => {
  it("allows summing 3 cards if the result (sweep included) leaves the table clean", () => {
    const ace = card("A");
    const two = card("2");
    const three = card("3");
    const seven = card("7");
    const jack = card("J");
    const table = [ace, two, three, seven, jack];
    const played = card("6", "spades");

    const result = resolveSuma(played, [ace, two, three], table);

    expect(result.isValidSuma).toBe(true);
    expect(result.captured).toEqual([ace, two, three, played, seven, jack]);
  });

  it("rejects the 3-card combination if the table does NOT end up clean", () => {
    const ace = card("A");
    const two = card("2");
    const three = card("3");
    const four = card("4");
    const table = [ace, two, three, four];
    const played = card("6", "spades");

    const result = resolveSuma(played, [ace, two, three], table);

    expect(result.isValidSuma).toBe(false);
  });

  it("rejects the 3-card combination if the house rule disables it, even if it would clean the table", () => {
    const ace = card("A");
    const two = card("2");
    const three = card("3");
    const table = [ace, two, three];
    const played = card("6", "spades");

    const result = resolveSuma(played, [ace, two, three], table, { allowThreeCardSumForLimpia: false });

    expect(result.isValidSuma).toBe(false);
  });
});
