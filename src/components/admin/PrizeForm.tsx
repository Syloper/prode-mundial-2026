import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";
import { prizeSchema, PrizeFormData } from "../../utils/validators";
import { usePrize } from "../../hooks/usePrize";
import { useNotification } from "../../hooks/useNotification";
import { useAuth } from "../../hooks/useAuth";

const criteriaDescriptions: Record<string, string> = {
  most_points_date: "Usuario con más puntos en una fecha específica",
  most_points_phase: "Usuario con más puntos en una fase (grupos, octavos, etc.)",
  most_points_tournament: "Usuario con más puntos en todo el torneo",
};

const tieDescriptions: Record<string, string> = {
  all: "Entregar a TODOS los ganadores empatados",
  draw: "Hacer un SORTEO entre los empatados",
  first: "Entregar al que predijo primero",
};

export const PrizeForm: React.FC<{ onPrizeCreated?: () => void }> = ({
  onPrizeCreated,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PrizeFormData>({
    resolver: zodResolver(prizeSchema),
    defaultValues: {
      name: "",
      description: "",
      photoUrl: "",
      criteria: "most_points_tournament",
      assignmentType: "automatic",
      tieResolution: "all",
      phase: "",
    },
  });

  const { createPrize } = usePrize();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const criteriaValue = watch("criteria");
  const tieValue = watch("tieResolution");

  const onSubmit = async (data: PrizeFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await createPrize({
        name: data.name,
        description: data.description,
        photoUrl: data.photoUrl || undefined,
        criteria: data.criteria,
        assignmentType: data.assignmentType,
        tieResolution: data.tieResolution,
        phase: data.phase || undefined,
        createdBy: user.id,
      });
      addNotification(`Premio "${data.name}" creado exitosamente`, "success");
      reset();
      onPrizeCreated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear premio";
      addNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
        Crear Nuevo Premio
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Nombre del Premio"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              placeholder="Ej: Mejor Predictor del Torneo"
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description?.message}
              placeholder="Describí qué se lleva el ganador"
            />
          )}
        />

        <Controller
          name="photoUrl"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="URL de imagen (opcional)"
              fullWidth
              error={!!errors.photoUrl}
              helperText={errors.photoUrl?.message ?? "Ej: https://example.com/premio.jpg"}
              type="url"
            />
          )}
        />

        <FormControl fullWidth>
          <FormLabel>Criterio de Obtención</FormLabel>
          <Controller
            name="criteria"
            control={control}
            render={({ field }) => (
              <>
                <Select {...field} sx={{ mb: 1 }}>
                  <MenuItem value="most_points_date">Más puntos de la fecha</MenuItem>
                  <MenuItem value="most_points_phase">Más puntos de la fase</MenuItem>
                  <MenuItem value="most_points_tournament">Más puntos del torneo</MenuItem>
                </Select>
                <Alert severity="info" sx={{ mt: 1 }}>
                  {criteriaDescriptions[criteriaValue]}
                </Alert>
              </>
            )}
          />
        </FormControl>

        <Controller
          name="phase"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <FormLabel>Fase (solo si aplica)</FormLabel>
              <Select {...field} displayEmpty>
                <MenuItem value="">Sin fase específica</MenuItem>
                <MenuItem value="groups">Grupos</MenuItem>
                <MenuItem value="round16">Dieciseisavos</MenuItem>
                <MenuItem value="quarterfinals">Cuartos</MenuItem>
                <MenuItem value="semifinals">Semifinales</MenuItem>
                <MenuItem value="final">Final</MenuItem>
              </Select>
            </FormControl>
          )}
        />

        <FormControl fullWidth>
          <FormLabel>Tipo de Asignación</FormLabel>
          <Controller
            name="assignmentType"
            control={control}
            render={({ field }) => (
              <RadioGroup {...field}>
                <FormControlLabel
                  value="automatic"
                  control={<Radio />}
                  label="Automático (se calcula por puntos)"
                />
                <FormControlLabel
                  value="manual"
                  control={<Radio />}
                  label="Manual (el admin elige el ganador)"
                />
              </RadioGroup>
            )}
          />
        </FormControl>

        <FormControl fullWidth>
          <FormLabel>¿Qué pasa ante empate?</FormLabel>
          <Controller
            name="tieResolution"
            control={control}
            render={({ field }) => (
              <>
                <RadioGroup {...field}>
                  <FormControlLabel
                    value="all"
                    control={<Radio />}
                    label="Entregar a TODOS"
                  />
                  <FormControlLabel
                    value="draw"
                    control={<Radio />}
                    label="Hacer un SORTEO"
                  />
                  <FormControlLabel
                    value="first"
                    control={<Radio />}
                    label="Primero en predecir"
                  />
                </RadioGroup>
                <Alert severity="info" sx={{ mt: 1 }}>
                  {tieDescriptions[tieValue]}
                </Alert>
              </>
            )}
          />
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isSubmitting}
          sx={{ mt: 2 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : "Crear Premio"}
        </Button>
      </Box>
    </Paper>
  );
};
