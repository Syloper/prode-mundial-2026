import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Card,
  CardHeader,
  CardContent,
  Alert,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useCompany } from "../../hooks/useCompany";
import { useNotification } from "../../hooks/useNotification";

export const CompanyConfigComponent: React.FC = () => {
  const { company, updateCompany } = useCompany();
  const { addNotification } = useNotification();
  const [companyName, setCompanyName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (company?.name) {
      setCompanyName(company.name);
    }
  }, [company]);

  const handleSave = async () => {
    if (!companyName.trim()) {
      addNotification("El nombre no puede estar vacío", "error");
      return;
    }

    setIsSaving(true);
    try {
      await updateCompany(companyName.trim());
      addNotification("Configuración actualizada", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al guardar";
      addNotification(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Configuración de Empresa" />
      <CardContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          El nombre aparece en la barra de navegación junto a "PRODE 2026".
        </Alert>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nombre de la Empresa"
            placeholder="Ej: Acme Corporation"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            fullWidth
          />

          {company?.name && (
            <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Configuración actual:
              </Typography>
              <Typography variant="h6">PRODE 2026 — {company.name}</Typography>
              {company.updatedAt && (
                <Typography
                  variant="caption"
                  sx={{ color: "#999", display: "block", mt: 1 }}
                >
                  Última actualización:{" "}
                  {new Date(company.updatedAt).toLocaleString("es-AR")}
                </Typography>
              )}
            </Box>
          )}

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <CircularProgress size={20} /> : "Guardar"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
