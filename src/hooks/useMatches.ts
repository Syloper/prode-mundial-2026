import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Match } from "../types";
import { calculateGroupStandings, resolveKnockoutUpdates } from "../utils/standingsHelpers";

// Definición de grupos y equipos del Mundial 2026
const GROUP_DEFINITIONS: Record<string, { teams: string[]; flags: string[] }> = {
  A: { teams: ["México", "Sudáfrica", "Corea del Sur", "Rep. Checa"], flags: ["🇲🇽", "🇿🇦", "🇰🇷", "🇨🇿"] },
  B: { teams: ["Canadá", "Bosnia y Herz.", "Qatar", "Suiza"], flags: ["🇨🇦", "🇧🇦", "🇶🇦", "🇨🇭"] },
  C: { teams: ["Brasil", "Marruecos", "Haití", "Escocia"], flags: ["🇧🇷", "🇲🇦", "🇭🇹", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"] },
  D: { teams: ["Estados Unidos", "Paraguay", "Australia", "Turquía"], flags: ["🇺🇸", "🇵🇾", "🇦🇺", "🇹🇷"] },
  E: { teams: ["Alemania", "Curazao", "Costa de Marfil", "Ecuador"], flags: ["🇩🇪", "🇨🇼", "🇨🇮", "🇪🇨"] },
  F: { teams: ["Países Bajos", "Japón", "Suecia", "Túnez"], flags: ["🇳🇱", "🇯🇵", "🇸🇪", "🇹🇳"] },
  G: { teams: ["Bélgica", "Egipto", "Irán", "Nueva Zelanda"], flags: ["🇧🇪", "🇪🇬", "🇮🇷", "🇳🇿"] },
  H: { teams: ["España", "Cabo Verde", "Arabia Saudita", "Uruguay"], flags: ["🇪🇸", "🇨🇻", "🇸🇦", "🇺🇾"] },
  I: { teams: ["Francia", "Senegal", "Irak", "Noruega"], flags: ["🇫🇷", "🇸🇳", "🇮🇶", "🇳🇴"] },
  J: { teams: ["Argentina", "Argelia", "Austria", "Jordania"], flags: ["🇦🇷", "🇩🇿", "🇦🇹", "🇯🇴"] },
  K: { teams: ["Portugal", "RD Congo", "Uzbekistán", "Colombia"], flags: ["🇵🇹", "🇨🇩", "🇺🇿", "🇨🇴"] },
  L: { teams: ["Inglaterra", "Croacia", "Ghana", "Panamá"], flags: ["🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇭🇷", "🇬🇭", "🇵🇦"] },
};

const ROUND_PAIRS = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]] as const;

type MatchSeedRow = {
  id: number;
  home_team: string;
  away_team: string;
  home_team_flag: string;
  away_team_flag: string;
  group_name: string;
  scheduled_date: string;
  result_deadline: string;
};

export function buildMatchesForSeed(): MatchSeedRow[] {
  const result: MatchSeedRow[] = [];
  let id = 1;
  const groupKeys = Object.keys(GROUP_DEFINITIONS);
  const roundOffsets = [0, 4, 11];

  groupKeys.forEach((group, groupIdx) => {
    const { teams, flags } = GROUP_DEFINITIONS[group];
    ROUND_PAIRS.forEach(([i, j], pairIdx) => {
      const round = Math.floor(pairIdx / 2);
      const dayOffset = roundOffsets[round] + groupIdx * 0.5;
      const baseDate = new Date("2026-06-11T21:00:00Z");
      baseDate.setDate(baseDate.getDate() + Math.floor(dayOffset));
      const hourUtc = 21 + (groupIdx % 3) * 2;
      baseDate.setUTCHours(hourUtc, 0, 0, 0);

      const scheduledDate = new Date(baseDate);
      const resultDeadline = new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000);

      result.push({
        id: id++,
        home_team: teams[i],
        away_team: teams[j],
        home_team_flag: flags[i],
        away_team_flag: flags[j],
        group_name: group,
        scheduled_date: scheduledDate.toISOString(),
        result_deadline: resultDeadline.toISOString(),
      });
    });
  });

  return result;
}

function mapDbMatch(row: {
  id: number;
  home_team: string;
  away_team: string;
  home_team_flag: string;
  away_team_flag: string;
  group_name: string;
  scheduled_date: string;
  result_deadline: string;
  home_score: number | null;
  away_score: number | null;
  is_finished: boolean;
  phase?: string | null;
  penalty_winner?: "home" | "away" | null;
}): Match {
  return {
    id: String(row.id),
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeTeamFlag: row.home_team_flag,
    awayTeamFlag: row.away_team_flag,
    group: row.group_name,
    phase: row.phase ?? undefined,
    scheduledDate: new Date(row.scheduled_date),
    resultDeadline: new Date(row.result_deadline),
    homeScore: row.home_score ?? undefined,
    awayScore: row.away_score ?? undefined,
    penaltyWinner: row.penalty_winner ?? undefined,
    isFinished: row.is_finished,
  };
}

export const useMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("scheduled_date");

    if (error) {
      console.error("Error al cargar partidos:", error.message);
      return;
    }
    setMatches((data ?? []).map(mapDbMatch));
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchMatches();
      setIsLoading(false);
    };
    load();

    // Suscripción en tiempo real: cuando el admin carga resultados, todos ven la actualización
    const channel = supabase
      .channel("matches-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          setMatches((prev) =>
            prev.map((m) =>
              m.id === String(payload.new.id)
                ? {
                    ...m,
                    homeScore: payload.new.home_score ?? undefined,
                    awayScore: payload.new.away_score ?? undefined,
                    penaltyWinner: payload.new.penalty_winner ?? undefined,
                    isFinished: payload.new.is_finished,
                  }
                : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMatches]);

  const updateMatchResult = useCallback(
    async (
      matchId: string,
      homeScore: number,
      awayScore: number,
      penaltyWinner?: "home" | "away" | null
    ) => {
      const { error } = await supabase
        .from("matches")
        .update({
          home_score: homeScore,
          away_score: awayScore,
          penalty_winner: homeScore === awayScore ? (penaltyWinner ?? null) : null,
          is_finished: true,
        })
        .eq("id", parseInt(matchId));

      if (error) throw new Error("Error al guardar el resultado");

      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                homeScore,
                awayScore,
                penaltyWinner: homeScore === awayScore ? (penaltyWinner ?? undefined) : undefined,
                isFinished: true,
              }
            : m
        )
      );
    },
    []
  );

  const updateMatch = useCallback(
    async (
      matchId: string,
      fields: {
        homeTeam?: string;
        awayTeam?: string;
        homeTeamFlag?: string;
        awayTeamFlag?: string;
        scheduledDate?: Date;
        resultDeadline?: Date;
      }
    ) => {
      const { error } = await supabase
        .from("matches")
        .update({
          home_team: fields.homeTeam,
          away_team: fields.awayTeam,
          home_team_flag: fields.homeTeamFlag,
          away_team_flag: fields.awayTeamFlag,
          scheduled_date: fields.scheduledDate?.toISOString(),
          result_deadline: fields.resultDeadline?.toISOString(),
        })
        .eq("id", parseInt(matchId));

      if (error) throw new Error("Error al actualizar el partido");
      await fetchMatches();
    },
    [fetchMatches]
  );

  // Función para sembrar partidos si la tabla está vacía (solo admins)
  const seedMatchesIfEmpty = useCallback(async () => {
    const { count } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true });

    if (count && count > 0) return false;

    setIsSeeding(true);
    const matchRows = buildMatchesForSeed();
    const { error } = await supabase.from("matches").insert(matchRows);
    setIsSeeding(false);

    if (error) throw new Error("Error al sembrar partidos: " + error.message);
    await fetchMatches();
    return true;
  }, [fetchMatches]);

  const updateKnockoutFromStandings = useCallback(async () => {
    const groupMatches = matches.filter((m) => parseInt(m.id) <= 72);

    // Armar equipos por grupo desde los partidos
    const teamsByGroup: Record<string, { name: string; flag: string }[]> = {};
    for (const m of groupMatches) {
      if (!teamsByGroup[m.group]) teamsByGroup[m.group] = [];
      if (!teamsByGroup[m.group].find((t) => t.name === m.homeTeam))
        teamsByGroup[m.group].push({ name: m.homeTeam, flag: m.homeTeamFlag });
      if (!teamsByGroup[m.group].find((t) => t.name === m.awayTeam))
        teamsByGroup[m.group].push({ name: m.awayTeam, flag: m.awayTeamFlag });
    }

    // Calcular posiciones por grupo
    const allStandings: Record<string, ReturnType<typeof calculateGroupStandings>> = {};
    for (const [group, teams] of Object.entries(teamsByGroup)) {
      allStandings[group] = calculateGroupStandings(
        groupMatches.filter((m) => m.group === group),
        group,
        teams
      );
    }

    const updates = resolveKnockoutUpdates(allStandings);
    if (updates.length === 0) throw new Error("No hay suficientes resultados de grupos para calcular los cruces");

    for (const u of updates) {
      const { error } = await supabase
        .from("matches")
        .update({
          home_team: u.homeTeam,
          home_team_flag: u.homeFlag,
          away_team: u.awayTeam,
          away_team_flag: u.awayFlag,
        })
        .eq("id", u.matchId);
      if (error) throw new Error(`Error actualizando partido ${u.matchId}: ${error.message}`);
    }

    await fetchMatches();
    return updates.length;
  }, [matches, fetchMatches]);

  return { matches, isLoading, isSeeding, updateMatchResult, updateMatch, updateKnockoutFromStandings, seedMatchesIfEmpty, refetch: fetchMatches };
};
