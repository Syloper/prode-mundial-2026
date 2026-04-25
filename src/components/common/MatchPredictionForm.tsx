import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Chip,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Match } from "../../types";
import { usePrediction } from "../../hooks/usePrediction";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { formatDate } from "../../utils/dateHelpers";

interface MatchPredictionFormProps {
  match: Match;
}

export const MatchPredictionForm: React.FC<MatchPredictionFormProps> = ({
  match,
}) => {
  const { getPrediction, savePrediction, isPredictionLocked, canPredict } =
    usePrediction();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const prediction = user ? getPrediction(match.id, user.id) : null;
  const isLocked = user
    ? isPredictionLocked(match.resultDeadline, match.id, user.id)
    : true;
  const canMakePrediction = !!user && !isLocked && canPredict(match.resultDeadline);

  const hoursUntilDeadline =
    (new Date(match.resultDeadline).getTime() - Date.now()) / (1000 * 60 * 60);

  const handleSavePrediction = async () => {
    if (!user) {
      addNotification("Debés estar logueado para hacer predicciones", "error");
      return;
    }

    if (!homeScore || !awayScore) {
      addNotification("Completá ambos campos de puntuación", "warning");
      return;
    }

    const home = parseInt(homeScore);
    const away = parseInt(awayScore);

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0 || home > 99 || away > 99) {
      addNotification("Ingresá números válidos entre 0 y 99", "error");
      return;
    }

    setIsSaving(true);
    try {
      await savePrediction(match.id, home, away, user.id);
      addNotification("Predicción guardada correctamente", "success");
      setHomeScore("");
      setAwayScore("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al guardar la predicción";
      addNotification(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        border: "1px solid #eee",
        borderRadius: 1,
        backgroundColor: isLocked && prediction ? "background.default" : "background.paper",
      }}
    >
      {/* Cabecera: fecha y estado */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: "#666" }}>
          {formatDate(new Date(match.scheduledDate))}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {prediction && (
            <Chip label="Predicción guardada" color="success" size="small" />
          )}
          {isLocked && !prediction && (
            <Chip label="Límite pasado" color="error" size="small" />
          )}
          {!isLocked && hoursUntilDeadline <= 48 && (
            <Chip
              label={`${Math.round(hoursUntilDeadline)}h restantes`}
              color="warning"
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* Predicción ya guardada */}
      {prediction && (
        <Box sx={{ backgroundColor: "#E6F9F1", p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
            Tu predicción:
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="h6">
              {match.homeTeamFlag} {match.homeTeam}
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "primary.main" }}
            >
              {prediction.homeScore} - {prediction.awayScore}
            </Typography>
            <Typography variant="h6">
              {match.awayTeam} {match.awayTeamFlag}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Formulario de predicción */}
      {!prediction && (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              mb: 2,
            }}
          >
            <Box sx={{ textAlign: "right", flex: 1 }}>
              <Typography sx={{ mb: 1 }}>
                {match.homeTeamFlag} {match.homeTeam}
              </Typography>
              <TextField
                type="number"
                inputProps={{ min: 0, max: 99, disabled: isLocked }}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                disabled={isLocked || isSaving}
                size="small"
                sx={{ width: 80 }}
              />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              -
            </Typography>

            <Box sx={{ textAlign: "left", flex: 1 }}>
              <Typography sx={{ mb: 1 }}>
                {match.awayTeam} {match.awayTeamFlag}
              </Typography>
              <TextField
                type="number"
                inputProps={{ min: 0, max: 99, disabled: isLocked }}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                disabled={isLocked || isSaving}
                size="small"
                sx={{ width: 80 }}
              />
            </Box>
          </Box>

          {isLocked ? (
            <Alert severity="error">
              No se puede predecir: el plazo venció 24 horas antes del partido
            </Alert>
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={handleSavePrediction}
              disabled={!homeScore || !awayScore || isSaving || !canMakePrediction}
            >
              {isSaving ? (
                <CircularProgress size={20} />
              ) : (
                "Guardar Predicción"
              )}
            </Button>
          )}
        </>
      )}

      {/* Resultado oficial */}
      {match.isFinished && (
        <Box sx={{ mt: 2, p: 1, backgroundColor: "#FFF8F0", borderRadius: 1, border: "1px solid #FFE0B2" }}>
          <Typography variant="caption" sx={{ fontWeight: "bold" }}>
            Resultado oficial: {match.homeTeam} {match.homeScore} -{" "}
            {match.awayScore} {match.awayTeam}
          </Typography>
          {prediction && (
            <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
              {prediction.homeScore === match.homeScore &&
              prediction.awayScore === match.awayScore
                ? "Acertaste el resultado exacto! (+3 pts)"
                : (prediction.homeScore > prediction.awayScore &&
                      (match.homeScore ?? 0) > (match.awayScore ?? 0)) ||
                    (prediction.homeScore < prediction.awayScore &&
                      (match.homeScore ?? 0) < (match.awayScore ?? 0)) ||
                    (prediction.homeScore === prediction.awayScore &&
                      match.homeScore === match.awayScore)
                  ? "Acertaste el ganador (+1 pt)"
                  : "No acertaste esta vez"}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};
