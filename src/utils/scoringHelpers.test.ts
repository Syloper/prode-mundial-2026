import { describe, it, expect } from "vitest";
import { calculatePoints } from "./scoringHelpers";

describe("calculatePoints", () => {
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
    expect(calculatePoints(2, 0, 0, 1)).toBe(0); // predice local, gana visitante
    expect(calculatePoints(0, 1, 1, 0)).toBe(0); // predice visitante, gana local
    expect(calculatePoints(1, 1, 2, 0)).toBe(0); // predice empate, gana local
    expect(calculatePoints(2, 0, 1, 1)).toBe(0); // predice local, empata
  });

  it("maneja goleadas correctamente", () => {
    expect(calculatePoints(5, 0, 5, 0)).toBe(3); // exacto
    expect(calculatePoints(4, 0, 5, 0)).toBe(1); // acerta ganador
    expect(calculatePoints(0, 1, 5, 0)).toBe(0); // no acierta
  });
});
