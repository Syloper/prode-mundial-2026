import { describe, it, expect } from "vitest";
import { calculatePoints, calculatePointsBreakdown } from "./scoringHelpers";

describe("calculatePoints — fase de grupos", () => {
  it("devuelve 3 puntos por resultado exacto", () => {
    expect(calculatePoints(2, 1, 2, 1)).toBe(3);
    expect(calculatePoints(0, 0, 0, 0)).toBe(3);
    expect(calculatePoints(3, 2, 3, 2)).toBe(3);
  });

  it("devuelve 1 punto por acertar el ganador (local)", () => {
    expect(calculatePoints(2, 0, 3, 1)).toBe(1);
    expect(calculatePoints(1, 0, 4, 2)).toBe(1);
  });

  it("devuelve 1 punto por acertar el ganador (visitante)", () => {
    expect(calculatePoints(0, 1, 1, 3)).toBe(1);
    expect(calculatePoints(1, 2, 0, 2)).toBe(1);
  });

  it("devuelve 1 punto por acertar empate (sin resultado exacto)", () => {
    expect(calculatePoints(1, 1, 2, 2)).toBe(1);
    expect(calculatePoints(0, 0, 1, 1)).toBe(1);
  });

  it("devuelve 0 puntos cuando no acierta nada", () => {
    expect(calculatePoints(2, 0, 0, 1)).toBe(0);
    expect(calculatePoints(0, 1, 1, 0)).toBe(0);
    expect(calculatePoints(1, 1, 2, 0)).toBe(0);
    expect(calculatePoints(2, 0, 1, 1)).toBe(0);
  });
});

describe("calculatePoints — eliminación directa con penales", () => {
  const knockout = true;

  it("empate exacto + penales correctos suma 5 pts", () => {
    expect(
      calculatePoints(2, 2, 2, 2, "home", "home", knockout)
    ).toBe(5);
  });

  it("empate no exacto + penales correctos suma 3 pts", () => {
    expect(
      calculatePoints(1, 1, 2, 2, "home", "home", knockout)
    ).toBe(3);
  });

  it("empate exacto sin acertar penales suma 3 pts", () => {
    expect(
      calculatePoints(2, 2, 2, 2, "home", "away", knockout)
    ).toBe(3);
  });

  it("sin empate en predicción no suma bonus de penales aunque acierte ganador en 90'", () => {
    expect(
      calculatePoints(2, 1, 2, 1, null, null, knockout)
    ).toBe(3);
  });

  it("predicción sin empate en partido que va a penales da 0", () => {
    expect(
      calculatePoints(2, 1, 2, 2, null, "home", knockout)
    ).toBe(0);
  });

  it("tercer puesto no aplica bonus de penales", () => {
    expect(
      calculatePoints(2, 2, 2, 2, "home", "home", false)
    ).toBe(3);
  });
});

describe("calculatePointsBreakdown", () => {
  it("desglosa base y bonus por separado", () => {
    expect(
      calculatePointsBreakdown(2, 2, 2, 2, "away", "away", true)
    ).toEqual({ total: 5, base: 3, penaltyBonus: 2 });
  });
});
