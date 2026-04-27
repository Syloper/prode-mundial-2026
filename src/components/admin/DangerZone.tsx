import React, { useEffect, useRef, useState } from "react";
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
  LinearProgress,
} from "@mui/material";
import { supabase } from "../../lib/supabase";
import { useNotification } from "../../hooks/useNotification";
import { useMatches } from "../../hooks/useMatches";

interface ProfileRow {
  id: string;
  name: string;
  dni: string;
}

type ConfirmAction = "resetMatches" | "clearPredictions" | "restoreBackup" | null;

interface BackupFile {
  version: number;
  createdAt: string;
  matches: Record<string, unknown>[];
  predictions: Record<string, unknown>[];
  profiles: Record<string, unknown>[];
}

export const DangerZone: React.FC = () => {
  const { addNotification } = useNotification();
  const { refetch } = useMatches();

  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const [matchesRes, predictionsRes, profilesRes] = await Promise.all([
        supabase.from("matches").select("*").order("id"),
        supabase.from("predictions").select("*"),
        supabase.from("profiles").select("id, name, dni, role, created_at").order("created_at"),
      ]);

      if (matchesRes.error) throw matchesRes.error;
      if (predictionsRes.error) throw predictionsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const backup: BackupFile = {
        version: 1,
        createdAt: new Date().toISOString(),
        matches: matchesRes.data ?? [],
        predictions: predictionsRes.data ?? [],
        profiles: profilesRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      a.href = url;
      a.download = `prode-backup-${ts}.json`;
      a.click();
      URL.revokeObjectURL(url);

      addNotification(
        `Backup generado: ${backup.matches.length} partidos, ${backup.predictions.length} predicciones, ${backup.profiles.length} usuarios`,
        "success"
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al generar el backup";
      addNotification(message, "error");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as BackupFile;
        if (!parsed.version || !parsed.matches || !parsed.predictions || !parsed.profiles) {
          addNotification("Archivo de backup inválido", "error");
          return;
        }
        setPendingBackup(parsed);
        setConfirmAction("restoreBackup");
      } catch {
        addNotification("No se pudo leer el archivo", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRestore = async () => {
    if (!pendingBackup) return;
    setIsLoading(true);
    setConfirmAction(null);
    try {
      // Restaurar partidos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: eMatches } = await supabase
        .from("matches")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(pendingBackup.matches as any[], { onConflict: "id" });
      if (eMatches) throw eMatches;

      // Restaurar predicciones: borrar todas y reinsertar
      await supabase.from("predictions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (pendingBackup.predictions.length > 0) {
        const { error: ePred } = await supabase
          .from("predictions")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(pendingBackup.predictions as any[]);
        if (ePred) throw ePred;
      }

      // Restaurar roles y nombres de perfiles (no sobreescribe auth)
      const profileUpdates = pendingBackup.profiles.map((p) => ({
        id: p.id as string,
        name: p.name as string,
        dni: p.dni as string,
        role: p.role as "admin" | "user" | "data_entry",
      }));
      const { error: eProfiles } = await supabase
        .from("profiles")
        .upsert(profileUpdates, { onConflict: "id" });
      if (eProfiles) throw eProfiles;

      await refetch();
      addNotification(
        `Restauración completa desde backup del ${new Date(pendingBackup.createdAt).toLocaleString("es-AR")}`,
        "success"
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al restaurar";
      addNotification(message, "error");
    } finally {
      setIsLoading(false);
      setPendingBackup(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Alert severity="warning" sx={{ mb: 3 }}>
        Las acciones de esta sección son <strong>irreversibles</strong>. Usalas con cuidado.
      </Alert>

      {/* Backup y restauración */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
          Backup de datos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Descarga un archivo JSON con todos los partidos, predicciones y perfiles. Podés usarlo para restaurar ese estado en el futuro.
        </Typography>
        {isBackingUp && <LinearProgress sx={{ mb: 1 }} />}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="primary"
            disabled={isBackingUp || isLoading}
            onClick={handleBackup}
            startIcon={isBackingUp ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isBackingUp ? "Generando..." : "Descargar backup"}
          </Button>
          <Button
            variant="outlined"
            color="warning"
            disabled={isBackingUp || isLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            Restaurar desde backup
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

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
      <Dialog open={confirmAction !== null} onClose={() => { setConfirmAction(null); setPendingBackup(null); }}>
        <DialogTitle>¿Estás seguro?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === "resetMatches" &&
              "Se van a borrar los resultados de TODOS los partidos. Esta acción no se puede deshacer."}
            {confirmAction === "clearPredictions" &&
              `Se van a eliminar TODAS las predicciones de ${selectedUser?.name}. Esta acción no se puede deshacer.`}
            {confirmAction === "restoreBackup" && pendingBackup && (
              <>
                Se va a restaurar el estado del backup del{" "}
                <strong>{new Date(pendingBackup.createdAt).toLocaleString("es-AR")}</strong>:
                <ul style={{ margin: "8px 0 0" }}>
                  <li>{pendingBackup.matches.length} partidos (se sobreescriben resultados)</li>
                  <li>{pendingBackup.predictions.length} predicciones (se reemplazan todas)</li>
                  <li>{pendingBackup.profiles.length} perfiles (nombre, DNI y rol)</li>
                </ul>
                Esta acción no se puede deshacer. Se recomienda hacer un backup del estado actual primero.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmAction(null); setPendingBackup(null); }}>Cancelar</Button>
          <Button
            onClick={confirmAction === "restoreBackup" ? handleRestore : handleConfirm}
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
