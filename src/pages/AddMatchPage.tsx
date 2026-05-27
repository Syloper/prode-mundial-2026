import React from "react";
import { Container } from "@mui/material";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { AddMatchForm } from "../components/admin/AddMatchForm";

export const AddMatchPage: React.FC = () => (
  <ProtectedRoute adminOnly>
    <Container maxWidth="md" sx={{ py: 4 }}>
      <AddMatchForm />
    </Container>
  </ProtectedRoute>
);
