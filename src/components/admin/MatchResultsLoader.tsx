import React, { useState } from "react";
import { FlagImg } from "../common/FlagImg";
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
  Chip,
  Typography,
  Divider,
  Autocomplete,
} from "@mui/material";
import { TEAM_FLAGS, ALL_TEAMS } from "../../utils/teamFlags";
import { useMatches } from "../../hooks/useMatches";
import { useNotification } from "../../hooks/useNotification";
import { useAuth } from "../../hooks/useAuth";
import { Match } from "../../types";

const toDatetimeLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const MatchResultsLoader: React.FC = () => {
  const { matches, updateMatchResult, updateMatch, updateKnockoutFromStandings, seedMatchesIfEmpty, isSeeding } = useMatches();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingKnockout, setIsUpdatingKnockout] = useState(false);

  // Campos editables
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeFlag, setHomeFlag] = useState("");
  const [awayFlag, setAwayFlag] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const handleOpenDialog = (match: Match) => {
    setSelectedMatch(match);
    setHomeTeam(match.homeTeam);
    setAwayTeam(match.awayTeam);
    setHomeFlag(match.homeTeamFlag);
    setAwayFlag(match.awayTeamFlag);
    setScheduledDate(toDatetimeLocal(new Date(match.scheduledDate)));
    setHomeScore(match.homeScore !== undefined ? String(match.homeScore) : "");
    setAwayScore(match.awayScore !== undefined ? String(match.awayScore) : "");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMatch(null);
  };

  const handleSave = async () => {
    if (!selectedMatch) return;
    setIsSaving(true);
    try {
      const newDate = new Date(scheduledDate);
      const newDeadline = new Date(newDate.getTime() - 5 * 60 * 60 * 1000);

      await updateMatch(selectedMatch.id, {
        homeTeam,
        awayTeam,
        homeTeamFlag: homeFlag,
        awayTeamFlag: awayFlag,
        scheduledDate: newDate,
        resultDeadline: newDeadline,
      });

      const hasScores = homeScore !== "" && awayScore !== "";
      if (hasScores) {
        const home = parseInt(homeScore);
        const away = parseInt(awayScore);
        if (!isNaN(home) && !isNaN(away) && home >= 0 && away >= 0) {
          await updateMatchResult(selectedMatch.id, home, away);
        }
      }

      addNotification("Partido actualizado correctamente", "success");
      handleCloseDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al guardar";
      addNotification(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateKnockout = async () => {
    setIsUpdatingKnockout(true);
    try {
      const count = await updateKnockoutFromStandings();
      addNotification(`${count} cruces de 16avos actualizados correctamente`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar los cruces";
      addNotification(message, "error");
    } finally {
      setIsUpdatingKnockout(false);
    }
  };

  const handleSeedMatches = async () => {
    try {
      const seeded = await seedMatchesIfEmpty();
      addNotification(
        seeded ? "Partidos sembrados correctamente" : "Los partidos ya estaban cargados",
        seeded ? "success" : "info"
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al sembrar";
      addNotification(message, "error");
    }
  };

  if (!user || !["admin", "data_entry"].includes(user.role)) {
    return <Alert severity="error">Acceso restringido</Alert>;
  }

  const pendingMatches = matches.filter((m) => !m.isFinished);

  return (
    <Card>
      <CardHeader title="Partidos y Resultados" />
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
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Grupo / Fase</strong></TableCell>
                    <TableCell><strong>Partido</strong></TableCell>
                    <TableCell><strong>Resultado</strong></TableCell>
                    <TableCell align="center"><strong>Estado</strong></TableCell>
                    <TableCell align="center"><strong>Editar</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {new Date(match.scheduledDate).toLocaleDateString("es-AR", {
                          day: "2-digit", month: "2-digit", year: "2-digit",
                        })}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {match.phase
                          ? <Chip label={match.phase} size="small" color="primary" variant="outlined" />
                          : <Chip label={`Grupo ${match.group}`} size="small" variant="outlined" />
                        }
                      </TableCell>
                      <TableCell>
                        <FlagImg flag={match.homeTeamFlag} /> {match.homeTeam} vs {match.awayTeam} <FlagImg flag={match.awayTeamFlag} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {match.isFinished ? `${match.homeScore} - ${match.awayScore}` : "-"}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={match.isFinished ? "Finalizado" : "Pendiente"}
                          color={match.isFinished ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDialog(match)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
              <Box sx={{ p: 1, backgroundColor: "#f0f0f0", borderRadius: 1 }}>
                Pendientes: <strong>{pendingMatches.length}</strong> de {matches.length}
              </Box>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleUpdateKnockout}
                disabled={isUpdatingKnockout}
                startIcon={isUpdatingKnockout ? <CircularProgress size={16} /> : undefined}
              >
                {isUpdatingKnockout ? "Calculando..." : "⚡ Actualizar cruces 16avos desde grupos"}
              </Button>
            </Box>
          </>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Editar partido</DialogTitle>
          <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Equipos */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                label="🏳️"
                value={homeFlag}
                onChange={(e) => setHomeFlag(e.target.value)}
                sx={{ width: 72 }}
                size="small"
                inputProps={{ maxLength: 8 }}
              />
              <Autocomplete
                options={ALL_TEAMS}
                freeSolo
                fullWidth
                value={homeTeam}
                onChange={(_, v) => {
                  const team = v ?? "";
                  setHomeTeam(team);
                  if (TEAM_FLAGS[team]) setHomeFlag(TEAM_FLAGS[team]);
                }}
                onInputChange={(_, v) => {
                  setHomeTeam(v);
                  if (TEAM_FLAGS[v]) setHomeFlag(TEAM_FLAGS[v]);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Equipo local" size="small" />
                )}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                label="🏳️"
                value={awayFlag}
                onChange={(e) => setAwayFlag(e.target.value)}
                sx={{ width: 72 }}
                size="small"
                inputProps={{ maxLength: 8 }}
              />
              <Autocomplete
                options={ALL_TEAMS}
                freeSolo
                fullWidth
                value={awayTeam}
                onChange={(_, v) => {
                  const team = v ?? "";
                  setAwayTeam(team);
                  if (TEAM_FLAGS[team]) setAwayFlag(TEAM_FLAGS[team]);
                }}
                onInputChange={(_, v) => {
                  setAwayTeam(v);
                  if (TEAM_FLAGS[v]) setAwayFlag(TEAM_FLAGS[v]);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Equipo visitante" size="small" />
                )}
              />
            </Box>

            {/* Fecha */}
            <TextField
              label="Fecha y hora del partido"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              helperText="El límite de predicción se calculará 5h antes automáticamente"
            />

            <Divider />

            {/* Resultado */}
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              Resultado (opcional)
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                label={homeTeam || "Local"}
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                inputProps={{ min: 0, max: 99 }}
                fullWidth
                size="small"
              />
              <Typography variant="h6" sx={{ fontWeight: "bold", flexShrink: 0 }}>
                -
              </Typography>
              <TextField
                label={awayTeam || "Visitante"}
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                inputProps={{ min: 0, max: 99 }}
                fullWidth
                size="small"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={isSaving || !homeTeam || !awayTeam}
            >
              {isSaving ? <CircularProgress size={20} /> : "Guardar"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
