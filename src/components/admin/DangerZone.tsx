import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Autocomplete,
  TextField,
} from "@mui/material";
import { supabase } from "../../lib/supabase";
import { useNotification } from "../../hooks/useNotification";
import { useMatches } from "../../hooks/useMatches";

interface ProfileRow {
  id: string;
  name: string;
  dni: string;
}

type ConfirmAction = "resetMatches" | "clearPredictions" | null;

export const DangerZone: React.FC = () => {
  const { addNotification } = useNotification();
  const { refetch } = useMatches();

  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, name, dni")
      .order("name")
      .then(({ data }) => setUsers(data ?? []));
  }, []);

  const handleConfirm = async () => {
    setIsLoading(true);
    setConfirmAction(null);

    try {
      if (confirmAction === "resetMatches") {
        const { error } = await supabase
          .from("matches")
          .update({ home_score: null, away_score: null, is_finished: false })
          .neq("id", 0); // afecta todas las filas
        if (error) throw error;
        await refetch();
        addNotification("Todos los resultados fueron reiniciados", "success");
      }

      if (confirmAction === "clearPredictions") {
        if (!selectedUser) return;
        const { error } = await supabase
          .from("predictions")
          .delete()
          .eq("user_id", selectedUser.id);
        if (error) throw error;
        addNotification(
          `Predicciones de ${selectedUser.name} eliminadas correctamente`,
          "success"
        );
        setSelectedUser(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al ejecutar la acción";
      addNotification(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Alert severity="warning" sx={{ mb: 3 }}>
        Las acciones de esta sección son <strong>irreversibles</strong>. Usalas con cuidado.
      </Alert>

      {/* Reiniciar resultados */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
          Reiniciar resultados de partidos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pone todos los goles en null y marca todos los partidos como no finalizados. Las predicciones de los usuarios no se tocan.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          disabled={isLoading}
          onClick={() => setConfirmAction("resetMatches")}
        >
          Reiniciar todos los resultados
        </Button>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Vaciar predicciones de usuario */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
          Vaciar predicciones de un usuario
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Elimina todas las predicciones cargadas por el usuario seleccionado.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Autocomplete
            options={users}
            getOptionLabel={(u) => `${u.name} (${u.dni || "sin DNI"})`}
            value={selectedUser}
            onChange={(_, v) => setSelectedUser(v)}
            sx={{ minWidth: 300 }}
            renderInput={(params) => (
              <TextField {...params} label="Seleccioná un usuario" size="small" />
            )}
          />
          <Button
            variant="outlined"
            color="error"
            disabled={!selectedUser || isLoading}
            onClick={() => setConfirmAction("clearPredictions")}
          >
            Vaciar predicciones
          </Button>
        </Box>
      </Box>

      {/* Dialog de confirmación */}
      <Dialog open={confirmAction !== null} onClose={() => setConfirmAction(null)}>
        <DialogTitle>¿Estás seguro?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === "resetMatches"
              ? "Se van a borrar los resultados de TODOS los partidos. Esta acción no se puede deshacer."
              : `Se van a eliminar TODAS las predicciones de ${selectedUser?.name}. Esta acción no se puede deshacer.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            color="error"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
