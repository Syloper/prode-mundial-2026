import React, { useState, useCallback } from "react";
import {
  Box, TextField, Typography, Chip, Button, Alert, CircularProgress,
  Collapse, List, ListItem, ListItemText, Divider, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import { Match, PenaltyWinner } from "../../types";
import { usePrediction } from "../../hooks/usePrediction";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { formatDate } from "../../utils/dateHelpers";
import { supabase } from "../../lib/supabase";
import { FlagImg } from "./FlagImg";
import {
  formatPenaltyWinnerLabel,
  matchSupportsPenaltyPrediction,
} from "../../utils/matchHelpers";
import { calculatePointsBreakdown, describePointsEarned } from "../../utils/scoringHelpers";

interface OtherPrediction {
  userName: string;
  homeScore: number;
  awayScore: number;
  penaltyWinner?: PenaltyWinner | null;
}

interface MatchPredictionFormProps {
  match: Match;
}

const mobileSmallTypography = {
  fontSize: { xs: "12px", sm: "inherit" }
};

const formatScoreLine = (
  homeScore: number,
  awayScore: number,
  penaltyWinner: PenaltyWinner | null | undefined,
  match: Match
) => {
  const base = `${homeScore} - ${awayScore}`;
  if (!penaltyWinner) return base;
  return `${base} (pen. ${formatPenaltyWinnerLabel(penaltyWinner, match)})`;
};

export const MatchPredictionForm: React.FC<MatchPredictionFormProps> = ({ match }) => {
  const { getPrediction, savePrediction, deletePrediction, isPredictionLocked, canPredict, canCancelPrediction } = usePrediction();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [penaltyWinner, setPenaltyWinner] = useState<PenaltyWinner | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [others, setOthers] = useState<OtherPrediction[]>([]);
  const [loadingOthers, setLoadingOthers] = useState(false);

  const supportsPenalties = matchSupportsPenaltyPrediction(match);
  const prediction = user ? getPrediction(match.id, user.id) : null;
  const isLocked = !user || match.isFinished || isPredictionLocked(match.resultDeadline, match.id, user.id);
  const canMakePrediction = !!user && !isLocked && canPredict(match.resultDeadline);
  const canCancel = !!user && !!prediction && !match.isFinished && canCancelPrediction(match.scheduledDate);
  const deadlinePassed = match.isFinished || new Date() > new Date(match.resultDeadline);

  const parsedHome = homeScore !== "" ? parseInt(homeScore) : null;
  const parsedAway = awayScore !== "" ? parseInt(awayScore) : null;
  const isTieInput =
    parsedHome !== null &&
    parsedAway !== null &&
    !isNaN(parsedHome) &&
    !isNaN(parsedAway) &&
    parsedHome === parsedAway;
  const showPenaltyPicker = supportsPenalties && isTieInput;

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
    if (supportsPenalties && home === away && !penaltyWinner) {
      addNotification("Si predijiste empate, indicá quién gana en penales", "warning");
      return;
    }

    setIsSaving(true);
    try {
      await savePrediction(
        match.id,
        home,
        away,
        user.id,
        supportsPenalties && home === away ? penaltyWinner : null
      );
      addNotification("Predicción guardada correctamente", "success");
      setHomeScore("");
      setAwayScore("");
      setPenaltyWinner(null);
    } catch (err) {
      addNotification(err instanceof Error ? err.message : "Error al guardar la predicción", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPrediction = async () => {
    if (!user || !prediction) return;
    setIsSaving(true);
    try {
      await deletePrediction(match.id, user.id);
      addNotification("Predicción cancelada — podés hacer una nueva", "success");
    } catch (err) {
      addNotification(err instanceof Error ? err.message : "Error al cancelar la predicción", "error");
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
        penaltyWinner: r.penalty_winner ?? undefined,
      }))
    );
    setLoadingOthers(false);
  }, [showOthers, match.id]);

  const pointsBreakdown =
    prediction &&
    match.isFinished &&
    match.homeScore !== undefined &&
    match.awayScore !== undefined
      ? calculatePointsBreakdown(
          prediction.homeScore,
          prediction.awayScore,
          match.homeScore,
          match.awayScore,
          prediction.penaltyWinner,
          match.penaltyWinner,
          supportsPenalties
        )
      : null;

  return (
    <Box sx={{
      p: 2, mb: 2, border: "1px solid #eee", borderRadius: 1,
      backgroundColor: isLocked && prediction ? "background.default" : "background.paper",
    }}>
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

      {prediction && (
        <Box sx={{ backgroundColor: "#E6F9F1", p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, ...mobileSmallTypography }}>Tu predicción:</Typography>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Typography variant="h6" sx={mobileSmallTypography}><FlagImg flag={match.homeTeamFlag} /> {match.homeTeam}</Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main", ...mobileSmallTypography }}>
              {formatScoreLine(prediction.homeScore, prediction.awayScore, prediction.penaltyWinner, match)}
            </Typography>
            <Typography variant="h6" sx={mobileSmallTypography}>{match.awayTeam} <FlagImg flag={match.awayTeamFlag} /></Typography>
          </Box>
          {canCancel && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              fullWidth
              onClick={handleCancelPrediction}
              disabled={isSaving}
              sx={{ mt: 2, ...mobileSmallTypography }}
            >
              {isSaving ? <CircularProgress size={20} /> : "Cancelar predicción"}
            </Button>
          )}
        </Box>
      )}

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
                  if (v !== "" && awayScore !== "" && parseInt(v) !== parseInt(awayScore)) {
                    setPenaltyWinner(null);
                  }
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
                  if (v !== "" && homeScore !== "" && parseInt(v) !== parseInt(homeScore)) {
                    setPenaltyWinner(null);
                  }
                }}
                disabled={isLocked || isSaving} size="small" sx={{ width: 80, ...mobileSmallTypography }}
              />
            </Box>
          </Box>

          {showPenaltyPicker && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary", ...mobileSmallTypography }}>
                ¿Quién gana en penales?
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={penaltyWinner}
                onChange={(_, value: PenaltyWinner | null) => setPenaltyWinner(value)}
                disabled={isLocked || isSaving}
              >
                <ToggleButton value="home" sx={mobileSmallTypography}>
                  <FlagImg flag={match.homeTeamFlag} /> {match.homeTeam}
                </ToggleButton>
                <ToggleButton value="away" sx={mobileSmallTypography}>
                  {match.awayTeam} <FlagImg flag={match.awayTeamFlag} />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          {supportsPenalties && !showPenaltyPicker && homeScore && awayScore && parsedHome !== parsedAway && (
            <Typography variant="caption" sx={{ display: "block", textAlign: "center", mb: 1, color: "text.secondary", ...mobileSmallTypography }}>
              Si el partido va a penales, predecí un empate en el marcador.
            </Typography>
          )}

          {isLocked ? (
            <Alert severity="error" sx={mobileSmallTypography}>
              {match.isFinished
                ? "El partido ya tiene resultado — no se pueden cargar predicciones"
                : "No se puede predecir: el plazo venció 24 horas antes del partido"}
            </Alert>
          ) : (
            <Button variant="contained" fullWidth onClick={handleSavePrediction}
              disabled={
                !homeScore ||
                !awayScore ||
                isSaving ||
                !canMakePrediction ||
                (showPenaltyPicker && !penaltyWinner)
              }
              sx={mobileSmallTypography}>
              {isSaving ? <CircularProgress size={20} /> : "Guardar Predicción"}
            </Button>
          )}
        </>
      )}

      {match.isFinished && (
        <Box sx={{ mt: 2, p: 1, backgroundColor: "#FFF8F0", borderRadius: 1, border: "1px solid #FFE0B2" }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", ...mobileSmallTypography }}>
            Resultado oficial: {match.homeTeam}{" "}
            {formatScoreLine(match.homeScore ?? 0, match.awayScore ?? 0, match.penaltyWinner, match)}{" "}
            {match.awayTeam}
          </Typography>
          {prediction && pointsBreakdown && (
            <Typography variant="caption" sx={{ display: "block", mt: 0.5, ...mobileSmallTypography }}>
              {describePointsEarned(pointsBreakdown)}
            </Typography>
          )}
        </Box>
      )}

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
                          <strong>{o.userName}</strong>:{" "}
                          <FlagImg flag={match.homeTeamFlag} />{" "}
                          {formatScoreLine(o.homeScore, o.awayScore, o.penaltyWinner, match)}{" "}
                          <FlagImg flag={match.awayTeamFlag} />
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
