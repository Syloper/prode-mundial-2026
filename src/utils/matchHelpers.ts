export type PenaltyWinner = "home" | "away";

/** Fases eliminatorias donde se puede predecir ganador en penales (no aplica en Tercer puesto). */
export function matchSupportsPenaltyPrediction(match: { phase?: string }): boolean {
  return !!match.phase && match.phase !== "Tercer puesto";
}

export function formatPenaltyWinnerLabel(
  winner: PenaltyWinner,
  match: { homeTeam: string; awayTeam: string }
): string {
  return winner === "home" ? match.homeTeam : match.awayTeam;
}

export function matchAdvancingTeam(
  match: {
    homeScore?: number;
    awayScore?: number;
    penaltyWinner?: PenaltyWinner | null;
    isFinished: boolean;
  }
): PenaltyWinner | null {
  if (!match.isFinished || match.homeScore === undefined || match.awayScore === undefined) {
    return null;
  }
  if (match.homeScore > match.awayScore) return "home";
  if (match.awayScore > match.homeScore) return "away";
  return match.penaltyWinner ?? null;
}
