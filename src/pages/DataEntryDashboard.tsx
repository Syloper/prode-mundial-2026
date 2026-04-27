import React from "react";
import { Container, Typography, Paper } from "@mui/material";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { MatchResultsLoader } from "../components/admin/MatchResultsLoader";

export const DataEntryDashboard: React.FC = () => (
  <ProtectedRoute allowedRoles={["admin", "data_entry"]}>
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>
        Carga de Resultados
      </Typography>
      <Paper sx={{ p: 0 }}>
        <MatchResultsLoader />
      </Paper>
    </Container>
  </ProtectedRoute>
);
