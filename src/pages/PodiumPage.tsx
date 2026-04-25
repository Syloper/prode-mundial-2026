import React, { useEffect, useState } from "react";
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { supabase } from "../lib/supabase";
import { RankingEntry } from "../types";
import { useAuth } from "../hooks/useAuth";

const PODIUM_COLORS = ["#E6F9F1", "#F0F3F4", "#FFF3E0"] as const;
const PODIUM_MEDALS = ["🥇", "🥈", "🥉"] as const;

export const PodiumPage: React.FC = () => {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc("get_rankings");

      if (rpcError) {
        setError("Error al cargar el ranking. Intentá nuevamente.");
        setIsLoading(false);
        return;
      }

      const entries: RankingEntry[] = (data ?? []).map(
        (
          row: {
            user_id: string;
            user_name: string;
            total_points: number;
            exact_scores: number;
            correct_winners: number;
          },
          idx: number
        ) => ({
          userId: row.user_id,
          userName: row.user_name,
          totalPoints: Number(row.total_points),
          exactScores: Number(row.exact_scores),
          correctWinners: Number(row.correct_winners),
          position: idx + 1,
        })
      );

      setRanking(entries);
      setIsLoading(false);
    };

    fetchRanking();
  }, []);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Calculando ranking...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (ranking.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Ranking
        </Typography>
        <Alert severity="info">
          El ranking aparecerá cuando haya partidos terminados con predicciones cargadas.
        </Alert>
      </Container>
    );
  }

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "bold" }}>
        Ranking
      </Typography>

      {/* Podio top 3 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 3,
          flexWrap: "wrap",
          mb: 5,
        }}
      >
        {top3.map((entry, idx) => (
          <Card
            key={entry.userId}
            sx={{
              flex: 1,
              minWidth: 180,
              maxWidth: 250,
              textAlign: "center",
              backgroundColor: PODIUM_COLORS[idx],
              border: entry.userId === user?.id ? "2px solid #00B96B" : "none",
              boxShadow: entry.userId === user?.id ? 4 : 1,
            }}
          >
            <CardContent>
              <Typography sx={{ fontSize: "2.5rem", mb: 1 }}>
                {PODIUM_MEDALS[idx]}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
                {entry.userName}
              </Typography>
              {entry.userId === user?.id && (
                <Chip label="Vos" size="small" color="primary" sx={{ mb: 1 }} />
              )}
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main" }}>
                {entry.totalPoints} pts
              </Typography>
              <Typography variant="caption" sx={{ color: "#666", display: "block", mt: 1 }}>
                Exactos: {entry.exactScores} | Ganador: {entry.correctWinners}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Tabla completa */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell><strong>#</strong></TableCell>
              <TableCell><strong>Jugador</strong></TableCell>
              <TableCell align="right"><strong>Puntos</strong></TableCell>
              <TableCell align="right"><strong>Exactos (+3)</strong></TableCell>
              <TableCell align="right"><strong>Ganador (+1)</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ranking.map((entry) => (
              <TableRow
                key={entry.userId}
                sx={{
                  backgroundColor:
                    entry.userId === user?.id ? "#E6F9F1" : "inherit",
                  fontWeight: entry.userId === user?.id ? "bold" : "normal",
                }}
                hover
              >
                <TableCell>
                  {entry.position <= 3 ? PODIUM_MEDALS[entry.position - 1] : entry.position}
                </TableCell>
                <TableCell>
                  {entry.userName}
                  {entry.userId === user?.id && (
                    <Chip
                      label="Vos"
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  <strong>{entry.totalPoints}</strong>
                </TableCell>
                <TableCell align="right">{entry.exactScores}</TableCell>
                <TableCell align="right">{entry.correctWinners}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {rest.length === 0 && ranking.length > 0 && (
        <Typography variant="caption" sx={{ display: "block", mt: 2, color: "#666" }}>
          {ranking.length} participante{ranking.length !== 1 ? "s" : ""} en el ranking
        </Typography>
      )}
    </Container>
  );
};
