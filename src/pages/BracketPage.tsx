import React from "react";
import { Container, Typography, Box, Paper, Chip, CircularProgress } from "@mui/material";
import { useMatches } from "../hooks/useMatches";
import { Match } from "../types";
import { FlagImg } from "../components/common/FlagImg";
import { matchAdvancingTeam } from "../utils/matchHelpers";

const SLOT_H = 64;       // px por slot de partido en la ronda base (16 equipos)
const TOTAL_H = 16 * SLOT_H; // 1024px altura total del bracket
const BOX_H   = 56;       // altura del recuadro de partido
const COL_W   = 178;      // ancho de cada columna de ronda
const CONN_W  = 32;       // ancho del conector SVG entre rondas
const LABEL_H = 36;       // altura del encabezado de ronda

const ROUNDS = [
  { label: "16avos", ids: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
  { label: "8vos",   ids: [89,90,91,92,93,94,95,96] },
  { label: "4tos",   ids: [97,98,99,100] },
  { label: "Semis",  ids: [101,102] },
  { label: "Final",  ids: [104] },
];

// ── Match box ────────────────────────────────────────────────
const MatchBox: React.FC<{ match: Match | undefined; highlight?: boolean }> = ({ match, highlight }) => {
  const tbd = !match || match.homeTeam === "Por definir" || match.awayTeam === "Por definir";

  return (
    <Paper
      elevation={highlight ? 3 : 1}
      sx={{
        height: BOX_H,
        p: "5px 8px",
        border: highlight ? "2px solid #00B96B" : "1px solid #e0e0e0",
        backgroundColor: match?.isFinished ? "#F0FBF4" : "background.paper",
        opacity: tbd ? 0.5 : 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
        overflow: "hidden",
      }}
    >
      {!match ? (
        <>
          <Typography variant="caption" color="text.disabled">? Por definir</Typography>
          <Typography variant="caption" color="text.disabled">? Por definir</Typography>
        </>
      ) : (
        <>
          <TeamRow
            flag={match.homeTeamFlag} name={match.homeTeam}
            score={match.isFinished ? match.homeScore : undefined}
            winner={matchAdvancingTeam(match) === "home"}
          />
          <TeamRow
            flag={match.awayTeamFlag} name={match.awayTeam}
            score={match.isFinished ? match.awayScore : undefined}
            winner={matchAdvancingTeam(match) === "away"}
          />
        </>
      )}
    </Paper>
  );
};

const TeamRow: React.FC<{ flag: string; name: string; score?: number; winner: boolean }> = ({ flag, name, score, winner }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <Typography variant="caption" sx={{
      fontWeight: winner ? 700 : 400,
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
    }}>
      <FlagImg flag={flag} /> {name}
    </Typography>
    {score !== undefined && (
      <Typography variant="caption" sx={{
        fontWeight: 700, ml: 0.5, minWidth: 14, textAlign: "right",
        color: winner ? "primary.main" : "text.secondary",
      }}>
        {score}
      </Typography>
    )}
  </Box>
);

// ── Columna de ronda ──────────────────────────────────────────
const RoundCol: React.FC<{
  label: string;
  ids: number[];
  matchById: Record<number, Match>;
  highlightId?: number;
  chip?: "filled" | "outlined";
}> = ({ label, ids, matchById, highlightId, chip = "outlined" }) => {
  const slotH = TOTAL_H / ids.length;

  return (
    <Box sx={{ width: COL_W, flexShrink: 0 }}>
      {/* Encabezado */}
      <Box sx={{ height: LABEL_H, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Chip label={label} size="small" color="primary" variant={chip} />
      </Box>
      {/* Partidos */}
      <Box sx={{ position: "relative", height: TOTAL_H }}>
        {ids.map((id, i) => {
          const top = (i + 0.5) * slotH - BOX_H / 2;
          return (
            <Box key={id} sx={{ position: "absolute", top, left: 0, right: 0 }}>
              <MatchBox match={matchById[id]} highlight={id === highlightId} />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

// ── Conector SVG entre rondas ────────────────────────────────
const ConnectorSVG: React.FC<{ matchCount: number }> = ({ matchCount }) => {
  const slotH = TOTAL_H / matchCount;
  const joints = matchCount / 2;
  const cx = CONN_W / 2; // x del trazo vertical

  return (
    <Box sx={{ flexShrink: 0 }}>
      <Box sx={{ height: LABEL_H }} /> {/* alinea con encabezado */}
      <svg width={CONN_W} height={TOTAL_H} style={{ display: "block" }}>
        {Array.from({ length: joints }).map((_, i) => {
          const y1   = (2 * i + 0.5) * slotH; // centro match superior
          const y2   = (2 * i + 1.5) * slotH; // centro match inferior
          const ymid = (2 * i + 1)   * slotH; // punto medio → próxima ronda
          return (
            <g key={i}>
              {/* Horizontal izq → match superior */}
              <line x1={0}        y1={y1}   x2={cx}       y2={y1}   stroke="#bdbdbd" strokeWidth={1.5} />
              {/* Vertical match superior → match inferior */}
              <line x1={cx}       y1={y1}   x2={cx}       y2={y2}   stroke="#bdbdbd" strokeWidth={1.5} />
              {/* Horizontal izq → match inferior */}
              <line x1={0}        y1={y2}   x2={cx}       y2={y2}   stroke="#bdbdbd" strokeWidth={1.5} />
              {/* Horizontal punto medio → próxima columna */}
              <line x1={cx}       y1={ymid} x2={CONN_W}   y2={ymid} stroke="#bdbdbd" strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

// ── Página principal ──────────────────────────────────────────
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

  const winner = (m: Match | undefined) => {
    if (!m) return "";
    const side = matchAdvancingTeam(m);
    if (!side) return "";
    return side === "home" ? m.homeTeam : m.awayTeam;
  };

  const champion   = winner(matchById[104]);
  const thirdPlace = winner(matchById[103]);

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 0.5 }}>
        Bracket Eliminación Directa
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Final · 19 de julio 2026 · MetLife Stadium, NJ
      </Typography>

      {champion && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Chip icon={<span>🥇</span>} label={`Campeón: ${champion}`} color="primary" />
          {thirdPlace && <Chip icon={<span>🥉</span>} label={`3er puesto: ${thirdPlace}`} variant="outlined" />}
        </Box>
      )}

      <Box sx={{ overflowX: "auto", pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
          {ROUNDS.map((round, ri) => (
            <React.Fragment key={round.label}>
              <RoundCol
                label={round.label}
                ids={round.ids}
                matchById={matchById}
                highlightId={round.label === "Final" ? 104 : undefined}
                chip={round.label === "Final" ? "filled" : "outlined"}
              />
              {ri < ROUNDS.length - 1 && (
                <ConnectorSVG matchCount={round.ids.length} />
              )}
            </React.Fragment>
          ))}

          {/* 3er puesto: columna separada sin conector */}
          <Box sx={{ ml: 3 }}>
            <RoundCol
              label="3er puesto"
              ids={[103]}
              matchById={matchById}
            />
          </Box>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
        Los cruces se actualizan automáticamente cuando el admin carga los resultados de grupos.
      </Typography>
    </Container>
  );
};
