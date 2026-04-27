import React from "react";
import { Container, Typography, Box, Paper, Chip, CircularProgress } from "@mui/material";
import { useMatches } from "../hooks/useMatches";
import { Match } from "../types";
import { FlagImg } from "../components/common/FlagImg";

const ROUNDS = [
  { label: "16avos", ids: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
  { label: "8vos",   ids: [89,90,91,92,93,94,95,96] },
  { label: "4tos",   ids: [97,98,99,100] },
  { label: "Semis",  ids: [101,102] },
  { label: "Final",  ids: [104] },
];

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface MatchBoxProps {
  match: Match | undefined;
  highlight?: boolean;
}

const MatchBox: React.FC<MatchBoxProps> = ({ match, highlight }) => {
  if (!match) return <Box sx={{ height: 72, border: "1px dashed #ddd", borderRadius: 1, mb: 1 }} />;

  const tbd = match.homeTeam === "Por definir" || match.awayTeam === "Por definir";

  return (
    <Paper
      elevation={highlight ? 3 : 1}
      sx={{
        mb: 1, p: 1, minWidth: 170,
        border: highlight ? "2px solid #00B96B" : "1px solid #e0e0e0",
        backgroundColor: match.isFinished ? "#F0FBF4" : "background.paper",
        opacity: tbd ? 0.55 : 1,
      }}
    >
      {/* Home */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
        <Typography variant="caption" sx={{ fontWeight: match.isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0) ? 700 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <FlagImg flag={match.homeTeamFlag} /> {match.homeTeam}
        </Typography>
        {match.isFinished && (
          <Typography variant="caption" sx={{ fontWeight: 700, ml: 0.5, color: (match.homeScore ?? 0) > (match.awayScore ?? 0) ? "primary.main" : "text.secondary" }}>
            {match.homeScore}
          </Typography>
        )}
      </Box>
      {/* Away */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="caption" sx={{ fontWeight: match.isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0) ? 700 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <FlagImg flag={match.awayTeamFlag} /> {match.awayTeam}
        </Typography>
        {match.isFinished && (
          <Typography variant="caption" sx={{ fontWeight: 700, ml: 0.5, color: (match.awayScore ?? 0) > (match.homeScore ?? 0) ? "primary.main" : "text.secondary" }}>
            {match.awayScore}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export const BracketPage: React.FC = () => {
  const { matches, isLoading } = useMatches();

  if (isLoading) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const matchById = Object.fromEntries(matches.map((m) => [parseInt(m.id), m]));

  // Ganador de un partido
  const winner = (m: Match | undefined): string => {
    if (!m?.isFinished || m.homeScore === undefined || m.awayScore === undefined) return "";
    if (m.homeScore > m.awayScore) return m.homeTeam;
    if (m.awayScore > m.homeScore) return m.awayTeam;
    return "";
  };

  const finalMatch = matchById[104];
  const thirdMatch = matchById[103];
  const champion = winner(finalMatch);
  const thirdPlace = thirdMatch?.isFinished ? winner(thirdMatch) : null;

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>Bracket Eliminación Directa</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Final · 19 de julio 2026 · MetLife Stadium, NJ
      </Typography>

      {/* Podio campeón */}
      {champion && (
        <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
          <Chip icon={<span>🥇</span>} label={`Campeón: ${champion}`} color="primary" />
          {thirdPlace && <Chip icon={<span>🥉</span>} label={`3er puesto: ${thirdPlace}`} variant="outlined" />}
        </Box>
      )}

      {/* Bracket scrollable */}
      <Box sx={{ overflowX: "auto", pb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", minWidth: 900 }}>
          {ROUNDS.map((round) => (
            <Box key={round.label} sx={{ display: "flex", flexDirection: "column", minWidth: 185 }}>
              {/* Encabezado de ronda */}
              <Box sx={{ mb: 1.5, textAlign: "center" }}>
                <Chip label={round.label} size="small" color="primary" variant="outlined" />
              </Box>

              {/* Distribución vertical equitativa */}
              <Box sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around",
                flex: 1,
                gap: round.ids.length <= 2 ? 4 : round.ids.length <= 4 ? 2 : 0.5,
              }}>
                {round.ids.map((id) => (
                  <MatchBox key={id} match={matchById[id]} highlight={id === 104} />
                ))}
              </Box>
            </Box>
          ))}

          {/* Tercer puesto aparte */}
          <Box sx={{ minWidth: 185 }}>
            <Box sx={{ mb: 1.5, textAlign: "center" }}>
              <Chip label="3er puesto" size="small" variant="outlined" />
            </Box>
            <MatchBox match={matchById[103]} />
          </Box>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Los cruces se actualizan automáticamente cuando el admin carga los resultados.
      </Typography>
    </Container>
  );
};
