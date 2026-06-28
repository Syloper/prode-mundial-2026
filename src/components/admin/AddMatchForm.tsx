import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Autocomplete,
  Grid,
} from "@mui/material";
import { supabase } from "../../lib/supabase";
import { useNotification } from "../../hooks/useNotification";
import { useMatches } from "../../hooks/useMatches";
import { TEAM_FLAGS, ALL_TEAMS } from "../../utils/teamFlags";

const PHASES = [
  { value: "round32", label: "Dieciseisavos de final" },
  { value: "round16", label: "Octavos de final" },
  { value: "quarterfinals", label: "Cuartos de final" },
  { value: "semifinals", label: "Semifinal" },
  { value: "third_place", label: "Tercer puesto" },
  { value: "final", label: "Final" },
];

interface FormState {
  homeTeam: string;
  homeFlag: string;
  awayTeam: string;
  awayFlag: string;
  phase: string;
  scheduledDate: string;
}

const defaultForm: FormState = {
  homeTeam: "",
  homeFlag: "",
  awayTeam: "",
  awayFlag: "",
  phase: "round16",
  scheduledDate: "",
};

export const AddMatchForm: React.FC = () => {
  const { addNotification } = useNotification();
  const { refetch } = useMatches();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  const handleTeamChange = (side: "home" | "away", value: string | null) => {
    const team = value ?? "";
    const flag = TEAM_FLAGS[team] ?? "";
    setForm((prev) => ({
      ...prev,
      [`${side}Team`]: team,
      [`${side}Flag`]: flag,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.homeTeam || !form.awayTeam) {
      addNotification("Ingresá ambos equipos", "error");
      return;
    }
    if (form.homeTeam === form.awayTeam) {
      addNotification("Los equipos no pueden ser iguales", "error");
      return;
    }
    if (!form.scheduledDate) {
      addNotification("Ingresá la fecha y hora del partido", "error");
      return;
    }

    const scheduledDate = new Date(form.scheduledDate);
    const resultDeadline = new Date(scheduledDate.getTime() - 5 * 60 * 60 * 1000);

    // Obtener el próximo ID disponible
    const { data: maxRow } = await supabase
      .from("matches")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextId = (maxRow?.id ?? 72) + 1;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("matches").insert({
        id: nextId,
        home_team: form.homeTeam,
        away_team: form.awayTeam,
        home_team_flag: form.homeFlag || "🏳️",
        away_team_flag: form.awayFlag || "🏳️",
        group_name: form.phase,
        scheduled_date: scheduledDate.toISOString(),
        result_deadline: resultDeadline.toISOString(),
        is_finished: false,
      });

      if (error) throw new Error(error.message);

      addNotification(
        `Partido agregado: ${form.homeTeam} vs ${form.awayTeam}`,
        "success"
      );
      setForm(defaultForm);
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear el partido";
      addNotification(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 680 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
        Agregar Partido de Eliminación Directa
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        El deadline para predecir se calcula automáticamente como 5 horas antes del
        partido. El equipo local y visitante pueden ser cualquier selección clasificada.
      </Alert>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Equipo local */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={ALL_TEAMS}
              freeSolo
              value={form.homeTeam}
              onChange={(_, v) => handleTeamChange("home", v)}
              onInputChange={(_, v) => handleTeamChange("home", v)}
              renderInput={(params) => (
                <TextField {...params} label="Equipo local" required fullWidth />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Bandera local (emoji)"
              value={form.homeFlag}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, homeFlag: e.target.value }))
              }
              fullWidth
              inputProps={{ maxLength: 8 }}
              helperText="Se completa automáticamente si seleccionás del listado"
            />
          </Grid>

          {/* Equipo visitante */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={ALL_TEAMS}
              freeSolo
              value={form.awayTeam}
              onChange={(_, v) => handleTeamChange("away", v)}
              onInputChange={(_, v) => handleTeamChange("away", v)}
              renderInput={(params) => (
                <TextField {...params} label="Equipo visitante" required fullWidth />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Bandera visitante (emoji)"
              value={form.awayFlag}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, awayFlag: e.target.value }))
              }
              fullWidth
              inputProps={{ maxLength: 8 }}
              helperText="Se completa automáticamente si seleccionás del listado"
            />
          </Grid>

          {/* Fase */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Fase</InputLabel>
              <Select
                value={form.phase}
                label="Fase"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phase: e.target.value }))
                }
              >
                {PHASES.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Fecha y hora */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fecha y hora del partido"
              type="datetime-local"
              value={form.scheduledDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, scheduledDate: e.target.value }))
              }
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              helperText="El deadline de predicciones será 5h antes"
            />
          </Grid>

          {/* Preview */}
          {form.homeTeam && form.awayTeam && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 1,
                  textAlign: "center",
                }}
              >
                <Typography variant="body1">
                  <strong>
                    {form.homeFlag} {form.homeTeam}
                  </strong>
                  {"  vs  "}
                  <strong>
                    {form.awayTeam} {form.awayFlag}
                  </strong>
                </Typography>
                {form.scheduledDate && (
                  <Typography variant="caption" sx={{ color: "#666" }}>
                    {new Date(form.scheduledDate).toLocaleString("es-AR")} —{" "}
                    {PHASES.find((p) => p.value === form.phase)?.label}
                  </Typography>
                )}
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSaving}
              size="large"
            >
              {isSaving ? <CircularProgress size={24} /> : "Agregar Partido"}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};
