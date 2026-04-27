import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TablePagination,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { supabase } from "../../lib/supabase";
import { useNotification } from "../../hooks/useNotification";
import { useAuth } from "../../hooks/useAuth";

type UserRole = "admin" | "user" | "data_entry";

interface ProfileRow {
  id: string;
  name: string;
  dni: string;
  role: UserRole;
  created_at: string;
  email: string;
  is_active: boolean;
}

type PendingAction =
  | { type: "role"; userId: string; name: string; newRole: UserRole }
  | { type: "toggle"; user: ProfileRow }
  | { type: "delete"; user: ProfileRow }
  | null;

export const UsersDashboard: React.FC = () => {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isActing, setIsActing] = useState(false);
  const { addNotification } = useNotification();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data, error: err } = await supabase.rpc("get_users_with_email");
      if (err) {
        setError("Error al cargar usuarios");
      } else {
        setUsers(data ?? []);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const filtered = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      !search ||
      u.name.toLowerCase().includes(term) ||
      u.dni.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setIsActing(true);

    try {
      if (pendingAction.type === "role") {
        const { error: err } = await supabase
          .from("profiles")
          .update({ role: pendingAction.newRole })
          .eq("id", pendingAction.userId);
        if (err) throw err;
        setUsers((prev) =>
          prev.map((u) => u.id === pendingAction.userId ? { ...u, role: pendingAction.newRole } : u)
        );
        addNotification("Rol actualizado correctamente", "success");
      }

      if (pendingAction.type === "toggle") {
        const newActive = !pendingAction.user.is_active;
        const { error: err } = await supabase
          .from("profiles")
          .update({ is_active: newActive })
          .eq("id", pendingAction.user.id);
        if (err) throw err;
        setUsers((prev) =>
          prev.map((u) => u.id === pendingAction.user.id ? { ...u, is_active: newActive } : u)
        );
        addNotification(
          newActive ? `${pendingAction.user.name} fue reactivado` : `${pendingAction.user.name} fue desactivado`,
          "success"
        );
      }

      if (pendingAction.type === "delete") {
        const { error: err } = await supabase.rpc("admin_delete_user", {
          target_id: pendingAction.user.id,
        });
        if (err) throw err;
        setUsers((prev) => prev.filter((u) => u.id !== pendingAction.user.id));
        addNotification(`${pendingAction.user.name} fue eliminado`, "success");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al ejecutar la acción";
      addNotification(message, "error");
    } finally {
      setIsActing(false);
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
        Usuarios Registrados
      </Typography>
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Buscar por nombre, email o DNI"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 280 }}
        />
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>DNI</strong></TableCell>
              <TableCell><strong>Rol</strong></TableCell>
              <TableCell><strong>Registrado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <TableRow
                    key={u.id}
                    hover
                    sx={{ opacity: u.is_active ? 1 : 0.5 }}
                  >
                    <TableCell>
                      {u.name}
                      {!u.is_active && (
                        <Chip label="Inactivo" size="small" sx={{ ml: 1, fontSize: "0.65rem" }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>{u.email}</TableCell>
                    <TableCell>{u.dni || "-"}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        size="small"
                        disabled={isSelf}
                        onChange={(e) =>
                          setPendingAction({ type: "role", userId: u.id, name: u.name, newRole: e.target.value as UserRole })
                        }
                        sx={{ fontSize: "0.75rem", minWidth: 110 }}
                      >
                        <MenuItem value="user">Usuario</MenuItem>
                        <MenuItem value="data_entry">Data Entry</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(u.created_at).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title={u.is_active ? "Desactivar" : "Reactivar"}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={isSelf}
                            color={u.is_active ? "warning" : "success"}
                            onClick={() => setPendingAction({ type: "toggle", user: u })}
                          >
                            {u.is_active ? <PauseCircleOutlineIcon fontSize="small" /> : <PlayCircleOutlineIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Eliminar usuario">
                        <span>
                          <IconButton
                            size="small"
                            disabled={isSelf}
                            color="error"
                            onClick={() => setPendingAction({ type: "delete", user: u })}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="Filas:"
      />

      <Dialog open={!!pendingAction} onClose={() => setPendingAction(null)}>
        <DialogTitle>
          {pendingAction?.type === "role" && "Cambiar rol"}
          {pendingAction?.type === "toggle" && (pendingAction.user.is_active ? "Desactivar usuario" : "Reactivar usuario")}
          {pendingAction?.type === "delete" && "Eliminar usuario"}
        </DialogTitle>
        <DialogContent>
          {pendingAction?.type === "role" && (
            <>
              <Typography>
                ¿Cambiar el rol de <strong>{pendingAction.name}</strong> a{" "}
                <strong>
                  {pendingAction.newRole === "admin" ? "Admin" : pendingAction.newRole === "data_entry" ? "Data Entry" : "Usuario"}
                </strong>?
              </Typography>
              {pendingAction.newRole === "admin" && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Este usuario tendrá acceso completo al panel de administración.
                </Alert>
              )}
            </>
          )}
          {pendingAction?.type === "toggle" && (
            <Typography>
              {pendingAction.user.is_active
                ? <>¿Desactivar a <strong>{pendingAction.user.name}</strong>? No podrá iniciar sesión hasta que sea reactivado.</>
                : <>¿Reactivar a <strong>{pendingAction.user.name}</strong>? Podrá volver a iniciar sesión.</>}
            </Typography>
          )}
          {pendingAction?.type === "delete" && (
            <>
              <Typography>
                ¿Eliminar a <strong>{pendingAction.user.name}</strong> ({pendingAction.user.email})?
              </Typography>
              <Alert severity="error" sx={{ mt: 1 }}>
                Esta acción es <strong>irreversible</strong>. Se borrarán su cuenta y todas sus predicciones.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingAction(null)} disabled={isActing}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color={pendingAction?.type === "delete" ? "error" : "primary"}
            disabled={isActing}
          >
            {isActing ? <CircularProgress size={20} /> : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
