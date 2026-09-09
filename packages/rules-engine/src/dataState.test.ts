import { describe, expect, it } from "vitest";
import type { Card } from "./cards.js";
import { createPlayDeck } from "./cards.js";
import type { CreateDataStateInput } from "./dataState.js";
import { announceRonda, claimFalla, createDataState, playCard, playCardForSuma } from "./dataState.js";

const card = (rank: Card["rank"], suit: Card["suit"] = "hearts"): Card => ({ rank, suit });

function makeState(overrides: Partial<CreateDataStateInput> = {}) {
  return createDataState({
    players: ["p1", "p2"],
    teamOf: { p1: "t1", p2: "t2" },
    hands: { p1: [], p2: [] },
    remainingDeck: [],
    ...overrides,
  });
}

describe("createDataState", () => {
  it("starts with an empty table, zero points and no captures", () => {
    const state = makeState();
    expect(state.table).toEqual([]);
    expect(state.pointsByTeam).toEqual({ t1: 0, t2: 0 });
    expect(state.capturedByTeam).toEqual({ t1: [], t2: [] });
    expect(state.rondaWindowOpen).toBe(true);
    expect(state.isOver).toBe(false);
  });
});

describe("announceRonda", () => {
  it("scores 2 points for a ronda (3 of a kind)", () => {
    const hand = [card("7", "hearts"), card("7", "diamonds"), card("7", "clubs"), card("2"), card("K")];
    const state = makeState({ hands: { p1: hand, p2: [] } });

    const result = announceRonda(state, "p1");

    expect(result.events).toEqual([{ type: "ronda-announced", player: "p1", rank: "7", points: 2 }]);
    expect(result.state.pointsByTeam.t1).toBe(2);
  });

  it("scores 4 points for a doble ronda under the official ruleset", () => {
    const hand = [card("J", "hearts"), card("J", "diamonds"), card("J", "clubs"), card("J", "spades")];
    const state = makeState({ hands: { p1: hand, p2: [] } });

    const result = announceRonda(state, "p1");

    expect(result.events).toEqual([
      { type: "doble-ronda-announced", player: "p1", rank: "J", outcome: "points", points: 4 },
    ]);
    expect(result.state.pointsByTeam.t1).toBe(4);
  });

  it("scores only 2 points for a doble ronda when 'todo vale 2' is active", () => {
    const hand = [card("J", "hearts"), card("J", "diamonds"), card("J", "clubs"), card("J", "spades")];
    const state = makeState({ hands: { p1: hand, p2: [] }, houseRules: { dobleRondaAutoWin: false, allPlaysWorth2: true, allowThreeCardSumForLimpia: true } });

    const result = announceRonda(state, "p1");
    expect(result.state.pointsByTeam.t1).toBe(2);
  });

  it("ends the data instantly for a doble ronda under the casa/barrio auto-win variant", () => {
    const hand = [card("J", "hearts"), card("J", "diamonds"), card("J", "clubs"), card("J", "spades")];
    const state = makeState({ hands: { p1: hand, p2: [] }, houseRules: { dobleRondaAutoWin: true, allPlaysWorth2: false, allowThreeCardSumForLimpia: true } });

    const result = announceRonda(state, "p1");

    expect(result.events).toEqual([{ type: "doble-ronda-announced", player: "p1", rank: "J", outcome: "auto-win" }]);
    expect(result.state.isOver).toBe(true);
    expect(result.state.pointsByTeam.t1).toBe(0);
  });

  it("rejects the announcement if the hand has no 3-or-4-of-a-kind", () => {
    const hand = [card("A"), card("2"), card("3"), card("4"), card("5")];
    const state = makeState({ hands: { p1: hand, p2: [] } });

    const result = announceRonda(state, "p1");
    expect(result.events).toEqual([{ type: "ronda-rejected", player: "p1", reason: "no-set" }]);
  });

  it("rejects the announcement once the ronda window has closed", () => {
    const hand = [card("7", "hearts"), card("7", "diamonds"), card("7", "clubs")];
    const kingCard = card("K");
    let state = makeState({ hands: { p1: [kingCard], p2: hand } });

    ({ state } = playCard(state, "p1", kingCard));
    const result = announceRonda(state, "p2");

    expect(result.events).toEqual([{ type: "ronda-rejected", player: "p2", reason: "window-closed" }]);
  });
});

describe("playCard", () => {
  it("rejects a play out of turn", () => {
    const state = makeState({ hands: { p1: [card("5")], p2: [card("6")] } });
    const result = playCard(state, "p2", card("6"));
    expect(result.events).toEqual([{ type: "play-rejected", player: "p2", reason: "not-your-turn" }]);
  });

  it("rejects a card the player doesn't actually have", () => {
    const state = makeState({ hands: { p1: [card("5")], p2: [] } });
    const result = playCard(state, "p1", card("6"));
    expect(result.events).toEqual([{ type: "play-rejected", player: "p1", reason: "card-not-in-hand" }]);
  });

  it("just puts the card on the table when it doesn't match anything", () => {
    const five = card("5");
    const state = makeState({ hands: { p1: [five], p2: [card("K")] } });
    const result = playCard(state, "p1", five);

    expect(result.events).toEqual([{ type: "no-caida", player: "p1", card: five }]);
    expect(result.state.table).toEqual([five]);
    expect(result.state.currentTurnIndex).toBe(1);
  });

  it("scores 2 points for a normal caída and moves captured cards to the team's pile", () => {
    const kingCard = card("K");
    const queenCard = card("Q");
    const sevenA = card("7", "hearts");
    const sevenB = card("7", "diamonds");
    const padding1 = card("2");
    const padding2 = card("3");

    let state = makeState({
      hands: { p1: [kingCard, sevenA, padding1], p2: [queenCard, sevenB, padding2] },
    });

    ({ state } = playCard(state, "p1", kingCard));
    ({ state } = playCard(state, "p2", queenCard));
    ({ state } = playCard(state, "p1", sevenA));
    const result = playCard(state, "p2", sevenB);

    expect(result.events).toEqual([
      { type: "caida", player: "p2", captured: [sevenA, sevenB], points: 2, isLimpia: false, isCaidaARonda: false },
    ]);
    expect(result.state.table).toEqual([kingCard, queenCard]);
    expect(result.state.capturedByTeam.t2).toEqual([sevenA, sevenB]);
    expect(result.state.pointsByTeam.t2).toBe(2);
  });

  it("scores 4 points (caída a una ronda) when capturing a card the opposing team announced as a ronda", () => {
    const sixA = card("6", "hearts");
    const sixB = card("6", "diamonds");
    const sixC = card("6", "clubs");
    const sixD = card("6", "spades");

    let state = makeState({ hands: { p1: [sixA, sixB, sixC], p2: [sixD] } });

    ({ state } = announceRonda(state, "p1"));
    expect(state.pointsByTeam.t1).toBe(2);

    ({ state } = playCard(state, "p1", sixA));
    const result = playCard(state, "p2", sixD);

    expect(result.events).toEqual([
      { type: "caida", player: "p2", captured: [sixA, sixD], points: 4, isLimpia: true, isCaidaARonda: true },
    ]);
    expect(result.state.pointsByTeam.t2).toBe(4);
  });

  it("ends the data and awards leftover table cards to the last capturing team once hands and deck run out", () => {
    const kingCard = card("K");
    const queenCard = card("Q");
    const sevenA = card("7", "hearts");
    const sevenB = card("7", "diamonds");

    let state = makeState({ hands: { p1: [kingCard, sevenA], p2: [queenCard, sevenB] } });

    ({ state } = playCard(state, "p1", kingCard));
    ({ state } = playCard(state, "p2", queenCard));
    ({ state } = playCard(state, "p1", sevenA));
    const result = playCard(state, "p2", sevenB);

    expect(result.events.map((event) => event.type)).toEqual(["caida", "leftover-table-awarded", "data-over"]);
    expect(result.state.isOver).toBe(true);
    expect(result.state.table).toEqual([]);
    expect(result.state.capturedByTeam.t2).toEqual([sevenA, sevenB, kingCard, queenCard]);
  });

  it("deals a new mano and reopens the ronda window when hands empty but the deck still has cards", () => {
    const deck = createPlayDeck();
    const p1Card = deck[0];
    const p2Card = deck[1];
    const remainingDeck = deck.slice(2, 12);

    let state = makeState({ hands: { p1: [p1Card], p2: [p2Card] }, remainingDeck });

    ({ state } = playCard(state, "p1", p1Card));
    const result = playCard(state, "p2", p2Card);

    expect(result.events.some((event) => event.type === "new-deal-within-data")).toBe(true);
    expect(result.state.hands.p1).toHaveLength(5);
    expect(result.state.hands.p2).toHaveLength(5);
    expect(result.state.remainingDeck).toHaveLength(0);
    expect(result.state.rondaWindowOpen).toBe(true);
    expect(result.state.isOver).toBe(false);
  });
});

describe("playCardForSuma", () => {
  it("scores 2 points for a valid suma and detects the resulting limpia", () => {
    const two = card("2");
    const three = card("3");
    const five = card("5", "spades");

    let state = makeState({ hands: { p1: [two, five], p2: [three] } });

    ({ state } = playCard(state, "p1", two));
    ({ state } = playCard(state, "p2", three));
    const result = playCardForSuma(state, "p1", five, [two, three]);

    expect(result.events[0]).toEqual({
      type: "suma",
      player: "p1",
      captured: [two, three, five],
      points: 2,
      isLimpia: true,
    });
    expect(result.state.pointsByTeam.t1).toBe(2);
  });

  it("rejects an invalid suma selection without changing the state", () => {
    const two = card("2");
    const padding = card("K");
    const five = card("5", "spades");

    let state = makeState({ hands: { p1: [two, five], p2: [padding] } });

    ({ state } = playCard(state, "p1", two));
    ({ state } = playCard(state, "p2", padding));
    const result = playCardForSuma(state, "p1", five, [two]);

    expect(result.events).toEqual([{ type: "play-rejected", player: "p1", reason: "invalid-suma" }]);
    expect(result.state).toBe(state);
  });
});

describe("claimFalla", () => {
  it("scores 2 points when the target team truly captured nothing", () => {
    const state = makeState();
    const result = claimFalla(state, "t1", "t2");

    expect(result.events).toEqual([{ type: "falla", claimingTeam: "t1", targetTeam: "t2", points: 2 }]);
    expect(result.state.pointsByTeam.t1).toBe(2);
  });

  it("rejects the claim if the target team actually captured something", () => {
    const state = makeState();
    const stateWithCapture = { ...state, capturedByTeam: { ...state.capturedByTeam, t2: [card("5")] } };

    const result = claimFalla(stateWithCapture, "t1", "t2");
    expect(result.events).toEqual([{ type: "falla-rejected", claimingTeam: "t1", targetTeam: "t2" }]);
  });
});
