import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { supabase } from "../../lib/supabase";
import { RankingEntry, PenaltyWinner } from "../../types";
import { formatDate } from "../../utils/dateHelpers";
import { FlagImg } from "./FlagImg";
import { formatPenaltyWinnerLabel } from "../../utils/matchHelpers";

export interface ScoreBreakdownEntry {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamFlag: string;
  awayTeamFlag: string;
  scheduledDate: Date;
  phase?: string;
  group: string;
  predictedHome: number;
  predictedAway: number;
  predictedPenaltyWinner?: PenaltyWinner;
  actualHome: number;
  actualAway: number;
  actualPenaltyWinner?: PenaltyWinner;
  points: number;
}

interface PlayerScoreBreakdownDialogProps {
  open: boolean;
  player: RankingEntry | null;
  onClose: () => void;
}

const pointsChip = (points: number) => {
  if (points === 5) return <Chip label="+5 exacto+pen." size="small" color="success" />;
  if (points === 3) return <Chip label="+3" size="small" color="success" />;
  if (points === 1) return <Chip label="+1" size="small" color="default" />;
  return <Chip label="0 pts" size="small" variant="outlined" />;
};

const formatBreakdownScore = (
  home: number,
  away: number,
  penaltyWinner: PenaltyWinner | undefined,
  teams: { homeTeam: string; awayTeam: string }
) => {
  if (!penaltyWinner) return `${home} - ${away}`;
  return `${home} - ${away} (pen. ${formatPenaltyWinnerLabel(penaltyWinner, teams)})`;
};

export const PlayerScoreBreakdownDialog: React.FC<PlayerScoreBreakdownDialogProps> = ({
  open,
  player,
  onClose,
}) => {
  const [entries, setEntries] = useState<ScoreBreakdownEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !player) {
      setEntries([]);
      setError(null);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc("get_user_score_breakdown", {
        p_user_id: player.userId,
      });

      if (rpcError) {
        setError("No se pudo cargar el detalle de puntos.");
        setEntries([]);
        setIsLoading(false);
        return;
      }

      setEntries(
        (data ?? []).map(
          (row: {
            match_id: number;
            home_team: string;
            away_team: string;
            home_team_flag: string;
            away_team_flag: string;
            scheduled_date: string;
            phase: string | null;
            group_name: string;
            predicted_home: number;
            predicted_away: number;
            predicted_penalty_winner: PenaltyWinner | null;
            actual_home: number;
            actual_away: number;
            actual_penalty_winner: PenaltyWinner | null;
            points: number;
          }) => ({
            matchId: row.match_id,
            homeTeam: row.home_team,
            awayTeam: row.away_team,
            homeTeamFlag: row.home_team_flag,
            awayTeamFlag: row.away_team_flag,
            scheduledDate: new Date(row.scheduled_date),
            phase: row.phase ?? undefined,
            group: row.group_name,
            predictedHome: row.predicted_home,
            predictedAway: row.predicted_away,
            predictedPenaltyWinner: row.predicted_penalty_winner ?? undefined,
            actualHome: row.actual_home,
            actualAway: row.actual_away,
            actualPenaltyWinner: row.actual_penalty_winner ?? undefined,
            points: row.points,
          })
        )
      );
      setIsLoading(false);
    };

    load();
  }, [open, player]);

  const totalFromEntries = entries.reduce((sum, e) => sum + e.points, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Detalle de puntos — {player?.userName ?? ""}
        <IconButton
          aria-label="cerrar"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {player && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            <Chip label={`${player.totalPoints} pts totales`} color="primary" size="small" />
            <Chip label={`${player.exactScores} exactos (+3)`} size="small" color="success" variant="outlined" />
            <Chip label={`${player.correctWinners} ganador (+1)`} size="small" variant="outlined" />
            <Chip label={`Puesto #${player.position}`} size="small" variant="outlined" />
          </Box>
        )}

        {isLoading && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!isLoading && !error && entries.length === 0 && (
          <Alert severity="info">
            Este jugador aún no tiene predicciones en partidos finalizados.
          </Alert>
        )}

        {!isLoading && !error && entries.length > 0 && (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell><strong>Partido</strong></TableCell>
                    <TableCell align="center"><strong>Predicción</strong></TableCell>
                    <TableCell align="center"><strong>Resultado</strong></TableCell>
                    <TableCell align="center"><strong>Puntos</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.matchId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          <FlagImg flag={entry.homeTeamFlag} /> {entry.homeTeam} vs {entry.awayTeam}{" "}
                          <FlagImg flag={entry.awayTeamFlag} />
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {formatDate(entry.scheduledDate)}
                          {entry.phase ? ` · ${entry.phase}` : ` · Grupo ${entry.group}`}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {formatBreakdownScore(
                          entry.predictedHome,
                          entry.predictedAway,
                          entry.predictedPenaltyWinner,
                          entry
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {formatBreakdownScore(
                          entry.actualHome,
                          entry.actualAway,
                          entry.actualPenaltyWinner,
                          entry
                        )}
                      </TableCell>
                      <TableCell align="center">{pointsChip(entry.points)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" sx={{ display: "block", mt: 2, color: "text.secondary" }}>
              {entries.length} partido{entries.length !== 1 ? "s" : ""} finalizado{entries.length !== 1 ? "s" : ""} ·{" "}
              {totalFromEntries} pts sumados en este detalle
            </Typography>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
