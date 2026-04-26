import { Match } from "../types";

export interface TeamStanding {
  team: string;
  flag: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export function calculateGroupStandings(
  groupMatches: Match[],
  group: string,
  teams: { name: string; flag: string }[]
): TeamStanding[] {
  const map: Record<string, TeamStanding> = {};
  for (const t of teams) {
    map[t.name] = {
      team: t.name, flag: t.flag, group,
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
    };
  }

  for (const m of groupMatches) {
    if (!m.isFinished || m.homeScore === undefined || m.awayScore === undefined) continue;
    const home = map[m.homeTeam];
    const away = map[m.awayTeam];
    if (!home || !away) continue;

    home.played++; away.played++;
    home.goalsFor += m.homeScore; home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore; away.goalsAgainst += m.homeScore;
    home.goalDiff = home.goalsFor - home.goalsAgainst;
    away.goalDiff = away.goalsFor - away.goalsAgainst;

    if (m.homeScore > m.awayScore) {
      home.won++; home.points += 3; away.lost++;
    } else if (m.homeScore < m.awayScore) {
      away.won++; away.points += 3; home.lost++;
    } else {
      home.drawn++; home.points++;
      away.drawn++; away.points++;
    }
  }

  return Object.values(map).sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor
  );
}

// Bracket de los 16avos — define qué posición/grupo ocupa cada slot
export const R32_BRACKET: Array<{
  matchId: number;
  home: { pos: number; group: string };
  away: { pos: number; group: string } | { pos: 3; groups: string[] };
}> = [
  { matchId: 73, home: { pos: 1, group: "E" }, away: { pos: 3, groups: ["A","B","C","D","F"] } },
  { matchId: 74, home: { pos: 1, group: "I" }, away: { pos: 3, groups: ["C","D","F","G","H"] } },
  { matchId: 75, home: { pos: 2, group: "A" }, away: { pos: 2, group: "B" } },
  { matchId: 76, home: { pos: 1, group: "F" }, away: { pos: 2, group: "C" } },
  { matchId: 77, home: { pos: 2, group: "K" }, away: { pos: 2, group: "L" } },
  { matchId: 78, home: { pos: 1, group: "H" }, away: { pos: 2, group: "J" } },
  { matchId: 79, home: { pos: 1, group: "D" }, away: { pos: 3, groups: ["B","E","F","I","J"] } },
  { matchId: 80, home: { pos: 1, group: "G" }, away: { pos: 3, groups: ["A","E","H","I","J"] } },
  { matchId: 81, home: { pos: 1, group: "C" }, away: { pos: 2, group: "F" } },
  { matchId: 82, home: { pos: 2, group: "E" }, away: { pos: 2, group: "I" } },
  { matchId: 83, home: { pos: 1, group: "A" }, away: { pos: 3, groups: ["C","E","F","H","I"] } },
  { matchId: 84, home: { pos: 1, group: "L" }, away: { pos: 3, groups: ["E","H","I","J","K"] } },
  { matchId: 85, home: { pos: 1, group: "J" }, away: { pos: 2, group: "H" } },
  { matchId: 86, home: { pos: 2, group: "D" }, away: { pos: 2, group: "G" } },
  { matchId: 87, home: { pos: 1, group: "B" }, away: { pos: 3, groups: ["E","F","G","I","J"] } },
  { matchId: 88, home: { pos: 1, group: "K" }, away: { pos: 3, groups: ["D","E","I","J","L"] } },
];

export function resolveKnockoutUpdates(
  allStandings: Record<string, TeamStanding[]>
): Array<{ matchId: number; homeTeam: string; homeFlag: string; awayTeam: string; awayFlag: string }> {
  // Recolectar los 3ros de cada grupo ordenados por puntos/DG/GF
  const allThirds: TeamStanding[] = Object.values(allStandings)
    .map((s) => s[2])
    .filter(Boolean)
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);

  // Elegir los 8 mejores 3ros
  const best8thirds = allThirds.slice(0, 8);
  const availableThirds = [...best8thirds];

  const updates: ReturnType<typeof resolveKnockoutUpdates> = [];

  for (const slot of R32_BRACKET) {
    const getTeam = (side: typeof slot.home | typeof slot.away) => {
      if ("group" in side) {
        const s = allStandings[side.group]?.[side.pos - 1];
        return s ? { team: s.team, flag: s.flag } : null;
      } else {
        // 3rd place: buscar el mejor disponible cuyo grupo esté en la lista
        const idx = availableThirds.findIndex((t) => side.groups.includes(t.group));
        if (idx === -1) return null;
        const [found] = availableThirds.splice(idx, 1);
        return { team: found.team, flag: found.flag };
      }
    };

    const home = getTeam(slot.home);
    const away = getTeam(slot.away);
    if (!home || !away) continue;

    updates.push({
      matchId: slot.matchId,
      homeTeam: home.team, homeFlag: home.flag,
      awayTeam: away.team, awayFlag: away.flag,
    });
  }

  return updates;
}
