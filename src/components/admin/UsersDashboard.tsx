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
} from "@mui/material";
import { supabase } from "../../lib/supabase";
import { useNotification } from "../../hooks/useNotification";

type UserRole = "admin" | "user" | "data_entry";

interface ProfileRow {
  id: string;
  name: string;
  dni: string;
  role: UserRole;
  created_at: string;
  email: string;
}

export const UsersDashboard: React.FC = () => {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pendingRole, setPendingRole] = useState<{ userId: string; name: string; newRole: UserRole } | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data, error: err } = await supabase
        .rpc("get_users_with_email");

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

  const handleRoleChange = (userId: string, userName: string, newRole: UserRole) => {
    setPendingRole({ userId, name: userName, newRole });
  };

  const confirmRoleChange = async () => {
    if (!pendingRole) return;
    setIsSavingRole(true);
    const { error: err } = await supabase
      .from("profiles")
      .update({ role: pendingRole.newRole })
      .eq("id", pendingRole.userId);
    if (err) {
      addNotification("Error al cambiar el rol", "error");
    } else {
      setUsers((prev) =>
        prev.map((u) => u.id === pendingRole.userId ? { ...u, role: pendingRole.newRole } : u)
      );
      addNotification("Rol actualizado correctamente", "success");
    }
    setIsSavingRole(false);
    setPendingRole(null);
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
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.name}</TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>{u.email}</TableCell>
                  <TableCell>{u.dni || "-"}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      size="small"
                      onChange={(e) => handleRoleChange(u.id, u.name, e.target.value as UserRole)}
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
                </TableRow>
              ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
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

      <Dialog open={!!pendingRole} onClose={() => setPendingRole(null)}>
        <DialogTitle>Cambiar rol</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Cambiar el rol de <strong>{pendingRole?.name}</strong> a{" "}
            <strong>
              {pendingRole?.newRole === "admin" ? "Admin" : pendingRole?.newRole === "data_entry" ? "Data Entry" : "Usuario"}
            </strong>?
          </Typography>
          {pendingRole?.newRole === "admin" && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Este usuario tendrá acceso completo al panel de administración.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingRole(null)} disabled={isSavingRole}>Cancelar</Button>
          <Button onClick={confirmRoleChange} variant="contained" disabled={isSavingRole}>
            {isSavingRole ? <CircularProgress size={20} /> : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
