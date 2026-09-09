import type { Card, Rank } from "./cards.js";
import { resolveCaida } from "./caida.js";
import type { PlayerCount } from "./dealing.js";
import { dealHand } from "./dealing.js";
import { DEFAULT_HOUSE_RULES, type HouseRules } from "./houseRules.js";
import { isFalla } from "./falla.js";
import { isLimpia } from "./limpia.js";
import type { RondaKind } from "./ronda.js";
import { detectRonda } from "./ronda.js";
import { resolveSuma } from "./suma.js";

export type PlayerId = string;
export type TeamId = string;

export interface RondaAnnouncement {
  player: PlayerId;
  kind: RondaKind;
  rank: Rank;
}

export interface DataState {
  players: PlayerId[];
  teamOf: Record<PlayerId, TeamId>;
  hands: Record<PlayerId, Card[]>;
  table: Card[];
  capturedByTeam: Record<TeamId, Card[]>;
  pointsByTeam: Record<TeamId, number>;
  remainingDeck: Card[];
  currentTurnIndex: number;
  rondaWindowOpen: boolean;
  announcedRondas: RondaAnnouncement[];
  lastCapturingTeam?: TeamId;
  houseRules: HouseRules;
  isOver: boolean;
}

export type DataEvent =
  | { type: "ronda-announced"; player: PlayerId; rank: Rank; points: number }
  | { type: "doble-ronda-announced"; player: PlayerId; rank: Rank; outcome: "points" | "auto-win"; points?: number }
  | { type: "ronda-rejected"; player: PlayerId; reason: "window-closed" | "no-set" }
  | { type: "play-rejected"; player: PlayerId; reason: "not-your-turn" | "card-not-in-hand" | "invalid-suma" }
  | { type: "no-caida"; player: PlayerId; card: Card }
  | { type: "caida"; player: PlayerId; captured: Card[]; points: number; isLimpia: boolean; isCaidaARonda: boolean }
  | { type: "suma"; player: PlayerId; captured: Card[]; points: number; isLimpia: boolean }
  | { type: "falla"; claimingTeam: TeamId; targetTeam: TeamId; points: number }
  | { type: "falla-rejected"; claimingTeam: TeamId; targetTeam: TeamId }
  | { type: "new-deal-within-data" }
  | { type: "leftover-table-awarded"; team: TeamId; cards: Card[] }
  | { type: "data-over" };

export interface ActionResult {
  state: DataState;
  events: DataEvent[];
}

export interface CreateDataStateInput {
  players: PlayerId[];
  teamOf: Record<PlayerId, TeamId>;
  hands: Record<PlayerId, Card[]>;
  remainingDeck: Card[];
  houseRules?: HouseRules;
}

export function createDataState(input: CreateDataStateInput): DataState {
  const capturedByTeam: Record<TeamId, Card[]> = {};
  const pointsByTeam: Record<TeamId, number> = {};
  for (const team of new Set(Object.values(input.teamOf))) {
    capturedByTeam[team] = [];
    pointsByTeam[team] = 0;
  }

  return {
    players: input.players,
    teamOf: input.teamOf,
    hands: input.hands,
    table: [],
    capturedByTeam,
    pointsByTeam,
    remainingDeck: input.remainingDeck,
    currentTurnIndex: 0,
    rondaWindowOpen: true,
    announcedRondas: [],
    houseRules: input.houseRules ?? DEFAULT_HOUSE_RULES,
    isOver: false,
  };
}

function addPoints(state: DataState, team: TeamId, points: number): DataState {
  return { ...state, pointsByTeam: { ...state.pointsByTeam, [team]: state.pointsByTeam[team] + points } };
}

function nextTurnIndex(state: DataState): number {
  return (state.currentTurnIndex + 1) % state.players.length;
}

function wasAnnouncedByOpposingTeam(state: DataState, capturingPlayer: PlayerId, rank: Rank): boolean {
  const capturingTeam = state.teamOf[capturingPlayer];
  return state.announcedRondas.some(
    (announcement) => announcement.rank === rank && state.teamOf[announcement.player] !== capturingTeam
  );
}

export function announceRonda(state: DataState, playerId: PlayerId): ActionResult {
  if (!state.rondaWindowOpen) {
    return { state, events: [{ type: "ronda-rejected", player: playerId, reason: "window-closed" }] };
  }

  const detection = detectRonda(state.hands[playerId]);
  if (!detection) {
    return { state, events: [{ type: "ronda-rejected", player: playerId, reason: "no-set" }] };
  }

  const team = state.teamOf[playerId];
  const announcement: RondaAnnouncement = { player: playerId, kind: detection.kind, rank: detection.rank };
  const stateWithAnnouncement: DataState = { ...state, announcedRondas: [...state.announcedRondas, announcement] };

  if (detection.kind === "ronda") {
    const points = 2;
    return {
      state: addPoints(stateWithAnnouncement, team, points),
      events: [{ type: "ronda-announced", player: playerId, rank: detection.rank, points }],
    };
  }

  if (state.houseRules.dobleRondaAutoWin) {
    return {
      state: { ...stateWithAnnouncement, isOver: true },
      events: [{ type: "doble-ronda-announced", player: playerId, rank: detection.rank, outcome: "auto-win" }],
    };
  }

  const points = state.houseRules.allPlaysWorth2 ? 2 : 4;
  return {
    state: addPoints(stateWithAnnouncement, team, points),
    events: [{ type: "doble-ronda-announced", player: playerId, rank: detection.rank, outcome: "points", points }],
  };
}

export function playCard(state: DataState, playerId: PlayerId, card: Card): ActionResult {
  const rejection = validateTurn(state, playerId, card);
  if (rejection) {
    return { state, events: [rejection] };
  }

  const newHand = state.hands[playerId].filter((c) => c !== card);
  const caidaResult = resolveCaida(card, state.table);

  if (!caidaResult.isCaida) {
    const newState: DataState = {
      ...state,
      hands: { ...state.hands, [playerId]: newHand },
      table: [...state.table, card],
      rondaWindowOpen: false,
      currentTurnIndex: nextTurnIndex(state),
    };
    return advance(newState, [{ type: "no-caida", player: playerId, card }]);
  }

  const team = state.teamOf[playerId];
  const isCaidaARonda = wasAnnouncedByOpposingTeam(state, playerId, card.rank);
  const points = isCaidaARonda ? 4 : 2;
  const limpia = isLimpia(state.table, caidaResult.captured);
  const remainingTable = state.table.filter((c) => !caidaResult.captured.includes(c));

  let newState: DataState = {
    ...state,
    hands: { ...state.hands, [playerId]: newHand },
    table: remainingTable,
    capturedByTeam: { ...state.capturedByTeam, [team]: [...state.capturedByTeam[team], ...caidaResult.captured] },
    lastCapturingTeam: team,
    rondaWindowOpen: false,
    currentTurnIndex: nextTurnIndex(state),
  };
  newState = addPoints(newState, team, points);

  return advance(newState, [
    { type: "caida", player: playerId, captured: caidaResult.captured, points, isLimpia: limpia, isCaidaARonda },
  ]);
}

export function playCardForSuma(
  state: DataState,
  playerId: PlayerId,
  card: Card,
  selectedTableCards: Card[]
): ActionResult {
  const rejection = validateTurn(state, playerId, card);
  if (rejection) {
    return { state, events: [rejection] };
  }

  const sumaResult = resolveSuma(card, selectedTableCards, state.table, {
    allowThreeCardSumForLimpia: state.houseRules.allowThreeCardSumForLimpia,
  });
  if (!sumaResult.isValidSuma) {
    return { state, events: [{ type: "play-rejected", player: playerId, reason: "invalid-suma" }] };
  }

  const team = state.teamOf[playerId];
  const points = 2;
  const limpia = isLimpia(state.table, sumaResult.captured);
  const newHand = state.hands[playerId].filter((c) => c !== card);
  const remainingTable = state.table.filter((c) => !sumaResult.captured.includes(c));

  let newState: DataState = {
    ...state,
    hands: { ...state.hands, [playerId]: newHand },
    table: remainingTable,
    capturedByTeam: { ...state.capturedByTeam, [team]: [...state.capturedByTeam[team], ...sumaResult.captured] },
    lastCapturingTeam: team,
    rondaWindowOpen: false,
    currentTurnIndex: nextTurnIndex(state),
  };
  newState = addPoints(newState, team, points);

  return advance(newState, [
    { type: "suma", player: playerId, captured: sumaResult.captured, points, isLimpia: limpia },
  ]);
}

export function claimFalla(state: DataState, claimingTeam: TeamId, targetTeam: TeamId): ActionResult {
  if (!isFalla(state.capturedByTeam[targetTeam] ?? [])) {
    return { state, events: [{ type: "falla-rejected", claimingTeam, targetTeam }] };
  }
  const points = 2;
  return {
    state: addPoints(state, claimingTeam, points),
    events: [{ type: "falla", claimingTeam, targetTeam, points }],
  };
}

function validateTurn(state: DataState, playerId: PlayerId, card: Card): DataEvent | undefined {
  if (state.players[state.currentTurnIndex] !== playerId) {
    return { type: "play-rejected", player: playerId, reason: "not-your-turn" };
  }
  if (!state.hands[playerId].includes(card)) {
    return { type: "play-rejected", player: playerId, reason: "card-not-in-hand" };
  }
  return undefined;
}

function advance(state: DataState, events: DataEvent[]): ActionResult {
  const allHandsEmpty = state.players.every((player) => state.hands[player].length === 0);
  if (!allHandsEmpty) {
    return { state, events };
  }

  if (state.remainingDeck.length === 0) {
    let finalState = state;
    const extraEvents: DataEvent[] = [];
    if (state.table.length > 0 && state.lastCapturingTeam) {
      const team = state.lastCapturingTeam;
      finalState = {
        ...state,
        capturedByTeam: { ...state.capturedByTeam, [team]: [...state.capturedByTeam[team], ...state.table] },
        table: [],
      };
      extraEvents.push({ type: "leftover-table-awarded", team, cards: state.table });
    }
    finalState = { ...finalState, isOver: true };
    extraEvents.push({ type: "data-over" });
    return { state: finalState, events: [...events, ...extraEvents] };
  }

  const { hands: dealtHands, remainingDeck } = dealHand(state.remainingDeck, state.players.length as PlayerCount);
  const hands: Record<PlayerId, Card[]> = {};
  state.players.forEach((player, index) => {
    hands[player] = dealtHands[index];
  });

  const newState: DataState = { ...state, hands, remainingDeck, rondaWindowOpen: true };
  return { state: newState, events: [...events, { type: "new-deal-within-data" }] };
}
