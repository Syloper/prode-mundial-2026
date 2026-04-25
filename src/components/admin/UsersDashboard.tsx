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
  Chip,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import { supabase } from "../../lib/supabase";

interface ProfileRow {
  id: string;
  name: string;
  dni: string;
  role: "admin" | "user";
  company_code: string | null;
  created_at: string;
  email?: string;
}

export const UsersDashboard: React.FC = () => {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data, error: err } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at");

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
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(term) ||
      u.dni.toLowerCase().includes(term);
    const matchCompany =
      filterCompany === "all" ||
      (filterCompany === "yes" && !!u.company_code) ||
      (filterCompany === "no" && !u.company_code);
    return matchSearch && matchCompany;
  });

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
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          label="Buscar por nombre o DNI"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Código empresa</InputLabel>
          <Select
            value={filterCompany}
            label="Código empresa"
            onChange={(e) => setFilterCompany(e.target.value)}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="yes">Con código</MenuItem>
            <MenuItem value="no">Sin código</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>DNI</strong></TableCell>
              <TableCell><strong>Rol</strong></TableCell>
              <TableCell><strong>Empresa</strong></TableCell>
              <TableCell><strong>Registrado</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.dni || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.role === "admin" ? "Admin" : "Usuario"}
                      color={u.role === "admin" ? "secondary" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {u.company_code ? (
                      <Chip
                        label={u.company_code}
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip label="Sin código" variant="outlined" size="small" />
                    )}
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
    </Box>
  );
};
