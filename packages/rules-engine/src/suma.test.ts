import { describe, expect, it } from "vitest";
import type { Card } from "./cards.js";
import { resolveSuma } from "./suma.js";

const card = (rank: Card["rank"], suit: Card["suit"] = "hearts"): Card => ({ rank, suit });

describe("resolveSuma — caso básico de 2 cartas", () => {
  it("captura 2 cartas de la mesa que suman el valor de la carta jugada", () => {
    const two = card("2");
    const three = card("3");
    const king = card("K");
    const table = [two, three, king];
    const played = card("5", "spades");

    const result = resolveSuma(played, [two, three], table);

    expect(result.isValidSuma).toBe(true);
    expect(result.captured).toEqual([two, three, played]);
  });

  it("rechaza la combinación si la suma no da el valor exacto", () => {
    const two = card("2");
    const three = card("3");
    const table = [two, three];
    const played = card("7", "spades");

    const result = resolveSuma(played, [two, three], table);

    expect(result.isValidSuma).toBe(false);
    expect(result.captured).toEqual([]);
  });

  it("rechaza si alguna carta seleccionada no está realmente en la mesa", () => {
    const two = card("2");
    const three = card("3");
    const notOnTable = card("4");
    const table = [two, three];

    const result = resolveSuma(card("5", "spades"), [two, notOnTable], table);
    expect(result.isValidSuma).toBe(false);
  });

  it("rechaza si se intenta usar una figura (J/Q/K) dentro de la combinación", () => {
    const jack = card("J");
    const two = card("2");
    const table = [jack, two];

    const result = resolveSuma(card("5", "spades"), [jack, two], table);
    expect(result.isValidSuma).toBe(false);
  });

  it("rechaza si la carta jugada es una figura (J/Q/K) — nunca suman", () => {
    const two = card("2");
    const three = card("3");
    const table = [two, three];

    const result = resolveSuma(card("J", "spades"), [two, three], table);
    expect(result.isValidSuma).toBe(false);
  });

  it("también arrastra el barrido de consecutivas después de la suma", () => {
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

describe("resolveSuma — combinación especial de 3 cartas", () => {
  it("permite sumar 3 cartas si el resultado (con barrido incluido) deja la mesa limpia", () => {
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

  it("rechaza la combinación de 3 cartas si la mesa NO queda limpia", () => {
    const ace = card("A");
    const two = card("2");
    const three = card("3");
    const four = card("4");
    const table = [ace, two, three, four];
    const played = card("6", "spades");

    const result = resolveSuma(played, [ace, two, three], table);

    expect(result.isValidSuma).toBe(false);
  });

  it("rechaza la combinación de 3 cartas si la regla de casa la desactiva, aunque limpiaría la mesa", () => {
    const ace = card("A");
    const two = card("2");
    const three = card("3");
    const table = [ace, two, three];
    const played = card("6", "spades");

    const result = resolveSuma(played, [ace, two, three], table, { allowThreeCardSumForLimpia: false });

    expect(result.isValidSuma).toBe(false);
  });
});
