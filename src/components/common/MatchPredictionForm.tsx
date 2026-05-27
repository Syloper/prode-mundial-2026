import React, { useState, useCallback } from "react";
import {
  Box, TextField, Typography, Chip, Button, Alert, CircularProgress,
  Collapse, List, ListItem, ListItemText, Divider,
} from "@mui/material";
import { Match } from "../../types";
import { usePrediction } from "../../hooks/usePrediction";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { formatDate } from "../../utils/dateHelpers";
import { supabase } from "../../lib/supabase";
import { FlagImg } from "./FlagImg";

interface OtherPrediction {
  userName: string;
  homeScore: number;
  awayScore: number;
}

interface MatchPredictionFormProps {
  match: Match;
}

const mobileSmallTypography = {
  fontSize: { xs: "12px", sm: "inherit" }
};

export const MatchPredictionForm: React.FC<MatchPredictionFormProps> = ({ match }) => {
  const { getPrediction, savePrediction, isPredictionLocked, canPredict } = usePrediction();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [others, setOthers] = useState<OtherPrediction[]>([]);
  const [loadingOthers, setLoadingOthers] = useState(false);

  const prediction = user ? getPrediction(match.id, user.id) : null;
  const isLocked = !user || match.isFinished || isPredictionLocked(match.resultDeadline, match.id, user.id);
  const canMakePrediction = !!user && !isLocked && canPredict(match.resultDeadline);
  const deadlinePassed = match.isFinished || new Date() > new Date(match.resultDeadline);

  const hoursUntilDeadline =
    (new Date(match.resultDeadline).getTime() - Date.now()) / (1000 * 60 * 60);

  const handleSavePrediction = async () => {
    if (!user) { addNotification("Debés estar logueado para hacer predicciones", "error"); return; }
    if (!homeScore || !awayScore) { addNotification("Completá ambos campos de puntuación", "warning"); return; }
    const home = parseInt(homeScore);
    const away = parseInt(awayScore);
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0 || home > 99 || away > 99) {
      addNotification("Ingresá números válidos entre 0 y 99", "error"); return;
    }
    setIsSaving(true);
    try {
      await savePrediction(match.id, home, away, user.id);
      addNotification("Predicción guardada correctamente", "success");
      setHomeScore(""); setAwayScore("");
    } catch (err) {
      addNotification(err instanceof Error ? err.message : "Error al guardar la predicción", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOthers = useCallback(async () => {
    if (showOthers) { setShowOthers(false); return; }
    setLoadingOthers(true);
    setShowOthers(true);
    const { data } = await supabase
      .rpc("get_match_predictions", { p_match_id: parseInt(match.id) });

    setOthers(
      (data ?? []).map((r) => ({
        userName: r.user_name,
        homeScore: r.home_score,
        awayScore: r.away_score,
      }))
    );
    setLoadingOthers(false);
  }, [showOthers, match.id]);

  return (
    <Box sx={{
      p: 2, mb: 2, border: "1px solid #eee", borderRadius: 1,
      backgroundColor: isLocked && prediction ? "background.default" : "background.paper",
    }}>
      {/* Cabecera */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="caption" sx={{ color: "#666", ...mobileSmallTypography }}>
          {formatDate(new Date(match.scheduledDate))}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {prediction && <Chip label="Predicción guardada" color="success" size="small" />}
          {isLocked && !prediction && <Chip label="Límite pasado" color="error" size="small" />}
          {!isLocked && hoursUntilDeadline <= 48 && (
            <Chip label={`${Math.round(hoursUntilDeadline)}h restantes`} color="warning" size="small" />
          )}
        </Box>
      </Box>

      {/* Predicción guardada */}
      {prediction && (
        <Box sx={{ backgroundColor: "#E6F9F1", p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, ...mobileSmallTypography }}>Tu predicción:</Typography>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
            <Typography variant="h6" sx={mobileSmallTypography}><FlagImg flag={match.homeTeamFlag} /> {match.homeTeam}</Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main", ...mobileSmallTypography }}>
              {prediction.homeScore} - {prediction.awayScore}
            </Typography>
            <Typography variant="h6" sx={mobileSmallTypography}>{match.awayTeam} <FlagImg flag={match.awayTeamFlag} /></Typography>
          </Box>
        </Box>
      )}

      {/* Formulario */}
      {!prediction && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 2 }}>
            <Box sx={{ textAlign: "right", flex: 1 }}>
              <Typography sx={{ mb: 1, ...mobileSmallTypography }}><FlagImg flag={match.homeTeamFlag} /> {match.homeTeam}</Typography>
              <TextField
                type="text"
                inputProps={{ inputMode: "numeric", maxLength: 2, style: { fontSize: "12px" } }}
                value={homeScore}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                  setHomeScore(v);
                }}
                disabled={isLocked || isSaving} size="small" sx={{ width: 80, ...mobileSmallTypography }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", ...mobileSmallTypography }}>-</Typography>
            <Box sx={{ textAlign: "left", flex: 1 }}>
              <Typography sx={{ mb: 1, ...mobileSmallTypography }}>{match.awayTeam} <FlagImg flag={match.awayTeamFlag} /></Typography>
              <TextField
                type="text"
                inputProps={{ inputMode: "numeric", maxLength: 2, style: { fontSize: "12px" } }}
                value={awayScore}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                  setAwayScore(v);
                }}
                disabled={isLocked || isSaving} size="small" sx={{ width: 80, ...mobileSmallTypography }}
              />
            </Box>
          </Box>
          {isLocked ? (
            <Alert severity="error" sx={mobileSmallTypography}>
              {match.isFinished
                ? "El partido ya tiene resultado — no se pueden cargar predicciones"
                : "No se puede predecir: el plazo venció 24 horas antes del partido"}
            </Alert>
          ) : (
            <Button variant="contained" fullWidth onClick={handleSavePrediction}
              disabled={!homeScore || !awayScore || isSaving || !canMakePrediction} sx={mobileSmallTypography}>
              {isSaving ? <CircularProgress size={20} /> : "Guardar Predicción"}
            </Button>
          )}
        </>
      )}

      {/* Resultado oficial */}
      {match.isFinished && (
        <Box sx={{ mt: 2, p: 1, backgroundColor: "#FFF8F0", borderRadius: 1, border: "1px solid #FFE0B2" }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", ...mobileSmallTypography }}>
            Resultado oficial: {match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}
          </Typography>
          {prediction && (
            <Typography variant="caption" sx={{ display: "block", mt: 0.5, ...mobileSmallTypography }}>
              {prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore
                ? "Acertaste el resultado exacto! (+3 pts)"
                : (prediction.homeScore > prediction.awayScore && (match.homeScore ?? 0) > (match.awayScore ?? 0)) ||
                  (prediction.homeScore < prediction.awayScore && (match.homeScore ?? 0) < (match.awayScore ?? 0)) ||
                  (prediction.homeScore === prediction.awayScore && match.homeScore === match.awayScore)
                  ? "Acertaste el ganador (+1 pt)"
                  : "No acertaste esta vez"}
            </Typography>
          )}
        </Box>
      )}

      {/* Ver predicciones ajenas (solo después del deadline) */}
      {deadlinePassed && user && (
        <Box sx={{ mt: 1.5 }}>
          <Divider sx={{ mb: 1 }} />
          <Button
            size="small" variant="text" color="inherit"
            sx={{ fontSize: { xs: "12px", sm: "0.75rem" }, color: "text.secondary" }}
            onClick={handleToggleOthers}
          >
            {showOthers ? "▲ Ocultar predicciones" : "▼ Ver predicciones de otros"}
          </Button>
          <Collapse in={showOthers}>
            {loadingOthers ? (
              <Box sx={{ textAlign: "center", py: 1 }}><CircularProgress size={16} /></Box>
            ) : others.length === 0 ? (
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1, ...mobileSmallTypography }}>
                Nadie más predijo este partido.
              </Typography>
            ) : (
              <List dense disablePadding>
                {others.map((o, i) => (
                  <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={
                        <Typography variant="caption" sx={mobileSmallTypography}>
                          <strong>{o.userName}</strong>: <FlagImg flag={match.homeTeamFlag} /> {o.homeScore} - {o.awayScore} <FlagImg flag={match.awayTeamFlag} />
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Collapse>
        </Box>
      )}
    </Box>
  );
};
