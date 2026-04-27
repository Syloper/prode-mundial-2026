import React from "react";
import {
  Table, TableHead, TableRow, TableCell, TableBody, Typography, Box,
} from "@mui/material";
import { Match } from "../../types";
import { calculateGroupStandings } from "../../utils/standingsHelpers";
import { FlagImg } from "./FlagImg";

interface Props {
  group: string;
  matches: Match[];
}

export const GroupStandings: React.FC<Props> = ({ group, matches }) => {
  const teamMap: Record<string, { name: string; flag: string }> = {};
  for (const m of matches) {
    teamMap[m.homeTeam] = { name: m.homeTeam, flag: m.homeTeamFlag };
    teamMap[m.awayTeam] = { name: m.awayTeam, flag: m.awayTeamFlag };
  }
  const teams = Object.values(teamMap);
  if (teams.length === 0) return null;

  const standings = calculateGroupStandings(matches, group, teams);
  const hasResults = standings.some((s) => s.played > 0);

  return (
    <Box sx={{ mb: 2, borderRadius: 1, overflow: "hidden", border: "1px solid #e0e0e0" }}>
      <Box sx={{ px: 1.5, py: 0.75, backgroundColor: "#f5f5f5" }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
          POSICIONES
        </Typography>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ py: 0.5, color: "text.secondary", fontSize: "0.7rem" }}>#</TableCell>
            <TableCell sx={{ py: 0.5, color: "text.secondary", fontSize: "0.7rem" }}>Equipo</TableCell>
            <TableCell align="center" sx={{ py: 0.5, color: "text.secondary", fontSize: "0.7rem" }}>PJ</TableCell>
            <TableCell align="center" sx={{ py: 0.5, color: "text.secondary", fontSize: "0.7rem" }}>G</TableCell>
            <TableCell align="center" sx={{ py: 0.5, color: "text.secondary", fontSize: "0.7rem" }}>E</TableCell>
            <TableCell align="center" sx={{ py: 0.5, color: "text.secondary", fontSize: "0.7rem" }}>P</TableCell>
            <TableCell align="center" sx={{ py: 0.5, color: "text.secondary", fontSize: "0.7rem" }}>DG</TableCell>
            <TableCell align="center" sx={{ py: 0.5, fontWeight: 700, fontSize: "0.7rem" }}>Pts</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {standings.map((s, idx) => (
            <TableRow
              key={s.team}
              sx={{
                backgroundColor: idx < 2 ? "rgba(0,185,107,0.06)" : "inherit",
              }}
            >
              <TableCell sx={{ py: 0.5, fontSize: "0.75rem", color: idx < 2 ? "primary.main" : "text.secondary", fontWeight: idx < 2 ? 700 : 400 }}>
                {idx + 1}
              </TableCell>
              <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>
                <FlagImg flag={s.flag} /> {s.team}
              </TableCell>
              <TableCell align="center" sx={{ py: 0.5, fontSize: "0.75rem" }}>{hasResults ? s.played : "-"}</TableCell>
              <TableCell align="center" sx={{ py: 0.5, fontSize: "0.75rem" }}>{hasResults ? s.won : "-"}</TableCell>
              <TableCell align="center" sx={{ py: 0.5, fontSize: "0.75rem" }}>{hasResults ? s.drawn : "-"}</TableCell>
              <TableCell align="center" sx={{ py: 0.5, fontSize: "0.75rem" }}>{hasResults ? s.lost : "-"}</TableCell>
              <TableCell align="center" sx={{ py: 0.5, fontSize: "0.75rem" }}>{hasResults ? (s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff) : "-"}</TableCell>
              <TableCell align="center" sx={{ py: 0.5, fontSize: "0.75rem", fontWeight: 700 }}>{hasResults ? s.points : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
