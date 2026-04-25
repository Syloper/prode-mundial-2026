import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";
import { usePrize } from "../../hooks/usePrize";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { supabase } from "../../lib/supabase";
import { Prize } from "../../types";

interface ProfileRow {
  id: string;
  name: string;
}

const criteriaLabel: Record<string, string> = {
  most_points_date: "Más puntos - Fecha",
  most_points_phase: "Más puntos - Fase",
  most_points_tournament: "Más puntos - Torneo",
};

export const PrizeAssignment: React.FC = () => {
  const { prizes, assignPrize } = usePrize();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "user")
      .order("name")
      .then(({ data }) => {
        if (data) setProfiles(data);
      });
  }, []);

  const handleOpenDialog = (prize: Prize) => {
    setSelectedPrize(prize);
    setSelectedUserId("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPrize(null);
    setSelectedUserId("");
  };

  const handleAssignPrize = async () => {
    if (!selectedPrize || !selectedUserId || !user) {
      addNotification("Seleccioná un usuario", "error");
      return;
    }

    const selectedProfile = profiles.find((p) => p.id === selectedUserId);
    if (!selectedProfile) {
      addNotification("Usuario no encontrado", "error");
      return;
    }

    setIsAssigning(true);
    try {
      await assignPrize({
        prizeId: selectedPrize.id,
        userId: selectedUserId,
        userName: selectedProfile.name,
        criteria: selectedPrize.criteria,
        phase: selectedPrize.phase,
        assignedBy: user.id,
      });
      addNotification(`Premio entregado a ${selectedProfile.name}`, "success");
      handleCloseDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al asignar";
      addNotification(message, "error");
    } finally {
      setIsAssigning(false);
    }
  };

  if (prizes.length === 0) {
    return (
      <Alert severity="info">No hay premios creados aún. Creá uno primero.</Alert>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 3,
      }}
    >
      {prizes.map((prize) => (
        <Card key={prize.id} sx={{ display: "flex", flexDirection: "column" }}>
          {prize.photoUrl && (
            <CardMedia
              component="img"
              height="200"
              image={prize.photoUrl}
              alt={prize.name}
            />
          )}
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {prize.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {prize.description}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
              <Chip
                label={criteriaLabel[prize.criteria]}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={prize.assignmentType === "automatic" ? "Automático" : "Manual"}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Typography variant="caption" sx={{ color: "#666" }}>
              Empate:{" "}
              {prize.tieResolution === "all"
                ? "Todos"
                : prize.tieResolution === "draw"
                ? "Sorteo"
                : "Primero"}
            </Typography>
          </CardContent>
          {prize.assignmentType === "manual" && (
            <Box sx={{ p: 2, borderTop: "1px solid #eee" }}>
              <Button
                variant="contained"
                fullWidth
                size="small"
                onClick={() => handleOpenDialog(prize)}
              >
                Entregar Premio
              </Button>
            </Box>
          )}
        </Card>
      ))}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Entregar: {selectedPrize?.name}</DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Seleccionar Usuario</InputLabel>
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              label="Seleccionar Usuario"
            >
              {profiles.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isAssigning}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssignPrize}
            variant="contained"
            disabled={isAssigning || !selectedUserId}
          >
            {isAssigning ? <CircularProgress size={20} /> : "Entregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
