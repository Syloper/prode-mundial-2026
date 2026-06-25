import { PenaltyWinner } from "./matchHelpers";

export interface PointsBreakdown {
  total: number;
  base: number;
  penaltyBonus: number;
}

export const calculatePointsBreakdown = (
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  predictedPenaltyWinner?: PenaltyWinner | null,
  actualPenaltyWinner?: PenaltyWinner | null,
  supportsPenalties = false
): PointsBreakdown => {
  let base = 0;
  if (predictedHome === actualHome && predictedAway === actualAway) {
    base = 3;
  } else {
    const predictedWinner =
      predictedHome > predictedAway ? "home" : predictedHome < predictedAway ? "away" : "draw";
    const actualWinner =
      actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw";
    base = predictedWinner === actualWinner ? 1 : 0;
  }

  let penaltyBonus = 0;
  if (
    supportsPenalties &&
    predictedHome === predictedAway &&
    actualHome === actualAway &&
    predictedPenaltyWinner &&
    actualPenaltyWinner &&
    predictedPenaltyWinner === actualPenaltyWinner
  ) {
    penaltyBonus = 2;
  }

  return { total: base + penaltyBonus, base, penaltyBonus };
};

export const calculatePoints = (
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  predictedPenaltyWinner?: PenaltyWinner | null,
  actualPenaltyWinner?: PenaltyWinner | null,
  supportsPenalties = false
): number =>
  calculatePointsBreakdown(
    predictedHome,
    predictedAway,
    actualHome,
    actualAway,
    predictedPenaltyWinner,
    actualPenaltyWinner,
    supportsPenalties
  ).total;

export const describePointsEarned = (breakdown: PointsBreakdown): string => {
  if (breakdown.total === 0) return "No acertaste esta vez";
  if (breakdown.penaltyBonus > 0 && breakdown.base === 3) {
    return "Resultado exacto y ganador en penales! (+5 pts)";
  }
  if (breakdown.penaltyBonus > 0 && breakdown.base === 1) {
    return "Acertaste el empate y el ganador en penales (+3 pts)";
  }
  if (breakdown.base === 3) return "Acertaste el resultado exacto! (+3 pts)";
  if (breakdown.base === 1) return "Acertaste el ganador o empate (+1 pt)";
  return `+${breakdown.total} pts`;
};
