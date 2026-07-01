import React, { useEffect, useState } from "react";
import {
  Container, Box, Typography, Paper, Grid, TextField, Button,
  Divider, CircularProgress, Alert, Chip,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { useMatches } from "../hooks/useMatches";
import { supabase } from "../lib/supabase";
import { useNotification } from "../hooks/useNotification";

interface Stats {
  total: number;
  exact: number;
  winner: number;
  points: number;
  byPhase: Record<string, { points: number; exact: number; winner: number }>;
}

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { matches } = useMatches();
  const { addNotification } = useNotification();

  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("predictions")
        .select("match_id, home_score, away_score")
        .eq("user_id", user.id);
      if (!data) return;

      const s: Stats = { total: data.length, exact: 0, winner: 0, points: 0, byPhase: {} };

      for (const pred of data) {
        const match = matches.find((m) => m.id === String(pred.match_id));
        if (!match?.isFinished || match.homeScore === undefined || match.awayScore === undefined) continue;

        const phase = match.phase ?? `Grupo ${match.group}`;
        if (!s.byPhase[phase]) s.byPhase[phase] = { points: 0, exact: 0, winner: 0 };

        if (pred.home_score === match.homeScore && pred.away_score === match.awayScore) {
          s.exact++; s.points += 3;
          s.byPhase[phase].exact++; s.byPhase[phase].points += 3;
        } else {
          const predWin = pred.home_score > pred.away_score ? 1 : pred.home_score < pred.away_score ? -1 : 0;
          const realWin = match.homeScore > match.awayScore ? 1 : match.homeScore < match.awayScore ? -1 : 0;
          if (predWin === realWin) {
            s.winner++; s.points += 1;
            s.byPhase[phase].winner++; s.byPhase[phase].points += 1;
          }
        }
      }
      setStats(s);
    };
    load();
  }, [user, matches]);

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ name: name.trim() }).eq("id", user.id);
    setSavingName(false);
    if (error) { addNotification("Error al actualizar el nombre", "error"); return; }
    addNotification("Nombre actualizado. Volvé a iniciar sesión para verlo reflejado.", "success");
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      addNotification("Ingresá tu contraseña actual", "error"); return;
    }
    if (!newPassword || newPassword.length < 8) {
      addNotification("La contraseña nueva debe tener al menos 8 caracteres", "error"); return;
    }
    setSavingPassword(true);
    // Verificar contraseña actual antes de actualizar
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user!.email,
      password: currentPassword,
    });
    if (authError) {
      setSavingPassword(false);
      addNotification("La contraseña actual es incorrecta", "error"); return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) { addNotification(error.message, "error"); return; }
    addNotification("Contraseña actualizada correctamente", "success");
    setCurrentPassword(""); setNewPassword("");
  };

  if (!user) return null;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4 }}>Mi Perfil</Typography>

      <Grid container spacing={3}>
        {/* Estadísticas */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Mis estadísticas</Typography>
            {!stats ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {[
                    { label: "Puntos totales", value: stats.points, color: "#00B96B" },
                    { label: "Predicciones", value: stats.total, color: "#2A3235" },
                    { label: "Exactos (+3)", value: stats.exact, color: "#00B96B" },
                    { label: "Ganador (+1)", value: stats.winner, color: "#2A3235" },
                  ].map((item) => (
                    <Grid item xs={6} sm={3} key={item.label}>
                      <Box sx={{ textAlign: "center", p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: item.color }}>{item.value}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                {Object.keys(stats.byPhase).length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Por fase</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {Object.entries(stats.byPhase).map(([phase, ps]) => (
                        <Chip
                          key={phase}
                          label={`${phase}: ${ps.points} pts (${ps.exact} exactos, ${ps.winner} ganador)`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </>
                )}
                {stats.total === 0 && (
                  <Alert severity="info">Todavía no hiciste ninguna predicción en partidos finalizados.</Alert>
                )}
              </>
            )}
          </Paper>
        </Grid>

        {/* Datos personales */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Datos personales</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="Email" value={user.email} disabled fullWidth size="small" />
              <TextField label="DNI" value={user.dni ?? "-"} disabled fullWidth size="small" />
              <TextField
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 25))}
                fullWidth
                size="small"
                inputProps={{ maxLength: 25 }}
                helperText={`${name.length}/25 caracteres`}
              />
              <Button
                variant="contained"
                onClick={handleSaveName}
                disabled={savingName || !name.trim() || name === user.name}
              >
                {savingName ? <CircularProgress size={20} /> : "Guardar nombre"}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Cambiar contraseña */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Cambiar contraseña</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Contraseña actual"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                size="small"
                helperText="Mínimo 8 caracteres, una mayúscula y un número"
              />
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={savingPassword || !newPassword}
              >
                {savingPassword ? <CircularProgress size={20} /> : "Cambiar contraseña"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
