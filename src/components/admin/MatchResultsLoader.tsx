import React, { useState } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { useMatches } from "../../hooks/useMatches";
import { useNotification } from "../../hooks/useNotification";
import { useAuth } from "../../hooks/useAuth";
import { Match } from "../../types";

export const MatchResultsLoader: React.FC = () => {
  const { matches, updateMatchResult, seedMatchesIfEmpty, isSeeding } = useMatches();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const pendingMatches = matches.filter((m) => !m.isFinished);

  const handleOpenDialog = (match: Match) => {
    setSelectedMatch(match);
    setHomeScore("");
    setAwayScore("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMatch(null);
    setHomeScore("");
    setAwayScore("");
  };

  const handleSaveResult = async () => {
    if (!selectedMatch) return;

    const home = parseInt(homeScore);
    const away = parseInt(awayScore);

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      addNotification("Ingresá números válidos (0 o mayor)", "error");
      return;
    }

    setIsSaving(true);
    try {
      await updateMatchResult(selectedMatch.id, home, away);
      addNotification(
        `Resultado guardado: ${selectedMatch.homeTeam} ${home} - ${away} ${selectedMatch.awayTeam}`,
        "success"
      );
      handleCloseDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al guardar";
      addNotification(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedMatches = async () => {
    try {
      const seeded = await seedMatchesIfEmpty();
      if (seeded) {
        addNotification("Partidos sembrados correctamente", "success");
      } else {
        addNotification("Los partidos ya estaban cargados", "info");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al sembrar";
      addNotification(message, "error");
    }
  };

  if (user?.role !== "admin") {
    return <Alert severity="error">Acceso restringido a administradores</Alert>;
  }

  return (
    <Card>
      <CardHeader title="Cargar Resultados de Partidos" />
      <CardContent>
        {matches.length === 0 ? (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              No hay partidos cargados en la base de datos.
            </Alert>
            <Button
              variant="contained"
              onClick={handleSeedMatches}
              disabled={isSeeding}
              startIcon={isSeeding ? <CircularProgress size={16} /> : undefined}
            >
              {isSeeding ? "Cargando partidos..." : "Cargar los 72 partidos de la fase de grupos"}
            </Button>
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Solo se puede cargar un resultado por partido. Una vez guardado no se puede modificar.
            </Alert>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Partido</strong></TableCell>
                    <TableCell><strong>Resultado</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell align="center"><strong>Acción</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        {new Date(match.scheduledDate).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell>
                        {match.homeTeamFlag} {match.homeTeam} vs {match.awayTeam} {match.awayTeamFlag}
                      </TableCell>
                      <TableCell>
                        {match.isFinished
                          ? `${match.homeScore} - ${match.awayScore}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {match.isFinished ? "Completado" : "Pendiente"}
                      </TableCell>
                      <TableCell align="center">
                        {!match.isFinished && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleOpenDialog(match)}
                          >
                            Cargar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, p: 1, backgroundColor: "#f0f0f0", borderRadius: 1 }}>
              Pendientes: <strong>{pendingMatches.length}</strong> de {matches.length}
            </Box>
          </>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Resultado: {selectedMatch?.homeTeam} vs {selectedMatch?.awayTeam}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                label={`${selectedMatch?.homeTeam}`}
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                inputProps={{ min: 0, max: 99 }}
                fullWidth
              />
              <Box sx={{ fontSize: "1.5rem", fontWeight: "bold", flexShrink: 0 }}>
                -
              </Box>
              <TextField
                label={`${selectedMatch?.awayTeam}`}
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                inputProps={{ min: 0, max: 99 }}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveResult}
              variant="contained"
              disabled={isSaving || !homeScore || !awayScore}
            >
              {isSaving ? <CircularProgress size={20} /> : "Guardar Resultado"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
