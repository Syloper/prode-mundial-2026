import React from "react";
import { Container, Paper, Box, Typography, Divider } from "@mui/material";
import { RegisterForm } from "../components/auth/RegisterForm";
import { Link as RouterLink } from "react-router-dom";

export const RegisterPage: React.FC = () => (
  <Box
    sx={{
      minHeight: "100vh",
      backgroundColor: "background.default",
      display: "flex",
      alignItems: "center",
      py: 4,
    }}
  >
    <Container maxWidth="sm">
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, border: "1px solid #E0E7E4" }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            component="img"
            src="https://syloper.com/wp-content/uploads/logo-1.svg"
            alt="Syloper"
            sx={{ height: 36, mb: 2 }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "secondary.main" }}
          >
            Crear cuenta
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            PRODE MUNDIAL 2026
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <RegisterForm />

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            ¿Ya tenés cuenta?{" "}
            <RouterLink
              to="/login"
              style={{ color: "#00B96B", fontWeight: 600, textDecoration: "none" }}
            >
              Iniciá sesión
            </RouterLink>
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ textAlign: "center", mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Powered by{" "}
          <Box
            component="a"
            href="https://syloper.com"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "#00B96B", fontWeight: 600, textDecoration: "none" }}
          >
            Syloper
          </Box>
        </Typography>
      </Box>
    </Container>
  </Box>
);
