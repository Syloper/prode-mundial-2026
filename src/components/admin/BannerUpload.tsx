import React from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Card,
  CardMedia,
  Stack,
  Divider,
} from "@mui/material";
import { useBanner } from "../../hooks/useBanner";
import { useNotification } from "../../hooks/useNotification";

export const BannerUpload: React.FC = () => {
  const { bannerUrl, previewUrl, setPreviewUrl, publishBanner, clearBanner } =
    useBanner();
  const { addNotification } = useNotification();
  const [urlInput, setUrlInput] = React.useState(bannerUrl ?? "");
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    try {
      if (url) {
        new URL(url);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    } catch {
      // URL parcial, no hacer preview aún
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addNotification("Solo se permiten archivos de imagen", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addNotification("La imagen no puede superar 2MB", "error");
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUrlInput(base64);
      setPreviewUrl(base64);
      addNotification("Imagen cargada correctamente", "success");
      setIsLoading(false);
    };
    reader.onerror = () => {
      addNotification("Error al cargar la imagen", "error");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!urlInput) {
      addNotification("Ingresá una URL o cargá una imagen", "warning");
      return;
    }

    const isValidUrl = (() => {
      try {
        new URL(urlInput);
        return true;
      } catch {
        return false;
      }
    })();

    if (!isValidUrl && !urlInput.startsWith("data:image")) {
      addNotification("URL inválida o imagen no cargada correctamente", "error");
      return;
    }

    setIsLoading(true);
    try {
      await publishBanner(urlInput);
      addNotification("Banner publicado correctamente", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al publicar";
      addNotification(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    try {
      await clearBanner();
      setUrlInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      addNotification("Banner eliminado", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al limpiar";
      addNotification(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const displayUrl = previewUrl ?? bannerUrl;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        gap: 3,
      }}
    >
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Cargar Banner Promocional
        </Typography>

        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Opción 1: URL de imagen
            </Typography>
            <TextField
              label="URL de la imagen"
              placeholder="https://example.com/banner.jpg"
              fullWidth
              value={urlInput.startsWith("data:") ? "" : urlInput}
              onChange={handleUrlChange}
              disabled={isLoading}
              type="url"
              helperText="Ingresá la URL completa"
            />
          </Box>

          <Divider>O</Divider>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Opción 2: Cargar archivo (máx. 2MB)
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isLoading}
              style={{ width: "100%" }}
            />
          </Box>

          {isLoading && (
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress size={24} />
            </Box>
          )}

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={handlePublish}
              disabled={!urlInput || isLoading}
            >
              Publicar Banner
            </Button>
            {bannerUrl && (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleClear}
                disabled={isLoading}
              >
                Eliminar
              </Button>
            )}
          </Stack>

          {bannerUrl && (
            <Alert severity="success">
              Banner activo visible en todas las páginas.
            </Alert>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Previsualización
        </Typography>

        {displayUrl ? (
          <Card sx={{ flexGrow: 1 }}>
            <CardMedia
              component="img"
              image={displayUrl}
              alt="Banner preview"
              sx={{ width: "100%", height: "300px", objectFit: "cover" }}
            />
          </Card>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              backgroundColor: "#f5f5f5",
              border: "2px dashed #ccc",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "300px",
            }}
          >
            <Typography color="textSecondary">
              La previsualización aparecerá aquí
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
