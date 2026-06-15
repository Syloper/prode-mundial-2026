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
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { supabase } from "../lib/supabase";
import { RankingEntry } from "../types";
import { useAuth } from "../hooks/useAuth";
import { PlayerScoreBreakdownDialog } from "../components/common/PlayerScoreBreakdownDialog";

const PODIUM_COLORS = ["#E6F9F1", "#F0F3F4", "#FFF3E0"] as const;
const PODIUM_MEDALS = ["🥇", "🥈", "🥉"] as const;

export const PodiumPage: React.FC = () => {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<RankingEntry | null>(null);

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

  const openPlayerDetail = (entry: RankingEntry) => setSelectedPlayer(entry);
  const closePlayerDetail = () => setSelectedPlayer(null);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Ranking
      </Typography>

      {/* Sistema de puntos */}
      <Box
        sx={{
          mb: 4,
          p: 2.5,
          borderRadius: 2,
          border: "1px solid #C8EFD4",
          backgroundColor: "#F0FBF4",
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "flex-start",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "secondary.main", width: "100%" }}>
          ¿Cómo se calculan los puntos?
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ px: 1.5, py: 0.5, backgroundColor: "#00B96B", borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700 }}>+3 pts</Typography>
            </Box>
            <Typography variant="body2">Resultado exacto (ej: predijiste 2-1 y fue 2-1)</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ px: 1.5, py: 0.5, backgroundColor: "#2A3235", borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700 }}>+1 pt</Typography>
            </Box>
            <Typography variant="body2">Ganador correcto o empate acertado (resultado diferente)</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ px: 1.5, py: 0.5, backgroundColor: "#e0e0e0", borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: "#555", fontWeight: 700 }}>0 pts</Typography>
            </Box>
            <Typography variant="body2">Predicción incorrecta</Typography>
          </Box>
        </Box>
      </Box>

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
            onClick={() => openPlayerDetail(entry)}
            sx={{
              flex: 1,
              minWidth: 180,
              maxWidth: 250,
              textAlign: "center",
              backgroundColor: PODIUM_COLORS[idx],
              border: entry.userId === user?.id ? "2px solid #00B96B" : "none",
              boxShadow: entry.userId === user?.id ? 4 : 1,
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
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
              <Typography variant="caption" sx={{ color: "primary.main", display: "block", mt: 1 }}>
                Ver detalle de aciertos
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
              <TableCell align="center"><strong>Detalle</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ranking.map((entry) => (
              <TableRow
                key={entry.userId}
                onClick={() => openPlayerDetail(entry)}
                sx={{
                  backgroundColor:
                    entry.userId === user?.id ? "#E6F9F1" : "inherit",
                  fontWeight: entry.userId === user?.id ? "bold" : "normal",
                  cursor: "pointer",
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
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Ver aciertos por partido">
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label={`Ver detalle de ${entry.userName}`}
                      onClick={() => openPlayerDetail(entry)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <PlayerScoreBreakdownDialog
        open={selectedPlayer !== null}
        player={selectedPlayer}
        onClose={closePlayerDetail}
      />

      {rest.length === 0 && ranking.length > 0 && (
        <Typography variant="caption" sx={{ display: "block", mt: 2, color: "#666" }}>
          {ranking.length} participante{ranking.length !== 1 ? "s" : ""} en el ranking
        </Typography>
      )}
    </Container>
  );
};
